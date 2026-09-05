from flask import Blueprint, request, jsonify
from ..models.connection import Connection
from ..utils.auth_jwt import jwt_required
from ..services.connection_service import ConnectionService

connection_bp = Blueprint('connections', __name__, url_prefix='/api/connections')

@connection_bp.route('', methods=['GET'])
@jwt_required()
def get_connections():
    user = request.current_user
    connected = ConnectionService.get_user_connections(user.id)
    
    pending_incoming = Connection.query.filter_by(addressee_id=user.id, status='pending').all()
    pending_outgoing = Connection.query.filter_by(requester_id=user.id, status='pending').all()

    return jsonify({
        'connections': connected,
        'pending_incoming': [{
            'id': p.id,
            'requester': {
                'id': p.requester.id,
                'username': p.requester.username,
                'display_name': p.requester.profile.display_name if p.requester.profile else p.requester.username,
                'avatar_url': p.requester.profile.avatar_url if p.requester.profile else None,
                'headline': p.requester.profile.headline if p.requester.profile else ''
            },
            'message': p.message,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in pending_incoming if p.requester],
        'pending_outgoing': [{
            'id': p.id,
            'addressee': {
                'id': p.addressee.id,
                'username': p.addressee.username,
                'display_name': p.addressee.profile.display_name if p.addressee.profile else p.addressee.username,
                'avatar_url': p.addressee.profile.avatar_url if p.addressee.profile else None
            },
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in pending_outgoing if p.addressee]
    }), 200

@connection_bp.route('', methods=['POST'])
@connection_bp.route('/<target_user_id>/request', methods=['POST'])
@jwt_required()
def send_connection_request(target_user_id=None):
    data = request.get_json() or {}
    addressee_id = target_user_id or data.get('addressee_id') or data.get('target_user_id')
    note = data.get('note') or data.get('message')
    
    if not addressee_id:
        return jsonify({'error': 'Target user ID is required'}), 400

    conn, err = ConnectionService.send_request(request.current_user, addressee_id, note)
    if err:
        return jsonify({'error': err}), 400
        
    return jsonify({
        'message': 'Connection request sent successfully',
        'connection': conn.to_dict()
    }), 201

@connection_bp.route('/<connection_id>', methods=['PUT'])
@jwt_required()
def respond_connection(connection_id):
    data = request.get_json() or {}
    action = data.get('action')  # accept, decline
    
    if action not in ['accept', 'decline']:
        return jsonify({'error': "Action must be 'accept' or 'decline'"}), 400

    conn, err = ConnectionService.respond_to_request(connection_id, request.current_user.id, action)
    if err:
        return jsonify({'error': err}), 400
        
    return jsonify({
        'message': f'Connection request {action}ed',
        'connection': conn.to_dict()
    }), 200

@connection_bp.route('/<connection_id>', methods=['DELETE'])
@jwt_required()
def remove_connection(connection_id):
    success, err = ConnectionService.remove_connection(connection_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), 400
        
    return jsonify({'message': 'Connection removed'}), 200

@connection_bp.route('/mutual/<target_user_id>', methods=['GET'])
@jwt_required()
def get_mutual(target_user_id):
    mutuals = ConnectionService.get_mutual_connections(request.current_user.id, target_user_id)
    return jsonify(mutuals), 200
