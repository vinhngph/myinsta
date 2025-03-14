from flask import Blueprint, render_template, request, redirect, make_response

from app.utils.auth import login_required
from app.utils.jwt import jwt_token_valid
from app.services.user_services import UserServices

main_bp = Blueprint("main_bp", __name__)


@main_bp.route("/")
@login_required
def home(user):
    return render_template("index.html", user=user)


@main_bp.route("/login")
def login():
    if jwt_token_valid(request.cookies.get("auth_token")):
        return redirect("/")
    else:
        response = make_response(render_template("login.html"))
        response.set_cookie("auth_token", "", expires=0, max_age=0)
        return response


@main_bp.route("/register")
def register():
    if jwt_token_valid(request.cookies.get("auth_token")):
        return redirect("/")
    else:
        response = make_response(render_template("register.html"))
        response.set_cookie("auth_token", "", expires=0, max_age=0)
        return response


@main_bp.route("/<path:path>")
@login_required
def profile(user, path):
    return UserServices.get_profile(user=user, path=path)
