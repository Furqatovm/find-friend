from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..models.profile import LocationPreference
from ..models.notification_and_safety import Block, Report
from ..models.connection import Connection
from ..utils.auth_jwt import jwt_required

safety_bp = Blueprint('safety', __name__, url_prefix='/api')

@safety_bp.route('/blocks', methods=['GET'])
@jwt_required()
def get_blocks():
    user = request.current_user
    blocks = Block.query.filter_by(blocker_id=user.id).all()
    results = []
    for b in blocks:
        blocked_user = User.query.get(b.blocked_id)
        if blocked_user:
            results.append({
                'id': b.id,
                'blocked_id': blocked_user.id,
                'username': blocked_user.username,
                'display_name': blocked_user.profile.display_name if blocked_user.profile else blocked_user.username,
                'avatar_url': blocked_user.profile.avatar_url if blocked_user.profile else None,
                'blocked_at': b.created_at.isoformat() if b.created_at else None
            })
    return jsonify(results), 200

@safety_bp.route('/blocks', methods=['POST'])
@jwt_required()
def block_user():
    data = request.get_json() or {}
    target_id = data.get('target_user_id') or data.get('blocked_id')
    user = request.current_user

    if not target_id or target_id == user.id:
        return jsonify({'error': 'Invalid target user ID'}), 400

    existing = Block.query.filter_by(blocker_id=user.id, blocked_id=target_id).first()
    if not existing:
        block = Block(blocker_id=user.id, blocked_id=target_id)
        db.session.add(block)

    # Clean up any active connections
    Connection.query.filter(
        ((Connection.requester_id == user.id) & (Connection.addressee_id == target_id)) |
        ((Connection.requester_id == target_id) & (Connection.addressee_id == user.id))
    ).delete()

    db.session.commit()
    return jsonify({'message': 'User blocked successfully'}), 200

@safety_bp.route('/blocks/<target_user_id>', methods=['DELETE'])
@jwt_required()
def unblock_user(target_user_id):
    user = request.current_user
    block = Block.query.filter_by(blocker_id=user.id, blocked_id=target_user_id).first()
    if not block:
        return jsonify({'error': 'Block not found'}), 404
        
    db.session.delete(block)
    db.session.commit()
    return jsonify({'message': 'User unblocked'}), 200

@safety_bp.route('/reports', methods=['POST'])
@jwt_required()
def submit_report():
    data = request.get_json() or {}
    reported_user_id = data.get('reported_user_id')
    reason = data.get('reason', 'other')
    description = data.get('description', '')

    if not reported_user_id:
        return jsonify({'error': 'Reported user ID is required'}), 400

    report = Report(
        reporter_id=request.current_user.id,
        reported_user_id=reported_user_id,
        reason=reason,
        description=description
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'message': 'Report submitted for review. Thank you for keeping WithMe safe.'}), 201

@safety_bp.route('/settings/privacy', methods=['GET'])
@jwt_required()
def get_privacy_settings():
    user = request.current_user
    pref = user.location_pref
    if not pref:
        pref = LocationPreference(user_id=user.id)
        db.session.add(pref)
        db.session.commit()

    return jsonify({
        'location_enabled': pref.location_enabled,
        'discovery_radius_km': pref.discovery_radius_km,
        'show_on_nearby': pref.show_on_nearby,
        'show_distance': pref.show_distance,
        'show_city': pref.show_city,
        'activity_mode': user.profile.activity_mode if user.profile else 'both',
        'preferred_group_size': user.profile.preferred_group_size if user.profile else 'any'
    }), 200

@safety_bp.route('/settings/privacy', methods=['PUT'])
@jwt_required()
def update_privacy_settings():
    user = request.current_user
    data = request.get_json() or {}
    
    pref = user.location_pref
    if not pref:
        pref = LocationPreference(user_id=user.id)
        db.session.add(pref)

    if 'location_enabled' in data:
        pref.location_enabled = bool(data['location_enabled'])
    if 'discovery_radius_km' in data:
        pref.discovery_radius_km = int(data['discovery_radius_km'])
    if 'show_on_nearby' in data:
        pref.show_on_nearby = bool(data['show_on_nearby'])
    if 'show_distance' in data:
        pref.show_distance = bool(data['show_distance'])
    if 'show_city' in data:
        pref.show_city = bool(data['show_city'])

    if user.profile:
        if 'activity_mode' in data:
            user.profile.activity_mode = data['activity_mode']
        if 'preferred_group_size' in data:
            user.profile.preferred_group_size = data['preferred_group_size']

    db.session.commit()
    return jsonify({'message': 'Privacy settings updated successfully'}), 200
