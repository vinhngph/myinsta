import uuid


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
