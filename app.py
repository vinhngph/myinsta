from flask import Flask, render_template, request, redirect, abort, make_response
from werkzeug.security import generate_password_hash, check_password_hash

from sql import SQL
import utils


db = SQL("database.db")

app = Flask(__name__)


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
    return "hello"


@app.route("/news")
def news():
    return "hello"
