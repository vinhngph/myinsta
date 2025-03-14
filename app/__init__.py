from flask import Flask
from config import Config
from app.routes.main_routes import main_bp
from app.routes.auth_routes import auth_bp
from app.routes.api_routes import api_bp
from app.routes.cdn_routes import cdn_bp
from app.extensions import socketio


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    socketio.init_app(app=app)

    app.register_blueprint(main_bp, url_prefix="/")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(cdn_bp, url_prefix="/cdn")

    return app
