import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from ..utils.auth_jwt import jwt_required

upload_bp = Blueprint('upload', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def get_upload_dir():
    # Store uploads in backend/uploads directory
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    upload_dir = os.path.join(backend_dir, 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir

def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files and 'image' not in request.files:
        return jsonify({'error': 'No file part in the request. Use field name "file" or "image".'}), 400

    file = request.files.get('file') or request.files.get('image')
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    if not is_allowed_file(file.filename):
        return jsonify({'error': f'File format not supported. Allowed formats: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    # Check content length
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size exceeds maximum allowed limit of 10MB'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = get_upload_dir()
    save_path = os.path.join(upload_dir, unique_filename)

    file.save(save_path)

    # Permanent URL served via /api/uploads/<filename>
    file_url = f"/api/uploads/{unique_filename}"
    return jsonify({
        'url': file_url,
        'filename': unique_filename,
        'size': size
    }), 201

@upload_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    upload_dir = get_upload_dir()
    # Serve with 1 year cache headers for high performance
    return send_from_directory(upload_dir, filename, max_age=31536000)
