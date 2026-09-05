from flask import Blueprint, request, jsonify
from ..utils.auth_jwt import jwt_required
from ..services.activity_service import ActivityService

activity_bp = Blueprint('activities', __name__, url_prefix='/api/activities')

@activity_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_activities():
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    category = request.args.get('category')
    location_type = request.args.get('location_type')
    search = request.args.get('search')
    
    activities = ActivityService.get_all(
        category=category,
        location_type=location_type,
        search=search,
        current_user_id=current_user_id
    )
    return jsonify(activities), 200

@activity_bp.route('/<activity_id>', methods=['GET'])
@jwt_required(optional=True)
def get_activity(activity_id):
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    act = ActivityService.get_by_id(activity_id, current_user_id)
    if not act:
        return jsonify({'error': 'Activity not found'}), 404
    return jsonify(act), 200

@activity_bp.route('', methods=['POST'])
@jwt_required()
def create_activity():
    data = request.get_json() or {}
    if not data.get('title') or not data.get('description') or not data.get('event_date') or not data.get('event_time'):
        return jsonify({'error': 'Title, description, date, and time are required'}), 400

    act = ActivityService.create_activity(request.current_user, data)
    return jsonify(act.to_dict(request.current_user.id)), 201

@activity_bp.route('/<activity_id>/join', methods=['POST'])
@jwt_required()
def join_activity(activity_id):
    act, err = ActivityService.join_activity(activity_id, request.current_user)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(act), 200

@activity_bp.route('/<activity_id>/leave', methods=['DELETE', 'POST'])
@jwt_required()
def leave_activity(activity_id):
    success, err = ActivityService.leave_activity(activity_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'message': 'Left activity successfully'}), 200

@activity_bp.route('/<activity_id>/group', methods=['GET', 'POST'])
@jwt_required()
def get_activity_group(activity_id):
    group, err = ActivityService.get_or_create_activity_group(activity_id, request.current_user)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(group), 200
