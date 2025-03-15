from flask import jsonify, url_for
import os

from app.extensions import db
from app.utils.uuid import generate_unique_post_id
from config import Config


class PostServices:
    @staticmethod
    def new_post(user, file, description):
        # Handle file upload
        if (
            not file
            or file.filename == ""
            or not (
                file.mimetype.startswith("image/") or file.mimetype.startswith("video/")
            )
        ):
            return jsonify({"message": "Wrong file."}), 400

        # Handle description
        if not description:
            return jsonify({"message": "Missing descripton."}), 400

        post_id = generate_unique_post_id(db=db)
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{post_id}{file_ext}"

        file_path = os.path.join("app", Config.CONTENT_FOLDER, filename)

        try:
            db.execute(
                "INSERT INTO posts (id, user_id, description, attachment) VALUES (?, ?, ?, ?)",
                (post_id, user["id"], description, file.filename),
            )
            file.save(file_path)
            return jsonify({"message": "Success."}), 201
        except Exception as e:
            return jsonify({"message": "Server error."}), 500

    @staticmethod
    def get_home_posts(user, limit, offset):
        if not limit or not offset:
            return jsonify({"message": "missing limit or offset"}), 400

        try:
            posts = db.execute(
                "SELECT p.id, p.description, p.created_on, u.username, p.user_id FROM posts AS p JOIN users AS u ON p.user_id=u.id JOIN user_follow AS uf ON p.user_id=uf.following WHERE uf.follower=? LIMIT ? OFFSET ?",
                (user["id"], limit, offset),
            )
            if not posts:
                return jsonify({"message": "Not found"}), 204
            for post in posts:
                post["attachment"] = url_for(
                    "cdn_bp.attachment", id=post["id"], _external=True
                )

                is_liked = (
                    True
                    if db.execute(
                        "SELECT user_id FROM post_likes WHERE user_id=? AND post_id=?",
                        (user["id"], post["id"]),
                    )
                    else False
                )
                post["is_liked"] = is_liked
            return jsonify(posts), 200
        except:
            return jsonify({"message": "Server error."}), 500

    @staticmethod
    def get_user_posts(user, username, limit, offset):
        if not limit or not offset or not username or not user:
            return jsonify({"message": "Missing parameters."}), 400
        # ----------------------------------------------------------------
        # Get user's posts
        try:
            user_id = db.execute("SELECT id FROM users WHERE username=?", (username,))
            if not user_id:
                return jsonify({"message": "User not found."}), 404
            user_id = user_id[0]["id"]
            posts = db.execute(
                "SELECT p.id, p.description, p.created_on, u.username, p.user_id FROM posts AS p JOIN users AS u ON p.user_id=u.id WHERE p.user_id=? LIMIT ? OFFSET ?",
                (user_id, limit, offset),
            )
            if not posts:
                return jsonify({"message": "Posts not found."}), 204

            for post in posts:
                post["attachment"] = url_for(
                    "cdn_bp.attachment", id=post["id"], _external=True
                )
                is_liked = (
                    True
                    if db.execute(
                        "SELECT user_id FROM post_likes WHERE user_id=? AND post_id=?",
                        (user["id"], post["id"]),
                    )
                    else False
                )
                post["is_liked"] = is_liked
            return jsonify(posts)
        except:
            return jsonify({"message": "Server error."}), 500

    @staticmethod
    def like(user, data):
        if not data:
            return jsonify({"message": "Missing data."}), 400
        post_id = data.get("pid")
        if not post_id:
            return jsonify({"message": "Missing data."}), 400

        try:
            if db.execute(
                "SELECT user_id FROM post_likes WHERE user_id=? AND post_id=?",
                (user["id"], post_id),
            ):
                db.execute(
                    "DELETE FROM post_likes WHERE user_id=? AND post_id=?",
                    (user["id"], post_id),
                )
                return jsonify({"pid": post_id, "status": False}), 200
            else:
                db.execute(
                    "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)",
                    (post_id, user["id"]),
                )
                return jsonify({"pid": post_id, "status": True}), 200
        except Exception as e:
            return jsonify({"message": "Server error."}), 500

    @staticmethod
    def get_post_comments(post_id):
        if not (post_id):
            return jsonify({"message": "Missing data."}), 400

        try:
            rs = db.execute(
                "SELECT u.username, uc.content FROM post_comments AS pc JOIN user_comments AS uc ON pc.comment_id=uc.id JOIN users AS u ON uc.user_id=u.id WHERE pc.post_id=?",
                (post_id,),
            )
            return jsonify(rs), 200
        except:
            return jsonify({"message": "Server error."}), 500
