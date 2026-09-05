from flask import Blueprint, request, jsonify
from ..models.user import db
from ..models.notification_and_safety import Notification
from ..utils.auth_jwt import jwt_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user = request.current_user
    notifs = Notification.query.filter_by(recipient_id=user.id).order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = Notification.query.filter_by(recipient_id=user.id, is_read=False).count()
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifs],
        'unread_count': unread_count
    }), 200

@notification_bp.route('/<notif_id>/read', methods=['PUT', 'POST'])
@jwt_required()
def mark_read(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif or notif.recipient_id != request.current_user.id:
        return jsonify({'error': 'Notification not found'}), 404
        
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'}), 200

@notification_bp.route('/read-all', methods=['PUT', 'POST'])
@jwt_required()
def mark_all_read():
    Notification.query.filter_by(recipient_id=request.current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200
