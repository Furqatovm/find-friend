from flask import Blueprint, request, jsonify
from ..models.user import User
from ..utils.auth_jwt import jwt_required
from ..services.message_service import MessageService

message_bp = Blueprint('messages', __name__, url_prefix='/api')

@message_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    convs = MessageService.get_user_conversations(request.current_user.id)
    return jsonify(convs), 200

@message_bp.route('/conversations', methods=['POST'])
@jwt_required()
def start_conversation():
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id') or data.get('user_id')
    if not recipient_id:
        return jsonify({'error': 'Recipient ID is required'}), 400

    conv, err = MessageService.get_or_create_conversation(request.current_user.id, recipient_id)
    if err:
        return jsonify({'error': err}), 400
        
    return jsonify(conv.to_dict(request.current_user.id)), 201

@message_bp.route('/conversations/<conv_id>', methods=['GET'])
@jwt_required()
def get_conversation_detail(conv_id):
    data, err = MessageService.get_conversation_messages(conv_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), 404
        
    return jsonify(data), 200

@message_bp.route('/conversations/<conv_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conv_id):
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Message content cannot be empty'}), 400

    msg, err = MessageService.send_message(
        conv_id=conv_id,
        sender=request.current_user,
        content=content,
        message_type=data.get('message_type', 'text'),
        metadata_json=data.get('metadata')
    )
    if err:
        return jsonify({'error': err}), 400

    return jsonify(msg.to_dict()), 201

@message_bp.route('/conversations/share-contacts', methods=['POST'])
@jwt_required()
def share_contact_info():
    data = request.get_json() or {}
    recipient_id = data.get('recipient_id')
    channels = data.get('channels', {})  # { email: true, telegram: true, phone: false, discord: true }

    if not recipient_id:
        return jsonify({'error': 'Recipient ID is required'}), 400

    share, err = MessageService.share_contacts(request.current_user, recipient_id, channels)
    if err:
        return jsonify({'error': err}), 400

    return jsonify({
        'message': 'Contact information shared successfully',
        'share': share.to_dict()
    }), 200

@message_bp.route('/conversations/<conv_id>/messages/<message_id>', methods=['DELETE'])
@message_bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_direct_message(message_id, conv_id=None):
    success, err, status_code = MessageService.delete_message(message_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify({'message': 'Message deleted successfully', 'message_id': message_id}), 200
