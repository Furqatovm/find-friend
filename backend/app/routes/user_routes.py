from flask import Blueprint, request, jsonify
from ..models.user import db, User
from ..models.profile import Profile
from ..models.taxonomy import Interest, UserInterest, Skill, UserSkill, Goal, UserGoal, Availability
from ..models.notification_and_safety import Block, Notification
from ..models.follow import Follow
from ..models.activity import Activity
from ..models.project import Project
from ..utils.auth_jwt import jwt_required
from ..utils.location_utils import fuzz_coordinates
from ..services.matching_service import MatchingService
from ..services.connection_service import ConnectionService

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('/taxonomies', methods=['GET'])
def get_taxonomies():
    interests = Interest.query.all()
    skills = Skill.query.all()
    goals = Goal.query.all()
    
    return jsonify({
        'interests': [i.to_dict() for i in interests],
        'skills': [s.to_dict() for s in skills],
        'goals': [g.to_dict() for g in goals]
    }), 200

@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user = request.current_user
    data = user.to_dict(include_private=True)
    data['interests'] = [ui.to_dict() for ui in user.interests]
    data['skills'] = [us.to_dict() for us in user.skills]
    data['goals'] = [ug.to_dict() for ug in user.goals]
    data['availabilities'] = [a.to_dict() for a in user.availabilities]
    
    # Instagram-style stats
    data['followers_count'] = Follow.query.filter_by(followed_id=user.id).count()
    data['following_count'] = Follow.query.filter_by(follower_id=user.id).count()
    data['posts_count'] = Activity.query.filter_by(creator_id=user.id).count() + Project.query.filter_by(creator_id=user.id).count()
    
    return jsonify(data), 200

@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    user = request.current_user
    data = request.get_json() or {}
    
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.session.add(profile)
        
    for field in ['display_name', 'headline', 'bio', 'avatar_url', 'city', 'country', 'timezone', 'activity_mode', 'preferred_group_size', 'looking_for_summary', 'status', 'status_message', 'telegram', 'discord', 'phone', 'github', 'website']:
        if field in data:
            setattr(profile, field, data[field])

    if 'is_onboarded' in data:
        user.is_onboarded = bool(data['is_onboarded'])

    # Update Interests if provided
    if 'interests' in data or 'interest_ids' in data:
        interest_items = data.get('interests') or data.get('interest_ids') or []
        UserInterest.query.filter_by(user_id=user.id).delete()
        for i_item in interest_items:
            i_name = i_item if isinstance(i_item, str) else i_item.get('name')
            interest = Interest.query.filter(Interest.name.ilike(f"%{i_name}%")).first() or Interest.query.get(i_name)
            if not interest and isinstance(i_name, str) and len(i_name.strip()) > 1:
                interest = Interest(name=i_name.strip(), category='General')
                db.session.add(interest)
                db.session.flush()
            if interest:
                db.session.add(UserInterest(user_id=user.id, interest_id=interest.id))

    # Update Goals if provided
    if 'goals' in data or 'goal_ids' in data:
        goal_items = data.get('goals') or data.get('goal_ids') or []
        UserGoal.query.filter_by(user_id=user.id).delete()
        for g_item in goal_items:
            g_title = g_item if isinstance(g_item, str) else g_item.get('title')
            goal = Goal.query.filter(Goal.title.ilike(f"%{g_title}%")).first() or Goal.query.get(g_title)
            if not goal and isinstance(g_title, str) and len(g_title.strip()) > 1:
                goal = Goal(title=g_title.strip(), category='General')
                db.session.add(goal)
                db.session.flush()
            if goal:
                db.session.add(UserGoal(user_id=user.id, goal_id=goal.id))

    # Update Skills if provided
    if 'skills' in data:
        skills_data = data.get('skills') or []
        UserSkill.query.filter_by(user_id=user.id).delete()
        for s_item in skills_data:
            s_name = s_item.get('name') if isinstance(s_item, dict) else s_item
            s_id = s_item.get('skill_id') if isinstance(s_item, dict) else None
            level = s_item.get('level', 'Intermediate') if isinstance(s_item, dict) else 'Intermediate'
            skill = (Skill.query.get(s_id) if s_id else None) or (Skill.query.filter(Skill.name.ilike(f"%{s_name}%")).first() if s_name else None)
            if not skill and isinstance(s_name, str) and len(s_name.strip()) > 1:
                skill = Skill(name=s_name.strip(), category='General')
                db.session.add(skill)
                db.session.flush()
            if skill:
                db.session.add(UserSkill(user_id=user.id, skill_id=skill.id, level=level))

    # Update Availability if provided
    if 'availabilities' in data:
        avail_data = data.get('availabilities') or []
        Availability.query.filter_by(user_id=user.id).delete()
        for a_item in avail_data:
            day = a_item.get('day_of_week')
            slot = a_item.get('time_slot')
            if day and slot:
                db.session.add(Availability(user_id=user.id, day_of_week=day, time_slot=slot))

    # Update Coordinates if provided
    if data.get('latitude') is not None and data.get('longitude') is not None:
        loc_pref = user.location_pref
        if not loc_pref:
            loc_pref = LocationPreference(user_id=user.id)
            db.session.add(loc_pref)
        raw_lat = float(data.get('latitude'))
        raw_lon = float(data.get('longitude'))
        f_lat, f_lon = fuzz_coordinates(raw_lat, raw_lon, user.id)
        loc_pref.latitude = raw_lat
        loc_pref.longitude = raw_lon
        loc_pref.approx_latitude = f_lat
        loc_pref.approx_longitude = f_lon
            
    db.session.commit()
    
    # Return fresh user dict with nested relationships
    user_data = user.to_dict(include_private=True)
    user_data['interests'] = [ui.to_dict() for ui in user.interests]
    user_data['skills'] = [us.to_dict() for us in user.skills]
    user_data['goals'] = [ug.to_dict() for ug in user.goals]
    user_data['availabilities'] = [a.to_dict() for a in user.availabilities]
    return jsonify(user_data), 200

