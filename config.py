import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    debug = str(os.getenv("DEBUG"))
    DEBUG = True if debug == "on" else False
    SECRET_KEY = str(os.getenv("SECRET_KEY"))
    CONTENT_FOLDER = str(os.getenv("CONTENT_FOLDER"))
    JWT_SECRET = str(os.getenv("JWT_SECRET"))
    DATABASE_URL = str(os.getenv("DATABASE_URL"))