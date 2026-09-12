import os
import uuid
import base64
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from ..utils.auth_jwt import jwt_required

upload_bp = Blueprint('upload', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def get_upload_dir():
    # If on Vercel or read-only filesystem, use /tmp/uploads
    if os.getenv('VERCEL') or not os.access(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), os.W_OK):
        upload_dir = os.path.join('/tmp', 'uploads')
    else:
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        upload_dir = os.path.join(backend_dir, 'uploads')
    
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except Exception:
        upload_dir = os.path.join('/tmp', 'uploads')
        try:
            os.makedirs(upload_dir, exist_ok=True)
        except Exception:
            pass
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

    # Read file content safely
    file_bytes = file.read()
    size = len(file_bytes)
    if size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size exceeds maximum allowed limit of 10MB'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    saved_to_disk = False
    try:
        upload_dir = get_upload_dir()
        save_path = os.path.join(upload_dir, unique_filename)
        with open(save_path, 'wb') as f:
            f.write(file_bytes)
        saved_to_disk = True
    except Exception as e:
        print(f"Warning: Could not save upload to disk (expected on read-only serverless): {e}")

    # Generate persistent Base64 Data URL for serverless resilience
    mime_type = f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"
    b64_str = base64.b64encode(file_bytes).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{b64_str}"

    # On Vercel or when image is <= 2.5MB, use data_uri so images never vanish after 1hr
    if os.getenv('VERCEL') or not saved_to_disk or size <= 2500000:
        file_url = data_uri
    else:
        file_url = f"/api/uploads/{unique_filename}"

    return jsonify({
        'url': file_url,
        'filename': unique_filename,
        'size': size
    }), 201

@upload_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    try:
        upload_dir = get_upload_dir()
        return send_from_directory(upload_dir, filename, max_age=31536000)
    except Exception:
        return jsonify({'error': 'File not found'}), 404
