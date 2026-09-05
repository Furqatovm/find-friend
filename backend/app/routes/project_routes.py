from flask import Blueprint, request, jsonify
from ..utils.auth_jwt import jwt_required
from ..services.project_service import ProjectService

project_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

@project_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_projects():
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    category = request.args.get('category')
    stage = request.args.get('stage')
    search = request.args.get('search')
    
    projects = ProjectService.get_all(
        category=category,
        stage=stage,
        search=search,
        current_user_id=current_user_id
    )
    return jsonify(projects), 200

@project_bp.route('/<project_id>', methods=['GET'])
@jwt_required(optional=True)
def get_project(project_id):
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    proj = ProjectService.get_by_id(project_id, current_user_id)
    if not proj:
        return jsonify({'error': 'Project not found'}), 404
    return jsonify(proj), 200

@project_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    data = request.get_json() or {}
    if not data.get('title') or not data.get('description') or not data.get('looking_for_roles'):
        return jsonify({'error': 'Title, description, and looking for roles are required'}), 400

    proj = ProjectService.create_project(request.current_user, data)
    return jsonify(proj.to_dict(request.current_user.id)), 201

@project_bp.route('/<project_id>/join', methods=['POST'])
@jwt_required()
def join_project(project_id):
    data = request.get_json() or {}
    role = data.get('role', 'Contributor')
    proj, err = ProjectService.join_project(project_id, request.current_user, role)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(proj), 200

@project_bp.route('/<project_id>/leave', methods=['DELETE', 'POST'])
@jwt_required()
def leave_project(project_id):
    success, err = ProjectService.leave_project(project_id, request.current_user.id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'message': 'Left project successfully'}), 200

@project_bp.route('/<project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    data = request.get_json() or {}
    proj, err, status_code = ProjectService.update_project(project_id, request.current_user, data)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify(proj), 200

@project_bp.route('/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    success, err, status_code = ProjectService.delete_project(project_id, request.current_user)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify({'message': 'Project deleted successfully'}), 200

@project_bp.route('/<project_id>/groups', methods=['GET'])
@jwt_required(optional=True)
def get_project_groups(project_id):
    current_user_id = request.current_user.id if getattr(request, 'current_user', None) else None
    groups, err = ProjectService.get_project_groups(project_id, current_user_id)
    if err:
        return jsonify({'error': err}), 404
    return jsonify(groups), 200

@project_bp.route('/<project_id>/groups', methods=['POST'])
@jwt_required()
def create_project_group(project_id):
    data = request.get_json() or {}
    group, err, status_code = ProjectService.create_project_group(project_id, request.current_user, data)
    if err:
        return jsonify({'error': err}), status_code
    return jsonify(group), status_code

