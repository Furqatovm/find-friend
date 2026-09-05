import jwt
from datetime import datetime, timezone
from functools import wraps
from flask import request, jsonify, current_app
from ..models.user import User

def generate_access_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'type': 'access',
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def generate_refresh_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'type': 'refresh',
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(optional=False):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                if optional:
                    request.current_user = None
                    return fn(*args, **kwargs)
                return jsonify({'error': 'Authorization token is missing or invalid'}), 401
            
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if not payload or payload.get('type') != 'access':
                if optional:
                    request.current_user = None
                    return fn(*args, **kwargs)
                return jsonify({'error': 'Token has expired or is invalid'}), 401
            
            user = User.query.get(payload['sub'])
            if not user or not user.is_active:
                if optional:
                    request.current_user = None
                    return fn(*args, **kwargs)
                return jsonify({'error': 'User not found or inactive'}), 401
            
            request.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required():
    def decorator(fn):
        @wraps(fn)
        @jwt_required(optional=False)
        def wrapper(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            if not user or not user.is_admin:
                return jsonify({'error': 'Admin privileges required to perform this action'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

