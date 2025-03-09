import os
import jwt
import time
import uuid

JWT_SECRET = os.getenv("JWT_SECRET")


def jwt_new_token(payload, exp=3600):
    payload["exp"] = int(time.time()) + exp
    return jwt.encode(payload=payload, key=JWT_SECRET, algorithm="HS256")


def jwt_token_valid(token):
    try:
        decoded = jwt.decode(jwt=token, key=JWT_SECRET, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        return False
    except jwt.InvalidTokenError:
        return False


def generate_unique_post_id(db):
    while True:
        file_id = str(uuid.uuid4())
        result = db.execute("SELECT * FROM posts WHERE id=?", (file_id,))

        if not result:
            return file_id


def generate_unique_comment_id(db):
    while True:
        comment_id = str(uuid.uuid4())
        result = db.execute("SELECT * FROM user_comments WHERE id=?", (comment_id,))

        if not result:
            return comment_id
