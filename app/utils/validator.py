import re
import regex
from app.extensions import db
from email_validator import validate_email, EmailNotValidError


def email(email: str) -> bool:
    # Check format
    if not is_email(email):
        return False
    # Check exist
    if not db.execute("SELECT email FROM users WHERE email=?", (email,)):
        return True
    else:
        return False


def is_email(email: str) -> bool:
    # Check empty
    if not email:
        return False
    # Check format
    try:
        if validate_email(email):
            return True
    except EmailNotValidError:
        return False


def username(username: str) -> bool:
    # Check empty and format
    if not is_username(username):
        return False
    # Check exist
    try:
        if db.execute("SELECT username FROM users WHERE username=?", (username,)):
            return False
        else:
            return True
    except:
        return False


def is_username(username: str) -> bool:
    if (
        not username
        or len(username) < 3
        or not re.match(r"^[a-z][a-z0-9_]*$", username)
    ):
        return False
    return True


def name(name: str) -> bool:
    if not name or len(name.strip()) < 3:
        return False

    pattern = r"^\p{L}{2,}(?:[-']\p{L}{2,})*(?:\s+\p{L}{2,}(?:[-']\p{L}{2,})*)+$"
    return bool(regex.match(pattern, name))


def password(pwd: str) -> bool:
    if not pwd or len(pwd) < 8:
        return False

    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$"
    return bool(re.match(pattern, pwd))