@user_bp.route('/me/status', methods=['PUT'])
@jwt_required()
def update_user_status():
    user = request.current_user
    data = request.get_json() or {}
    
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.session.add(profile)
        
    if 'status' in data:
        profile.status = data['status']
    if 'status_message' in data:
        profile.status_message = data['status_message']
        
    db.session.commit()
    return jsonify({
        'status': profile.status,
        'status_message': profile.status_message,
        'message': 'Status updated successfully'
    }), 200

from ..services.ai_onboarding_service import AIOnboardingService

@user_bp.route('/onboarding-ai-step', methods=['POST'])
@jwt_required()
def process_ai_onboarding_step():
    data = request.get_json() or {}
    step = int(data.get('step', 1))
    user_message = data.get('message', '')
    current_state = data.get('current_state', {})
    
    display_name = request.current_user.profile.display_name if request.current_user.profile else request.current_user.username
    result = AIOnboardingService.process_step(step, user_message, current_state, display_name)
    return jsonify(result), 200

@user_bp.route('/onboarding', methods=['POST'])
@jwt_required()
def complete_onboarding():
    user = request.current_user
    data = request.get_json() or {}
    
    # 1. Profile updates
    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.session.add(profile)
    
    profile.display_name = data.get('display_name') or profile.display_name or user.username
    profile.headline = data.get('headline') or profile.headline or f"Enthusiast · {profile.display_name}"
    profile.bio = data.get('bio') or profile.bio or "Looking for peers to study and build with!"
    profile.avatar_url = data.get('avatar_url') or profile.avatar_url
    profile.activity_mode = data.get('activity_mode', 'both')
    profile.preferred_group_size = data.get('preferred_group_size', 'any')
    profile.looking_for_summary = data.get('looking_for_summary', '')
    profile.city = data.get('city') or profile.city or 'Tashkent'
    profile.country = data.get('country') or profile.country or 'Uzbekistan'
    profile.timezone = data.get('timezone', 'UTC')
    
    # Contacts
    profile.telegram = data.get('telegram')
    profile.discord = data.get('discord')
    profile.phone = data.get('phone')
    profile.github = data.get('github')

    # 2. Interests (ID or Names)
    interest_ids = data.get('interest_ids') or data.get('interests') or []
    UserInterest.query.filter_by(user_id=user.id).delete()
    for i_item in interest_ids:
        i_name = i_item if isinstance(i_item, str) else (i_item.get('name') or i_item.get('id', ''))
        interest = (Interest.query.get(i_name) if len(i_name) == 36 else None) or Interest.query.filter(Interest.name.ilike(f"%{i_name}%")).first()
        if not interest and isinstance(i_name, str) and len(i_name.strip()) > 1:
            interest = Interest(name=i_name.strip(), category='General')
            db.session.add(interest)
            db.session.flush()
        if interest:
            db.session.add(UserInterest(user_id=user.id, interest_id=interest.id))

    # 3. Goals (ID or Titles)
    goal_ids = data.get('goal_ids') or data.get('goals') or []
    UserGoal.query.filter_by(user_id=user.id).delete()
    for g_item in goal_ids:
        g_title = g_item if isinstance(g_item, str) else (g_item.get('title') or g_item.get('id', ''))
        goal = (Goal.query.get(g_title) if len(g_title) == 36 else None) or Goal.query.filter(Goal.title.ilike(f"%{g_title}%")).first()
        if not goal and isinstance(g_title, str) and len(g_title.strip()) > 1:
            goal = Goal(title=g_title.strip(), category='General')
            db.session.add(goal)
            db.session.flush()
        if goal:
            db.session.add(UserGoal(user_id=user.id, goal_id=goal.id))

    # 4. Skills (with levels)
    skills_data = data.get('skills', [])
    UserSkill.query.filter_by(user_id=user.id).delete()
    for s_item in skills_data:
        s_id = s_item.get('skill_id') or s_item.get('id') if isinstance(s_item, dict) else None
        s_name = s_item.get('name') if isinstance(s_item, dict) else s_item
        level = s_item.get('level', 'Intermediate') if isinstance(s_item, dict) else 'Intermediate'
        skill = (Skill.query.get(s_id) if s_id else None) or (Skill.query.filter(Skill.name.ilike(f"%{s_name}%")).first() if s_name else None)
        if not skill and isinstance(s_name, str) and len(s_name.strip()) > 1:
            skill = Skill(name=s_name.strip(), category='General')
            db.session.add(skill)
            db.session.flush()
        if skill:
            db.session.add(UserSkill(user_id=user.id, skill_id=skill.id, level=level))

    # 5. Availability
    avail_data = data.get('availabilities', [])  # list of { day_of_week: str, time_slot: str }
    Availability.query.filter_by(user_id=user.id).delete()
    for a_item in avail_data:
        day = a_item.get('day_of_week')
        slot = a_item.get('time_slot')
        if day and slot:
            db.session.add(Availability(user_id=user.id, day_of_week=day, time_slot=slot))

    # 6. Location Preference & optional coordinates
    loc_pref = user.location_pref
    if not loc_pref:
        loc_pref = LocationPreference(user_id=user.id)
        db.session.add(loc_pref)
        
    loc_enabled = bool(data.get('location_enabled', False))
    loc_pref.location_enabled = loc_enabled
    if loc_enabled and data.get('latitude') is not None and data.get('longitude') is not None:
        raw_lat = float(data.get('latitude'))
        raw_lon = float(data.get('longitude'))
        loc_pref.approx_latitude = raw_lat
        loc_pref.approx_longitude = raw_lon
        f_lat, f_lon = fuzz_coordinates(raw_lat, raw_lon, user.id)
        loc_pref.fuzzed_latitude = f_lat
        loc_pref.fuzzed_longitude = f_lon

    user.is_onboarded = True
    db.session.commit()

    return jsonify({
        'message': 'Onboarding complete',
        'user': user.to_dict(include_private=True)
    }), 200

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required(optional=True)
def get_user_profile(user_id):
    target_user = User.query.get(user_id)
    if not target_user or not target_user.is_active:
        return jsonify({'error': 'User not found'}), 404

    current_user = getattr(request, 'current_user', None)

    # Check blocked
    if current_user:
        is_blocked = Block.query.filter(
            ((Block.blocker_id == current_user.id) & (Block.blocked_id == user_id)) |
            ((Block.blocker_id == user_id) & (Block.blocked_id == current_user.id))
        ).first()
        if is_blocked:
            return jsonify({'error': 'User profile unavailable'}), 403

    conn_info = ConnectionService.get_connection_status(current_user.id, user_id) if current_user else {'status': 'none'}
    mutual = ConnectionService.get_mutual_connections(current_user.id, user_id) if current_user else []
    match_info = MatchingService.calculate_match(current_user, target_user) if current_user and current_user.id != user_id else None

    # Privacy filter on location
    loc_pref = target_user.location_pref
    city = target_user.profile.city if (target_user.profile and (not loc_pref or loc_pref.show_city)) else None
    
    # Instagram-style stats
    followers_count = Follow.query.filter_by(followed_id=target_user.id).count()
    following_count = Follow.query.filter_by(follower_id=target_user.id).count()
    posts_count = Activity.query.filter_by(creator_id=target_user.id).count() + Project.query.filter_by(creator_id=target_user.id).count()
    is_following = Follow.query.filter_by(follower_id=current_user.id, followed_id=target_user.id).first() is not None if current_user else False

    data = {
        'id': target_user.id,
        'username': target_user.username,
        'followers_count': followers_count,
        'following_count': following_count,
        'posts_count': posts_count,
        'is_following': is_following,
        'profile': {
            'display_name': target_user.profile.display_name if target_user.profile else target_user.username,
            'headline': target_user.profile.headline if target_user.profile else '',
            'bio': target_user.profile.bio if target_user.profile else '',
            'avatar_url': target_user.profile.avatar_url if target_user.profile else None,
            'city': city,
            'country': target_user.profile.country if target_user.profile else None,
            'timezone': target_user.profile.timezone if target_user.profile else 'UTC',
            'activity_mode': target_user.profile.activity_mode if target_user.profile else 'both',
            'preferred_group_size': target_user.profile.preferred_group_size if target_user.profile else 'any',
            'looking_for_summary': target_user.profile.looking_for_summary if target_user.profile else ''
        },
        'interests': [ui.to_dict() for ui in target_user.interests],
        'skills': [us.to_dict() for us in target_user.skills],
        'goals': [ug.to_dict() for ug in target_user.goals],
        'availabilities': [a.to_dict() for a in target_user.availabilities],
        'connection': conn_info,
        'mutual_connections': mutual,
        'compatibility': match_info,
        'distance_bucket': match_info.get('distance_bucket') if match_info else "Somewhere nearby"
    }

    return jsonify(data), 200

