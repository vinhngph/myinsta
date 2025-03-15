from app import create_app
from config import Config
from app.extensions import socketio
import os

os.makedirs(
    os.path.join(os.path.dirname(__file__), "app", Config.CONTENT_FOLDER), exist_ok=True
)

app = create_app()

if __name__ == "__main__":
    socketio.run(app=app, debug=Config.DEBUG, port=5000, host="0.0.0.0")
