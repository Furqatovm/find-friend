from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..models.profile import Profile, LocationPreference
from ..utils.auth_jwt import generate_access_token, generate_refresh_token, decode_token, jwt_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter((User.username.ilike(username)) | (User.email.ilike(email))).first():
        return jsonify({'error': 'Username or email already exists'}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Default profile and location preference
    profile = Profile(
        user_id=user.id,
        display_name=data.get('display_name', username),
        timezone=data.get('timezone', 'UTC'),
        city=data.get('city')
    )
    db.session.add(profile)

    loc_pref = LocationPreference(user_id=user.id)
    db.session.add(loc_pref)

    db.session.commit()

    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token(user.id)

    return jsonify({
        'message': 'Registration successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_id = (data.get('email_or_username') or data.get('username') or data.get('email') or '').strip()
    password = data.get('password', '')

    if not login_id or not password:
        return jsonify({'error': 'Email/Username and password are required'}), 400

    user = User.query.filter(
        (User.email.ilike(login_id)) | (User.username.ilike(login_id))
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 403

    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token(user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json() or {}
    refresh_token = data.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'Refresh token required'}), 400

    payload = decode_token(refresh_token)
    if not payload or payload.get('type') != 'refresh':
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    user = User.query.get(payload['sub'])
    if not user or not user.is_active:
        return jsonify({'error': 'User not found'}), 401

    new_access_token = generate_access_token(user.id)
    return jsonify({'access_token': new_access_token}), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    name = data.get('name', '').strip()
    avatar_url = data.get('avatar_url', '')

    if not email:
        return jsonify({'error': 'Google email is required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        # Generate clean unique username
        base_username = (email.split('@')[0] if email else name.replace(' ', '_').lower()) or 'user'
        clean_username = ''.join(c for c in base_username if c.isalnum() or c == '_').lower()
        if not clean_username:
            clean_username = 'user'
        
        username = clean_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{clean_username}_{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            is_onboarded=False
        )
        import secrets
        user.set_password(secrets.token_urlsafe(16))
        db.session.add(user)
        db.session.flush()

        profile = Profile(
            user_id=user.id,
            display_name=name or username,
            avatar_url=avatar_url if avatar_url else None,
            timezone='UTC'
        )
        db.session.add(profile)

        loc_pref = LocationPreference(user_id=user.id)
        db.session.add(loc_pref)
        db.session.commit()
    else:
        if not user.is_active:
            return jsonify({'error': 'Account is inactive or suspended'}), 403

        # Update avatar if missing
        if avatar_url and user.profile and not user.profile.avatar_url:
            user.profile.avatar_url = avatar_url
            db.session.commit()

    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token(user.id)

    return jsonify({
        'message': 'Google authentication successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(include_private=True)
    }), 200

