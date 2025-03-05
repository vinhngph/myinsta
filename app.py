from flask import (
    Flask,
    render_template,
    request,
    redirect,
    abort,
    make_response,
    send_from_directory,
    jsonify,
    url_for,
)
from werkzeug.security import generate_password_hash, check_password_hash
import os
import dotenv

from sql import SQL
import utils

dotenv.load_dotenv()


db = SQL("database.db")

app = Flask(__name__)

CONTENT_FOLDER = os.getenv("CONTENT_FOLDER")
os.makedirs(CONTENT_FOLDER, exist_ok=True)
app.config["CONTENT_FOLDER"] = CONTENT_FOLDER


@app.route("/")
def index():
    token = request.cookies.get("auth_token")

    if token and (user := utils.jwt_token_valid(token=token)):
        return render_template("index.html", user=user)
    else:
        return redirect("/login")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        if utils.jwt_token_valid(request.cookies.get("auth_token")):
            return redirect("/")
        return render_template("login.html")
    elif request.method == "POST":
        email = request.form.get("email")
        if not email:
            abort(400)

        password = request.form.get("password")
        if not password:
            abort(400)

        rows = db.execute("SELECT * FROM users WHERE email=?", (email,))

        if len(rows) != 1 or not check_password_hash(
            rows[0]["password"], password=password
        ):
            abort(403)

        user = rows[0]
        del user["password"]

        token = utils.jwt_new_token(user)

        response = make_response(redirect("/"))
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600,
        )

        return response


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        if utils.jwt_token_valid(request.cookies.get("auth_token")):
            return redirect("/")
        return render_template("register.html")
    elif request.method == "POST":
        email = request.form.get("email")
        if not email:
            abort(400)

        isEmail = db.execute("SELECT email FROM users WHERE email=?", (email,))
        # check email existed or not
        if isEmail:
            abort(409)

        password = request.form.get("password")
        if not password:
            abort(400)

        confirm = request.form.get("confirm")
        if not confirm:
            abort(400)
        # check password match or not
        if password != confirm:
            abort(401)

        db.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (email, generate_password_hash(password=password)),
        )

        user = db.execute("SELECT id, email FROM users WHERE email=?", (email,))
        if not user:
            return redirect("/login")

        token = utils.jwt_new_token(user[0])

        response = make_response(redirect("/"))
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600,
        )

        return response


@app.route("/logout")
def logout():
    response = make_response(redirect("/"))
    response.set_cookie("auth_token", expires=0)
    return response


# Features
@app.route("/post", methods=["GET", "POST", "PUT", "DELETE"])
def post():
    if request.method == "POST":
        token = request.cookies.get("auth_token")

        if token and (user := utils.jwt_token_valid(token=token)):
            # handle file upload
            if "file" not in request.files:
                abort(400)
            file = request.files["file"]
            if file.filename == "":
                abort(400)

            # handle description
            description = request.form.get("description")
            if not description:
                abort(400)

            post_id = utils.generate_unique_post_id(db=db)
            file_ext = os.path.splitext(file.filename)[1]
            filename = f"{post_id}{file_ext}"

            file_path = os.path.join(app.config["CONTENT_FOLDER"], filename)

            try:
                db.execute(
                    "INSERT INTO posts (id, user_id, description, attachment) VALUES (?, ?, ?, ?)",
                    (post_id, user["id"], description, file.filename),
                )
            except:
                abort(500)

            file.save(file_path)

            return "", 201
        else:
            return redirect("/login")
    elif request.method == "GET":
        limit = request.args.get("limit")
        offset = request.args.get("offset")
        if not limit or not offset:
            abort(400)

        posts = db.execute(
            "SELECT posts.id, posts.description, posts.created_on, posts.user_id FROM posts JOIN users ON posts.user_id=users.id LIMIT ? OFFSET ?",
            (limit, offset),
        )

        if not posts:
            abort(404)

        for post in posts:
            post["attachment"] = url_for("cdn", id=post["id"], _external=True)
        return jsonify(posts)

@app.route("/cdn")
def cdn():
    id = request.args.get("id")
    if not id:
        abort(400)

    filename = db.execute("SELECT attachment FROM posts WHERE id=?", (id,))
    if not filename:
        abort(404)

    filename = filename[0]["attachment"]
    file_ext = os.path.splitext(filename)[1]
    return send_from_directory(
        CONTENT_FOLDER, f"{id}{file_ext}", as_attachment=False, download_name=filename
    )