# Instagram Follow / Unfollow System
@user_bp.route('/<user_id>/follow', methods=['POST'])
@jwt_required()
def toggle_follow_user(user_id):
    current_user = request.current_user
    if current_user.id == user_id:
        return jsonify({'error': 'You cannot follow yourself'}), 400

    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    existing = Follow.query.filter_by(follower_id=current_user.id, followed_id=user_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        is_following = False
        action = 'unfollowed'
    else:
        new_follow = Follow(follower_id=current_user.id, followed_id=user_id)
        db.session.add(new_follow)
        
        # Send Notification
        notif = Notification(
            recipient_id=target.id,
            sender_id=current_user.id,
            type='follow',
            title='New Follower! 🎉',
            message=f"@{current_user.username} started following your learning journey and updates!",
            link=f"/users/{current_user.id}"
        )
        db.session.add(notif)
        db.session.commit()
        is_following = True
        action = 'followed'

    followers_count = Follow.query.filter_by(followed_id=user_id).count()
    return jsonify({
        'message': f"Successfully {action} @{target.username}",
        'is_following': is_following,
        'followers_count': followers_count
    }), 200

@user_bp.route('/<user_id>/followers', methods=['GET'])
@jwt_required(optional=True)
def get_user_followers(user_id):
    current_user = getattr(request, 'current_user', None)
    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    follows = Follow.query.filter_by(followed_id=user_id).order_by(Follow.created_at.desc()).all()
    results = []
    for f in follows:
        u = f.follower
        if not u:
            continue
        is_following = False
        if current_user:
            is_following = Follow.query.filter_by(follower_id=current_user.id, followed_id=u.id).first() is not None
        
        results.append({
            'id': u.id,
            'username': u.username,
            'display_name': u.profile.display_name if u.profile else u.username,
            'avatar_url': u.profile.avatar_url if u.profile else None,
            'headline': u.profile.headline if u.profile else None,
            'city': u.profile.city if u.profile else None,
            'is_following': is_following,
            'is_self': current_user.id == u.id if current_user else False,
            'followed_at': f.created_at.isoformat() if f.created_at else None
        })
    return jsonify(results), 200

@user_bp.route('/<user_id>/following', methods=['GET'])
@jwt_required(optional=True)
def get_user_following(user_id):
    current_user = getattr(request, 'current_user', None)
    target = User.query.get(user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404

    follows = Follow.query.filter_by(follower_id=user_id).order_by(Follow.created_at.desc()).all()
    results = []
    for f in follows:
        u = f.followed
        if not u:
            continue
        is_following = False
        if current_user:
            is_following = Follow.query.filter_by(follower_id=current_user.id, followed_id=u.id).first() is not None
        
        results.append({
            'id': u.id,
            'username': u.username,
            'display_name': u.profile.display_name if u.profile else u.username,
            'avatar_url': u.profile.avatar_url if u.profile else None,
            'headline': u.profile.headline if u.profile else None,
            'city': u.profile.city if u.profile else None,
            'is_following': is_following,
            'is_self': current_user.id == u.id if current_user else False,
            'followed_at': f.created_at.isoformat() if f.created_at else None
        })
    return jsonify(results), 200


@user_bp.route('/contact-admin', methods=['POST'])
@jwt_required()
def contact_admin():
    sender = request.current_user
    data = request.get_json() or {}
    subject = data.get('subject', 'General Inquiry').strip()
    message = data.get('message', '').strip()
    topic = data.get('topic', 'support').strip()

    if not message:
        return jsonify({'error': 'Message content is required'}), 400

    # Get sender profile info for Telegram contact card
    sender_display_name = sender.profile.display_name if sender.profile else sender.username
    sender_telegram = sender.profile.telegram if sender.profile else ''
    sender_email = sender.email if hasattr(sender, 'email') else ''

    # 1. Send to Telegram bot
    from ..services.telegram_bot_service import TelegramBotService
    telegram_sent = TelegramBotService.send_support_message(
        sender_username=sender.username,
        sender_display_name=sender_display_name,
        sender_email=sender_email,
        sender_telegram=sender_telegram,
        topic=topic,
        subject=subject,
        message=message
    )

    # 2. Also create in-app notification for admin
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        admin = User.query.filter_by(username='admin').first()

    if admin:
        notif = Notification(
            recipient_id=admin.id,
            sender_id=sender.id,
            type='system',
            title=f"Support Request: {subject} (from @{sender.username})",
            message=f"[{topic.upper()}] {message}",
            link=f"/admin"
        )
        db.session.add(notif)
        db.session.commit()

    delivery_note = ''
    if telegram_sent:
        delivery_note = ' Message also forwarded to admin Telegram.'

    return jsonify({
        'message': f'Your message has been sent directly to the Admin support team! We will respond shortly.{delivery_note}',
        'ticket': {
            'subject': subject,
            'topic': topic,
            'status': 'sent',
            'telegram_delivered': telegram_sent
        }
    }), 200

@user_bp.route('/admin-contact-info', methods=['GET'])
@jwt_required()
def get_admin_contact_info():
    admin = User.query.filter_by(is_admin=True).first()
    return jsonify({
        'admin_username': admin.username if admin else 'admin',
        'email': 'admin@withme.com',
        'telegram': '@manabu_bot',
        'discord': 'withme_support',
        'support_hours': '24/7 Response within 2 hours'
    }), 200


@user_bp.route('/my-people', methods=['GET'])
@jwt_required()
def get_my_people():
    """Get all connected + followed users for private group member picker."""
    from ..models.connection import Connection

    current = request.current_user
    people_map = {}  # user_id -> { ...user_data, relation: [] }

    # 1. Connected users (accepted connections)
    connections = Connection.query.filter(
        ((Connection.requester_id == current.id) | (Connection.addressee_id == current.id)),
        Connection.status == 'accepted'
    ).all()

    for conn in connections:
        other_id = conn.addressee_id if conn.requester_id == current.id else conn.requester_id
        other = User.query.get(other_id)
        if other and other.id not in people_map:
            people_map[other.id] = {
                'id': other.id,
                'username': other.username,
                'display_name': other.profile.display_name if other.profile else other.username,
                'avatar_url': other.profile.avatar_url if other.profile else None,
                'headline': other.profile.headline if other.profile else '',
                'relation': ['connected']
            }
        elif other and other.id in people_map:
            if 'connected' not in people_map[other.id]['relation']:
                people_map[other.id]['relation'].append('connected')

    # 2. Users I follow
    follows = Follow.query.filter_by(follower_id=current.id).all()
    for f in follows:
        other = User.query.get(f.followed_id)
        if other and other.id not in people_map:
            people_map[other.id] = {
                'id': other.id,
                'username': other.username,
                'display_name': other.profile.display_name if other.profile else other.username,
                'avatar_url': other.profile.avatar_url if other.profile else None,
                'headline': other.profile.headline if other.profile else '',
                'relation': ['following']
            }
        elif other and other.id in people_map:
            if 'following' not in people_map[other.id]['relation']:
                people_map[other.id]['relation'].append('following')

    # 3. Users who follow me
    followers = Follow.query.filter_by(followed_id=current.id).all()
    for f in followers:
        other = User.query.get(f.follower_id)
        if other and other.id not in people_map:
            people_map[other.id] = {
                'id': other.id,
                'username': other.username,
                'display_name': other.profile.display_name if other.profile else other.username,
                'avatar_url': other.profile.avatar_url if other.profile else None,
                'headline': other.profile.headline if other.profile else '',
                'relation': ['follower']
            }
        elif other and other.id in people_map:
            if 'follower' not in people_map[other.id]['relation']:
                people_map[other.id]['relation'].append('follower')

    return jsonify(list(people_map.values())), 200
