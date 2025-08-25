from flask import Blueprint, request
from app.services.user_services import UserServices
from app.utils.auth import login_required

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    return UserServices.login(username=username, password=password)


@auth_bp.route("/register", methods=["POST"])
def register():
    email = request.form.get("email")
    username = request.form.get("username")
    password = request.form.get("password")
    confirm = request.form.get("confirm")
    name = request.form.get("name")
    return UserServices.register(
        email=email,
        username=username,
        password=password,
        confirm=confirm,
        name=name,
    )


@auth_bp.route("/logout", methods=["GET"])
def logout():
    return UserServices.logout()


@auth_bp.route("/totp-active", methods=["POST"])
@login_required
def totp_active(user):
    return UserServices.enable_totp(user)


@auth_bp.route("/verify-totp", methods=["POST"])
def verify_totp():
    username = request.form.get("username")
    token = request.form.get("token")
    return UserServices.verify_totp(username, token)
