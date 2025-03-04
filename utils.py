import os
import dotenv
import jwt
import time

dotenv.load_dotenv()

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
    
