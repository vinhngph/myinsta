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
from email_validator import validate_email, EmailNotValidError

from sql import SQL
import utils
from auth import login_required

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
        else:
            response = make_response(render_template("login.html"))
            response.set_cookie("auth_token", "", expires=0, max_age=0)
            return response
    elif request.method == "POST":
        if not (username := request.form.get("username")) or not (
            password := request.form.get("password")
        ):
            return redirect("/login")

        rows = db.execute(
            "SELECT u.id, u.username, u.email, u.password,ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.username=?",
            (username,),
        )

        if len(rows) != 1 or not check_password_hash(
            rows[0]["password"], password=password
        ):
            return redirect("/login")

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
        else:
            response = make_response(render_template("register.html"))
            response.set_cookie("auth_token", "", expires=0, max_age=0)
            return response

    elif request.method == "POST":
        # Handle email
        try:
            if (
                not (email := request.form.get("email"))
                or not validate_email(email)
                or db.execute("SELECT email FROM users WHERE email=?", (email,))
            ):
                return jsonify({"message": "missing input or email existed!"}), 400
        except EmailNotValidError:
            return jsonify({"message": "missing input or email existed!"}), 400
        # ------------------------------------------------------------------------
        # Handle username
        if not (username := request.form.get("username")) or db.execute(
            "SELECT username FROM users WHERE username=?", (username,)
        ):
            return jsonify({"message": "missing input or username existed!"}), 400
        # ------------------------------------------------------------------------
        # Handle password
        if (
            not (password := request.form.get("password"))
            or not (confirm := request.form.get("confirm"))
            or password != confirm
        ):
            return jsonify({"message": "missing input or password not match!"}), 400
        # ------------------------------------------------------------------------
        # Handle user's informations
        if not (name := request.form.get("name")):
            return jsonify({"message": "missing input name!"}), 400
        # ------------------------------------------------------------------------
        # Execute database
        try:
            # Adding new user account
            user_id = db.execute(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                (username, email, generate_password_hash(password=password)),
            )
            # Adding new user's informations
            db.execute(
                "INSERT INTO user_informations (user_id, name) VALUES (?, ?)",
                (user_id, name),
            )
        except:
            return jsonify({"message": "error when creating new user!"}), 400
        # ------------------------------------------------------------------------
        user = db.execute(
            "SELECT u.id, u.username, u.email, ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.username=?",
            (username,),
        )
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
    response.set_cookie("auth_token", expires=0, max_age=0)
    return response


# Features
@app.route("/post", methods=["GET", "POST", "PUT", "DELETE"])
def post():
    # Require login
    if not (token := request.cookies.get("auth_token")) or not (
        user := utils.jwt_token_valid(token=token)
    ):
        return jsonify({"message": "Please login!"}), 401

    if request.method == "POST":
        # Handle file upload
        file = request.files["file"]
        if (
            not file
            or file.filename == ""
            or not (
                file.mimetype.startswith("image/") or file.mimetype.startswith("video/")
            )
        ):
            return "", 400

        # Handle description
        if not (description := request.form.get("description")):
            return "", 400

        post_id = utils.generate_unique_post_id(db=db)
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{post_id}{file_ext}"

        file_path = os.path.join(app.config["CONTENT_FOLDER"], filename)

        try:
            db.execute(
                "INSERT INTO posts (id, user_id, description, attachment) VALUES (?, ?, ?, ?)",
                (post_id, user["id"], description, file.filename),
            )
            file.save(file_path)
            return "", 201
        except:
            return "", 500


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


# List APIs
@app.route("/api/valid/email")
def valid_email():
    email = request.args.get("v")
    # Check empty
    if not email:
        return jsonify({"message": "Unacceptable"}), 400
    # Check exist
    try:
        if validate_email(email) and not db.execute(
            "SELECT email FROM users WHERE email=?", (email,)
        ):
            return jsonify({"message": "Acceptable"}), 200
        else:
            return jsonify({"message": "Unacceptable"}), 400
    except EmailNotValidError:
        return jsonify({"message": "Unacceptable"}), 400


@app.route("/api/valid/username")
def valid_username():
    username = request.args.get("v")
    # Check empty
    if not username:
        return jsonify({"message": "Unacceptable"}), 400
    # Check exist
    try:
        if db.execute("SELECT username FROM users WHERE username=?", (username,)):
            return jsonify({"message": "Unacceptable"}), 400
        else:
            return jsonify({"message": "Acceptable"}), 200
    except:
        return jsonify({"message": "Unacceptable"}), 400


@app.route("/api/home")
@login_required
def home_post(_):
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    if not limit or not offset:
        return jsonify({"message": "missing limit or offset"}), 400

    try:
        posts = db.execute(
            "SELECT p.id, p.description, p.created_on, u.username FROM posts AS p JOIN users AS u ON p.user_id=u.id LIMIT ? OFFSET ?",
            (limit, offset),
        )
        if not posts:
            return jsonify({"message": "Not found"}), 404
        for post in posts:
            post["attachment"] = url_for("cdn", id=post["id"], _external=True)
        return jsonify(posts), 200
    except:
        return jsonify({"message": "Server error"}), 500


@app.route("/api/user/posts")
def user_posts():
    # Parameters
    limit = request.args.get("l")
    offset = request.args.get("o")
    username = request.args.get("u")
    if not limit or not offset or not username:
        abort(400)
    # ----------------------------------------------------------------
    # Get user's posts
    try:
        user_id = db.execute("SELECT id FROM users WHERE username=?", (username,))
        if not user_id:
            abort(404)
        user_id = user_id[0]["id"]
        posts = db.execute(
            "SELECT p.id, p.description, p.created_on FROM posts AS p WHERE p.user_id=? LIMIT ? OFFSET ?",
            (user_id, limit, offset),
        )
        if not posts:
            abort(404)

        for post in posts:
            post["attachment"] = url_for("cdn", id=post["id"], _external=True)
        return jsonify(posts)
    except:
        return abort(404)


# User profile
@app.route("/<path:path>")
def profile(path):
    user_id = db.execute("SELECT id FROM users WHERE username=?", (str(path),))
    if not user_id:
        abort(404)
    user_id = user_id[0]["id"]

    count_posts = db.execute(
        "SELECT COUNT(id) AS count FROM posts WHERE user_id=?", (user_id,)
    )[0]["count"]

    name = db.execute("SELECT name FROM user_informations WHERE user_id=?", (user_id,))[
        0
    ]["name"]

    user = {"username": str(path), "name": name, "count_posts": count_posts}
    return render_template("profile.html", user=user)
