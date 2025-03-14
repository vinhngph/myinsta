from app.utils.sql import SQL
from flask_socketio import SocketIO

db = SQL("database.db")
socketio = SocketIO()