from flask import Blueprint, render_template, request, redirect, make_response

from app.utils.auth import login_required, is_login
from app.utils.jwt import jwt_token_valid
from app.services.user_services import UserServices

main_bp = Blueprint("main_bp", __name__)


@main_bp.route("/")
@login_required
def home(user):
    return render_template("index.html", user=user)


@main_bp.route("/login")
@is_login
def login():
    return make_response(render_template("login.html"))


@main_bp.route("/register")
@is_login
def register():
    return make_response(render_template("register.html"))


@main_bp.route("/<path:path>")
@login_required
def profile(user, path):
    return UserServices.get_profile(user=user, path=path)
