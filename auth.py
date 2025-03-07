from functools import wraps
from flask import request, redirect

import utils


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get("auth_token")
        user = utils.jwt_token_valid(token=token) if token else None  # Valid token

        if not user:
            return redirect("/login")

        return f(user, *args, **kwargs)  # Return `user` into route

    return decorated_function
