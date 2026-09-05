from flask import Blueprint, request, jsonify
from ..utils.auth_jwt import jwt_required
from ..services.location_service import LocationService

nearby_bp = Blueprint('nearby', __name__, url_prefix='/api/nearby')

@nearby_bp.route('/users', methods=['GET'])
@jwt_required()
def get_nearby_users():
    radius = float(request.args.get('radius', 50.0))
    category = request.args.get('category')
    search = request.args.get('search')
    
    users = LocationService.get_nearby_users(
        current_user=request.current_user,
        max_radius_km=radius,
        category_filter=category,
        search_query=search
    )
    return jsonify(users), 200

@nearby_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_nearby_activities():
    radius = float(request.args.get('radius', 50.0))
    category = request.args.get('category')
    
    activities = LocationService.get_nearby_activities(
        current_user=request.current_user,
        max_radius_km=radius,
        category_filter=category
    )
    return jsonify(activities), 200

@nearby_bp.route('/location', methods=['POST'])
@jwt_required()
def update_location():
    data = request.get_json() or {}
    lat = data.get('latitude')
    lon = data.get('longitude')
    city = data.get('city')
    country = data.get('country')
    
    if lat is None or lon is None:
        return jsonify({'error': 'Latitude and longitude are required'}), 400

    pref = LocationService.update_user_location(
        user=request.current_user,
        lat=float(lat),
        lon=float(lon),
        city=city,
        country=country
    )
    return jsonify({
        'message': 'Location updated safely with privacy fuzzing',
        'location_preference': pref.to_dict()
    }), 200
