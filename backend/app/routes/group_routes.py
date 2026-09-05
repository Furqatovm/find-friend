from flask import Blueprint, request, jsonify
from ..utils.auth_jwt import jwt_required
from ..services.group_service import GroupService

group_bp = Blueprint('groups', __name__, url_prefix='/api/groups')

@group_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_groups():
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    category = request.args.get('category')
    search = request.args.get('search')
    
    groups = GroupService.get_all(
        category=category,
        search=search,
        current_user_id=current_user_id
    )
    return jsonify(groups), 200

@group_bp.route('/<group_id>', methods=['GET'])
@jwt_required(optional=True)
def get_group(group_id):
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    grp = GroupService.get_by_id(group_id, current_user_id)
    if not grp:
        return jsonify({'error': 'Group not found'}), 404
    return jsonify(grp), 200

@group_bp.route('', methods=['POST'])
@jwt_required()
def create_group():
    data = request.get_json() or {}
    if not data.get('name') or not data.get('description'):
        return jsonify({'error': 'Name and description are required'}), 400

    grp = GroupService.create_group(request.current_user, data)
    return jsonify(grp.to_dict(request.current_user.id)), 201

@group_bp.route('/<group_id>/join', methods=['POST'])
@jwt_required()
def join_group(group_id):
    grp, err = GroupService.join_group(group_id, request.current_user)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(grp), 200

@group_bp.route('/<group_id>/leave', methods=['DELETE', 'POST'])
@jwt_required()
def leave_group(group_id):
    success, err = GroupService.leave_group(group_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'message': 'Left group successfully'}), 200

@group_bp.route('/<group_id>/messages', methods=['GET'])
@jwt_required(optional=True)
def get_group_messages(group_id):
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    grp = GroupService.get_by_id(group_id, current_user_id)
    if not grp:
        return jsonify({'error': 'Group not found'}), 404
    return jsonify(grp.get('messages', [])), 200

@group_bp.route('/<group_id>/messages', methods=['POST'])
@group_bp.route('/<group_id>/posts', methods=['POST'])
@jwt_required()
def send_group_message(group_id):
    data = request.get_json() or {}
    msg, err = GroupService.send_group_message(group_id, request.current_user, data)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(msg), 201

# Reactions (Support both with and without group_id in URL)
@group_bp.route('/<group_id>/messages/<message_id>/react', methods=['POST'])
@group_bp.route('/<group_id>/messages/<message_id>/reactions', methods=['POST'])
@group_bp.route('/messages/<message_id>/react', methods=['POST'])
@group_bp.route('/messages/<message_id>/reactions', methods=['POST'])
@jwt_required()
def toggle_reaction(message_id, group_id=None):
    data = request.get_json() or {}
    emoji = data.get('emoji', '👍')
    msg, err = GroupService.toggle_reaction(message_id, request.current_user, emoji)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(msg), 200

# Poll Voting (Support both with and without group_id in URL)
@group_bp.route('/<group_id>/messages/<message_id>/vote', methods=['POST'])
@group_bp.route('/<group_id>/messages/<message_id>/poll-vote', methods=['POST'])
@group_bp.route('/messages/<message_id>/vote', methods=['POST'])
@group_bp.route('/messages/<message_id>/poll-vote', methods=['POST'])
@jwt_required()
def vote_poll(message_id, group_id=None):
    data = request.get_json() or {}
    option_id = data.get('option_id')
    if not option_id:
        return jsonify({'error': 'Option ID is required'}), 400
        
    msg, err = GroupService.vote_poll(message_id, request.current_user, option_id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(msg), 200

# Message Pinning / Unpinning (Support both POST and DELETE)
@group_bp.route('/<group_id>/messages/<message_id>/pin', methods=['POST', 'DELETE'])
@group_bp.route('/messages/<message_id>/pin', methods=['POST', 'DELETE'])
@jwt_required()
def pin_message(message_id, group_id=None):
    if request.method == 'DELETE':
        msg, err = GroupService.unpin_message(message_id, request.current_user)
    else:
        msg, err = GroupService.toggle_pin_message(message_id, request.current_user)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(msg), 200

# Message Deletion (Support both with and without group_id in URL)
@group_bp.route('/<group_id>/messages/<message_id>', methods=['DELETE'])
@group_bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_group_message(message_id, group_id=None):
    success, err, status_code = GroupService.delete_message(message_id, request.current_user)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify({'message': 'Message deleted successfully', 'message_id': message_id}), 200

@group_bp.route('/<group_id>', methods=['PUT'])
@jwt_required()
def update_group(group_id):
    data = request.get_json() or {}
    grp, err, status_code = GroupService.update_group(group_id, request.current_user, data)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify(grp), 200

@group_bp.route('/<group_id>', methods=['DELETE'])
@jwt_required()
def delete_group(group_id):
    success, err, status_code = GroupService.delete_group(group_id, request.current_user)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify({'message': 'Group deleted successfully'}), 200
