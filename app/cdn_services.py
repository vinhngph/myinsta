import os
from flask import jsonify, send_from_directory

from app.extensions import db
from config import Config


class CDNServices:
    @staticmethod
    def get_content(id):
        if not id:
            return jsonify({"message": "Missing id."}), 400

        filename = db.execute("SELECT attachment FROM posts WHERE id=?", (id,))
        if not filename:
            return jsonify({"message": "Not found."}), 404

        filename = filename[0]["attachment"]
        file_ext = os.path.splitext(filename)[1]
        return send_from_directory(
            Config.CONTENT_FOLDER,
            f"{id}{file_ext}",
            as_attachment=False,
            download_name=filename,
        )
