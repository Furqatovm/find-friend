from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..models.profile import Profile
from ..models.activity import Activity, ActivityParticipant
from ..models.project import Project, ProjectMember
from ..models.group import Group, GroupMember, GroupMessage
from ..models.message import Message, Conversation
from ..models.notification_and_safety import Report
from ..utils.auth_jwt import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# 1. System Statistics
@admin_bp.route('/stats', methods=['GET'])
@admin_required()
def get_admin_stats():
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    blocked_users = User.query.filter_by(is_active=False).count()
    total_admins = User.query.filter_by(is_admin=True).count()
    
    total_activities = Activity.query.count()
    total_projects = Project.query.count()
    total_groups = Group.query.count()
    total_messages = Message.query.count() + GroupMessage.query.count()
    total_reports = Report.query.count()
    pending_reports = Report.query.filter_by(status='pending').count()
    
    return jsonify({
        'users': {
            'total': total_users,
            'active': active_users,
            'blocked': blocked_users,
            'admins': total_admins
        },
        'content': {
            'activities': total_activities,
            'projects': total_projects,
            'groups': total_groups,
            'messages': total_messages
        },
        'safety': {
            'total_reports': total_reports,
            'pending_reports': pending_reports
        }
    }), 200

# 2. User Management
@admin_bp.route('/users', methods=['GET'])
@admin_required()
def get_all_users():
    search = request.args.get('search', '').strip()
    query = User.query.join(Profile, isouter=True)
    
    if search:
        like_term = f"%{search}%"
        query = query.filter(
            (User.username.ilike(like_term)) |
            (User.email.ilike(like_term)) |
            (Profile.display_name.ilike(like_term)) |
            (Profile.city.ilike(like_term))
        )
        
    users = query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict(include_private=True) for u in users]), 200

@admin_bp.route('/users/<user_id>/block', methods=['PUT'])
@admin_required()
def toggle_block_user(user_id):
    current_admin = request.current_user
    if current_admin.id == user_id:
        return jsonify({'error': 'You cannot block your own admin account'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    user.is_active = not user.is_active
    db.session.commit()
    
    action = "unblocked" if user.is_active else "blocked"
    return jsonify({
        'message': f"User {user.username} has been {action}",
        'is_active': user.is_active
    }), 200

@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@admin_required()
def toggle_user_role(user_id):
    current_admin = request.current_user
    if current_admin.id == user_id:
        return jsonify({'error': 'You cannot modify your own role'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    user.is_admin = not user.is_admin
    db.session.commit()
    
    role = "Admin" if user.is_admin else "Regular User"
    return jsonify({
        'message': f"User {user.username} is now {role}",
        'is_admin': user.is_admin
    }), 200

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required()
def delete_user_permanently(user_id):
    current_admin = request.current_user
    if current_admin.id == user_id:
        return jsonify({'error': 'You cannot delete your own admin account'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    username = user.username
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f"User @{username} and all related data deleted permanently"}), 200

# 3. Project Management
@admin_bp.route('/projects', methods=['GET'])
@admin_required()
def get_all_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify([p.to_dict() for p in projects]), 200

@admin_bp.route('/projects/<project_id>', methods=['DELETE'])
@admin_required()
def delete_project_as_admin(project_id):
    proj = Project.query.get(project_id)
    if not proj:
        return jsonify({'error': 'Project not found'}), 404
        
    title = proj.title
    db.session.delete(proj)
    db.session.commit()
    return jsonify({'message': f"Project '{title}' has been deleted by admin"}), 200

# 4. Activity Management
@admin_bp.route('/activities', methods=['GET'])
@admin_required()
def get_all_activities():
    activities = Activity.query.order_by(Activity.created_at.desc()).all()
    return jsonify([a.to_dict() for a in activities]), 200

@admin_bp.route('/activities/<activity_id>', methods=['DELETE'])
@admin_required()
def delete_activity_as_admin(activity_id):
    act = Activity.query.get(activity_id)
    if not act:
        return jsonify({'error': 'Activity not found'}), 404
        
    title = act.title
    db.session.delete(act)
    db.session.commit()
    return jsonify({'message': f"Activity '{title}' has been deleted by admin"}), 200

# 5. Telegram Group Management
@admin_bp.route('/groups', methods=['GET'])
@admin_required()
def get_all_groups():
    groups = Group.query.order_by(Group.created_at.desc()).all()
    return jsonify([g.to_dict() for g in groups]), 200

@admin_bp.route('/groups/<group_id>', methods=['DELETE'])
@admin_required()
def delete_group_as_admin(group_id):
    grp = Group.query.get(group_id)
    if not grp:
        return jsonify({'error': 'Group not found'}), 404
        
    name = grp.name
    db.session.delete(grp)
    db.session.commit()
    return jsonify({'message': f"Group '{name}' has been deleted by admin"}), 200

# 6. Safety & Reports
@admin_bp.route('/reports', methods=['GET'])
@admin_required()
def get_all_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reports]), 200

@admin_bp.route('/reports/<report_id>/resolve', methods=['PUT'])
@admin_required()
def resolve_report(report_id):
    rep = Report.query.get(report_id)
    if not rep:
        return jsonify({'error': 'Report not found'}), 404
        
    data = request.get_json() or {}
    rep.status = data.get('status', 'resolved')
    rep.action_taken = data.get('action_taken', 'Reviewed and handled by admin')
    db.session.commit()
    return jsonify({'message': 'Report marked as resolved', 'report': rep.to_dict()}), 200
