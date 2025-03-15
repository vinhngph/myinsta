from app.utils.sql import SQL
from flask_socketio import SocketIO
from config import Config

db_url = Config.DATABASE_URL + ".db"
db = SQL(db_url)
socketio = SocketIO()
