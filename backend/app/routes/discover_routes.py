from flask import Blueprint, request, jsonify
from ..models.user import User
from ..models.notification_and_safety import Block
from ..models.follow import Follow
from ..utils.auth_jwt import jwt_required
from ..services.matching_service import MatchingService
from ..services.connection_service import ConnectionService

discover_bp = Blueprint('discover', __name__, url_prefix='/api/discover')

@discover_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def discover_people():
    current_user = getattr(request, 'current_user', None)

    # Query params
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    goal = request.args.get('goal', '').strip()
    interest = request.args.get('interest', '').strip()
    skill = request.args.get('skill', '').strip()
    activity_mode = request.args.get('activity_mode', '').strip()
    min_score = int(request.args.get('min_score', 0))

    # Exclude blocked users
    excluded_ids = set()
    if current_user:
        excluded_ids.add(current_user.id)
        blocked_ids = {b.blocked_id for b in Block.query.filter_by(blocker_id=current_user.id).all()}
        blocked_by_ids = {b.blocker_id for b in Block.query.filter_by(blocked_id=current_user.id).all()}
        excluded_ids.update(blocked_ids)
        excluded_ids.update(blocked_by_ids)

    query = User.query.filter(User.is_active == True, User.is_onboarded == True)
    if excluded_ids:
        query = query.filter(User.id.notin_(excluded_ids))

    users = query.all()
    results = []

    for cand in users:
        # Search filter
        if search:
            q = search.lower()
            matches_q = (
                q in cand.profile.display_name.lower() or
                (cand.profile.headline and q in cand.profile.headline.lower()) or
                (cand.profile.bio and q in cand.profile.bio.lower()) or
                any(q in ui.interest.name.lower() for ui in cand.interests if ui.interest) or
                any(q in ug.goal.title.lower() for ug in cand.goals if ug.goal) or
                any(q in us.skill.name.lower() for us in cand.skills if us.skill)
            )
            if not matches_q:
                continue

        # Specific filters
        if category and category.lower() != 'all':
            cat_l = category.lower()
            matches_cat = any(cat_l in ui.interest.category.lower() or cat_l in ui.interest.name.lower() for ui in cand.interests if ui.interest)
            if not matches_cat:
                continue

        if goal and goal.lower() != 'all':
            g_l = goal.lower()
            matches_g = any(g_l in ug.goal.title.lower() or g_l in ug.goal.category.lower() for ug in cand.goals if ug.goal)
            if not matches_g:
                continue

        if interest and interest.lower() != 'all':
            i_l = interest.lower()
            matches_i = any(i_l in ui.interest.name.lower() for ui in cand.interests if ui.interest)
            if not matches_i:
                continue

        if skill and skill.lower() != 'all':
            s_l = skill.lower()
            matches_s = any(s_l in us.skill.name.lower() for us in cand.skills if us.skill)
            if not matches_s:
                continue

        if activity_mode and activity_mode.lower() != 'all':
            if cand.profile and cand.profile.activity_mode != 'both' and cand.profile.activity_mode != activity_mode:
                continue

        # Calculate compatibility
        match_info = MatchingService.calculate_match(current_user, cand) if current_user else {
            'compatibility_score': 85,
            'shared_interests': [ui.interest.name for ui in cand.interests[:3] if ui.interest],
            'shared_goals': [ug.goal.title for ug in cand.goals[:2] if ug.goal],
            'shared_skills': [us.skill.name for us in cand.skills[:2] if us.skill],
            'availability_overlap': [],
            'distance_bucket': "Nearby",
            'breakdown': {'interests': 80, 'goals': 80, 'activity_style': 80, 'skills': 70, 'availability': 80, 'location': 80}
        }

        if match_info['compatibility_score'] < min_score:
            continue

        conn_status = ConnectionService.get_connection_status(current_user.id, cand.id) if current_user else {'status': 'none'}
        is_following = Follow.query.filter_by(follower_id=current_user.id, followed_id=cand.id).first() is not None if current_user else False
        followers_count = Follow.query.filter_by(followed_id=cand.id).count()

        results.append({
            'id': cand.id,
            'username': cand.username,
            'display_name': cand.profile.display_name if cand.profile else cand.username,
            'headline': cand.profile.headline if cand.profile else '',
            'bio': cand.profile.bio if cand.profile else '',
            'avatar_url': cand.profile.avatar_url if cand.profile else None,
            'city': cand.profile.city if (cand.profile and (not cand.location_pref or cand.location_pref.show_city)) else None,
            'activity_mode': cand.profile.activity_mode if cand.profile else 'both',
            'preferred_group_size': cand.profile.preferred_group_size if cand.profile else 'any',
            'looking_for_summary': cand.profile.looking_for_summary if cand.profile else '',
            'interests': [ui.to_dict() for ui in cand.interests],
            'skills': [us.to_dict() for us in cand.skills],
            'goals': [ug.to_dict() for ug in cand.goals],
            'compatibility': match_info,
            'distance_bucket': match_info.get('distance_bucket', 'Nearby'),
            'connection': conn_status,
            'is_following': is_following,
            'followers_count': followers_count
        })

    # Sort descending by compatibility score
    results.sort(key=lambda x: x['compatibility']['compatibility_score'], reverse=True)
    return jsonify(results), 200
