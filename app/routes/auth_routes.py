from flask import Blueprint, request
from app.services.user_services import UserServices
from app.utils.auth import login_required

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    identifier = request.form.get("identifier")
    password = request.form.get("password")
    token = request.form.get("token")
    return UserServices.login(identifier=identifier, password=password, token=token)


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


@auth_bp.route("/totp-discard", methods=["DELETE"])
@login_required
def totp_discard(user):
    return UserServices.discard_totp(user)


@auth_bp.route("/totp-deactivate", methods=["DELETE"])
@login_required
def totp_deactivate(user):
    return UserServices.totp_deactivate(user)


@auth_bp.route("/verify-totp", methods=["POST"])
@login_required
def verify_totp(user):
    token = request.form.get("token")
    return UserServices.verify_totp(user, token)
