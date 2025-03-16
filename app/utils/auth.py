from functools import wraps
from flask import request, redirect, make_response
from app.utils.jwt import jwt_token_valid
from app.extensions import db


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if (user := jwt_token_valid(token=request.cookies.get("auth_token"))) and (
            db.execute("SELECT id FROM users WHERE id=?", (user["id"],))
        ):
            return f(user, *args, **kwargs)  # Return `user` into route
        else:
            response = make_response(redirect("/login"))
            for cookie in request.cookies:
                response.set_cookie(
                    cookie,
                    "",
                    expires=0,
                    httponly=True,
                    secure=True,
                    samesite="Strict",
                    max_age=0,
                )
            return response

    return decorated_function


def is_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if (user := jwt_token_valid(token=request.cookies.get("auth_token"))) and (
            db.execute("SELECT id FROM users WHERE id=?", (user["id"],))
        ):
            return redirect("/")
        response = make_response(f(*args, **kwargs))
        for cookie in request.cookies:
            response.set_cookie(
                cookie,
                "",
                expires=0,
                httponly=True,
                secure=True,
                samesite="Strict",
                max_age=0,
            )
        return response

    return decorated_function
