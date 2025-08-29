import re


def password(pwd: str) -> bool:
    if not pwd or len(pwd) < 8:
        return False

    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$"
    return bool(re.match(pattern, pwd))


if __name__ == "__main__":
    print(password("abc123123123!@ABC"))