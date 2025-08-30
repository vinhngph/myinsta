from flask import redirect, make_response, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
from pyotp import TOTP, random_base32
from qrcode import make as qr_make
from io import BytesIO
from base64 import b64encode

from app.extensions import db
from app.utils.jwt import jwt_new_token
from app.utils.uuid import generate_unique_comment_id
import app.utils.validator as validator


class UserServices:
    @staticmethod
    def login(identifier, password, token):
        if not (identifier or password):
            return redirect("/login")

        if validator.is_email(identifier):
            rows = db.execute(
                "SELECT u.id, u.username, u.email, u.password, u.totp, ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.email=?",
                (identifier,),
            )
        elif validator.is_username(identifier):
            rows = db.execute(
                "SELECT u.id, u.username, u.email, u.password, u.totp, ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.username=?",
                (identifier,),
            )
        else:
            return redirect("/login")

        if len(rows) != 1 or not check_password_hash(
            rows[0]["password"], password=password
        ):
            return redirect("/login")

        user = rows[0]
        del user["password"]

        if user["totp"]:
            if token:
                totp = TOTP(user["totp"])
                if not totp.verify(token):
                    return jsonify({"message": "Wrong otp"}), 401

                user["totp"] = "true"
                token = jwt_new_token(user)

                response = make_response()
                response.set_cookie(
                    "auth_token",
                    token,
                    httponly=True,
                    secure=True,
                    samesite="Strict",
                    max_age=3600,
                )
                return response, 202
            else:
                return jsonify({"message": "TOTP required"}), 423
        else:
            user["totp"] = "false"
            token = jwt_new_token(user)

            response = make_response()
            response.set_cookie(
                "auth_token",
                token,
                httponly=True,
                secure=True,
                samesite="Strict",
                max_age=3600,
            )
            return response, 202

    @staticmethod
    def register(email, username, password, confirm, name):
        # Handle email
        if not validator.email(email):
            return jsonify({"message": "invalid email."}), 400
        # ------------------------------------------------------------------------
        # Handle username
        if not validator.username(username):
            return jsonify({"message": "invalid username."}), 400
        # ------------------------------------------------------------------------
        # Handle password
        if not password or not confirm or password != confirm:
            return jsonify({"message": "invalid password"}), 400
        # ------------------------------------------------------------------------
        # Handle user's informations
        if not validator.name(name):
            return jsonify({"message": "invalid name"}), 400
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

        token = jwt_new_token(user[0])
        response = make_response()
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600,
        )

        return response, 201

    @staticmethod
    def logout():
        response = make_response(redirect("/"))
        response.set_cookie(
            "auth_token",
            "",
            expires=0,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=0,
        )
        return response

    @staticmethod
    def valid_email(email):
        if validator.email(email):
            return jsonify({"message": "Acceptable"}), 200
        else:
            return jsonify({"message": "Unacceptable"}), 400

    @staticmethod
    def valid_username(username):
        if validator.username(username):
            return jsonify({"message": "Acceptable"}), 200
        else:
            return jsonify({"message": "Unacceptable"}), 400

    @staticmethod
    def valid_name(name):
        if validator.name(name):
            return jsonify({"message": "Acceptable"}), 200
        else:
            return jsonify({"message": "Unacceptable"}), 400

    @staticmethod
    def valid_password(pwd):
        if validator.password(pwd):
            return jsonify({"message": "Acceptable"}), 200
        else:
            return jsonify({"message": "Unacceptable"}), 400

    @staticmethod
    def enable_totp(user):
        if not user:
            return jsonify({"message": "Unacceptable"}), 400

        totp = TOTP(random_base32())
        try:
            db.execute(
                "UPDATE users SET totp=? WHERE id=?",
                (
                    totp.secret,
                    user["id"],
                ),
            )
        except:
            return jsonify({"message": "Unacceptable"}), 400

        uri = totp.provisioning_uri(name=user["username"], issuer_name="myinsta.nguyenphucvinh.io.vn")

        qr_image = qr_make(uri)

        buf = BytesIO()
        qr_image.save(buf, format="PNG")

        qr_base64 = b64encode(buf.getvalue()).decode()

        return jsonify(
            {"secret": totp.secret, "qr": "data:image/png;base64," + qr_base64}
        )

    @staticmethod
    def discard_totp(user):
        if not user:
            return jsonify({"message": "Unacceptable"}), 400

        try:
            db.execute('UPDATE users SET totp="" WHERE id=?', (user["id"],))
        except:
            return jsonify({"message": "Unacceptable"}), 400

        return jsonify({"message": "disabled."}), 200

    @staticmethod
    def totp_deactivate(user):
        if not user:
            return jsonify({"message": "Unacceptable"}), 400

        try:
            db.execute('UPDATE users SET totp="" WHERE id=?', (user["id"],))
        except:
            return jsonify({"message": "Unacceptable"}), 400

        try:
            rows = db.execute(
                "SELECT u.id, u.username, u.email, u.totp, ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.id=?",
                (user["id"],),
            )
        except:
            return jsonify({"message": "user not found"}), 400

        user = rows[0]
        user["totp"] = "false"
        token = jwt_new_token(user)

        response = make_response()
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600,
        )
        return response, 200

    @staticmethod
    def verify_totp(user, token):
        if not token:
            return jsonify({"message": "missing parameters."}), 400

        try:
            rows = db.execute(
                "SELECT u.id, u.username, u.email, u.totp, ui.name, ui.birthday, ui.phone FROM users AS u LEFT JOIN user_informations AS ui ON u.id = ui.user_id WHERE u.id=?",
                (user["id"],),
            )
        except:
            return jsonify({"message": "user not found"}), 400

        user = rows[0]

        totp = TOTP(user["totp"])
        if not totp.verify(token):
            return jsonify({"message": "Wrong otp"}), 401

        user["totp"] = "true"
        token = jwt_new_token(user)

        response = make_response()
        response.set_cookie(
            "auth_token",
            token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600,
        )
        return response, 202

    @staticmethod
    def follow(user, data):
        if not data:
            return jsonify({"message": "Missing data."}), 400
        following = data.get("following")
        if not following:
            return jsonify({"message": "Missing data."}), 400
        follower = user["id"]

        # Cannot follow themself
        if follower == following:
            return jsonify({"message": "Cannot follow yourself."}), 400

        try:
            # Current state between them
            if db.execute(
                "SELECT following FROM user_follow WHERE follower=? AND following=?",
                (follower, following),
            ):
                # User wants to unfollow
                db.execute(
                    "DELETE FROM user_follow WHERE follower=? AND following=?",
                    (follower, following),
                )
                state = "Follow"
            else:
                # User wants to follow
                db.execute(
                    "INSERT INTO user_follow (follower, following) VALUES (?, ?)",
                    (follower, following),
                )
                state = "Following"
        except:
            return jsonify({"message": "Server error."}), 400

        count_followers = db.execute(
            "SELECT COUNT(follower) AS followers FROM user_follow WHERE following=?",
            (following,),
        )[0]["followers"]
        count_following = db.execute(
            "SELECT COUNT(following) AS following FROM user_follow WHERE follower=?",
            (following,),
        )[0]["following"]

        return (
            jsonify(
                {
                    "followers": count_followers,
                    "following": count_following,
                    "state": state,
                }
            ),
            200,
        )

    @staticmethod
    def comment(user, data, socketio):
        if not data:
            return jsonify({"message": "Missing data."}), 400
        post_id = data.get("pid")
        if not post_id:
            return jsonify({"message": "Missing data."}), 400
        content = data.get("content")
        if not content:
            return jsonify({"message": "Missing data."}), 400

        cmt_id = generate_unique_comment_id(db=db)
        user_id = user["id"]

        try:
            # Store the comment
            db.execute(
                "INSERT INTO user_comments (id, user_id, content) VALUES (?, ?, ?)",
                (cmt_id, user_id, content),
            )
            # Link to the post
            db.execute(
                "INSERT INTO post_comments (post_id, comment_id) VALUES (?, ?)",
                (post_id, cmt_id),
            )

            socketio.emit(
                "post_comments",
                {"pid": post_id, "username": user["username"], "content": content},
            )
            return jsonify({"message": "Success."}), 200
        except:
            return jsonify({"message": "Server error."}), 500

    @staticmethod
    def find_by_username(query):
        if not query:
            return jsonify({"message": "Missing data."})

        rs = db.execute(
            "SELECT username FROM users WHERE username LIKE ?", (query + "%",)
        )

        return jsonify(rs), 200

    @staticmethod
    def get_profile(user, path):
        user_id = db.execute("SELECT id FROM users WHERE username=?", (str(path),))
        if not user_id:
            return jsonify({"message": "Not found."}), 404
        user_id = user_id[0]["id"]
        count_posts = db.execute(
            "SELECT COUNT(id) AS count FROM posts WHERE user_id=?", (user_id,)
        )[0]["count"]

        name = db.execute(
            "SELECT name FROM user_informations WHERE user_id=?", (user_id,)
        )[0]["name"]

        if user["id"] != user_id:
            relationship = (
                "Following"
                if db.execute(
                    "SELECT follower FROM user_follow WHERE follower=? AND following=?",
                    (user["id"], user_id),
                )
                else "Follow"
            )
        else:
            relationship = ""

        count_followers = db.execute(
            "SELECT COUNT(follower) AS followers FROM user_follow WHERE following=?",
            (user_id,),
        )[0]["followers"]
        count_following = db.execute(
            "SELECT COUNT(following) AS following FROM user_follow WHERE follower=?",
            (user_id,),
        )[0]["following"]

        profile = {
            "id": user_id,
            "username": str(path),
            "name": name,
            "count_posts": count_posts,
            "relationship": relationship,
            "followers": count_followers,
            "following": count_following,
        }

        return render_template("profile.html", profile=profile, user=user)
