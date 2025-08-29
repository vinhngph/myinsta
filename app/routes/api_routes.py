from flask import Blueprint, request, json
from app.utils.auth import login_required
from app.services.post_services import PostServices
from app.services.user_services import UserServices
from app.extensions import socketio

api_bp = Blueprint("api_bp", __name__)


@api_bp.route("/post", methods=["POST"])
@login_required
def new_post(user):
    file = request.files["file"]
    description = request.form.get("description")
    return PostServices.new_post(user=user, file=file, description=description)


@api_bp.route("/valid/email", methods=["POST"])
def valid_email():
    email = request.json.get("email")
    return UserServices.valid_email(email=email)


@api_bp.route("/valid/username", methods=["POST"])
def valid_username():
    username = request.json.get("username")
    return UserServices.valid_username(username=username)


@api_bp.route("/valid/name", methods=["POST"])
def valid_name():
    name = request.json.get("name")
    return UserServices.valid_name(name=name)


@api_bp.route("/valid/password", methods=["POST"])
def valid_password():
    pwd = request.json.get("password")
    return UserServices.valid_password(pwd)


@api_bp.route("/home")
@login_required
def home_post(user):
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    return PostServices.get_home_posts(user=user, limit=limit, offset=offset)


@api_bp.route("/user/posts")
@login_required
def user_posts(user):
    limit = request.args.get("l")
    offset = request.args.get("o")
    username = request.args.get("u")
    return PostServices.get_user_posts(
        user=user, username=username, limit=limit, offset=offset
    )


@api_bp.route("/user/follow", methods=["PUT"])
@login_required
def user_follow(user):
    data = request.get_json()
    return UserServices.follow(user=user, data=data)


@api_bp.route("/post/like", methods=["PUT"])
@login_required
def post_like(user):
    data = request.get_json()
    return PostServices.like(user=user, data=data)


@api_bp.route("/post/comments", methods=["GET", "PUT"])
@login_required
def post_comment(user):
    if request.method == "GET":
        post_id = request.args.get("pid")
        return PostServices.get_post_comments(post_id=post_id)

    if request.method == "PUT":
        data = request.get_json()
        return UserServices.comment(user=user, data=data, socketio=socketio)


@api_bp.route("/search")
def search():
    query = request.args.get("q")
    return UserServices.find_by_username(query=query)
