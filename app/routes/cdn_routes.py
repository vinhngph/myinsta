from flask import Blueprint, request
from app.utils.auth import login_required
from app.services.cdn_services import CDNServices


cdn_bp = Blueprint("cdn_bp", __name__)


@cdn_bp.route("/attachment")
@login_required
def attachment(_):
    id = request.args.get("id")
    return CDNServices.get_content(id=id)
