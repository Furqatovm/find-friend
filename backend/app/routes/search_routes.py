from flask import Blueprint, request, jsonify
from ..utils.auth_jwt import jwt_required
from ..services.search_service import SearchService

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

@search_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def search_all():
    query = request.args.get('q', '').strip()
    limit = int(request.args.get('limit', 8))
    current_user = getattr(request, 'current_user', None)
    
    results = SearchService.global_search(query, current_user, limit)
    return jsonify(results), 200
