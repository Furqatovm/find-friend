from flask import Blueprint, request, jsonify
from ..models.user import db, User
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
    limit = min(int(request.args.get('limit', 24)), 50)

    # Exclude blocked users & current user in 1 query
    excluded_ids = set()
    if current_user:
        excluded_ids.add(current_user.id)
        blocks = Block.query.filter(
            (Block.blocker_id == current_user.id) | (Block.blocked_id == current_user.id)
        ).all()
        for b in blocks:
            excluded_ids.add(b.blocked_id if b.blocker_id == current_user.id else b.blocker_id)

    from sqlalchemy.orm import joinedload, selectinload
    from sqlalchemy import func
    from ..models.taxonomy import UserInterest, UserSkill, UserGoal
    from ..models.connection import Connection

    query = User.query.filter(
        User.is_active == True,
        User.is_onboarded == True
    ).options(
        joinedload(User.profile),
        joinedload(User.location_pref),
        selectinload(User.interests).joinedload(UserInterest.interest),
        selectinload(User.skills).joinedload(UserSkill.skill),
        selectinload(User.goals).joinedload(UserGoal.goal),
        selectinload(User.availabilities)
    )
    if excluded_ids:
        query = query.filter(User.id.notin_(excluded_ids))

    # Eager load current_user relationships if present
    if current_user:
        # Pre-warm current user relationships so matching doesn't query
        _ = current_user.interests
        _ = current_user.goals
        _ = current_user.skills
        _ = current_user.availabilities
        _ = current_user.profile
        _ = current_user.location_pref

    users = query.limit(limit * 2).all()
    filtered_users = []

    for cand in users:
        p = cand.profile
        if not p:
            continue

        # Search filter
        if search:
            q = search.lower()
            matches_q = (
                (p.display_name and q in p.display_name.lower()) or
                (p.headline and q in p.headline.lower()) or
                (p.bio and q in p.bio.lower()) or
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
            if p.activity_mode != 'both' and p.activity_mode != activity_mode:
                continue

        filtered_users.append(cand)
        if len(filtered_users) >= limit:
            break

    if not filtered_users:
        return jsonify([]), 200

    cand_ids = [u.id for u in filtered_users]

    # Batch 1: Follower counts for all candidates in 1 query
    follower_counts = dict(
        db.session.query(Follow.followed_id, func.count(Follow.id))
        .filter(Follow.followed_id.in_(cand_ids))
        .group_by(Follow.followed_id)
        .all()
    )

    # Batch 2: Follow status of current user towards candidates in 1 query
    following_ids = set()
    if current_user:
        following_rows = Follow.query.filter(
            Follow.follower_id == current_user.id,
            Follow.followed_id.in_(cand_ids)
        ).all()
        following_ids = {f.followed_id for f in following_rows}

    # Batch 3: Connection statuses in 1 query
    conn_map = {}
    if current_user:
        conns = Connection.query.filter(
            ((Connection.requester_id == current_user.id) & (Connection.addressee_id.in_(cand_ids))) |
            ((Connection.addressee_id == current_user.id) & (Connection.requester_id.in_(cand_ids)))
        ).all()
        for c in conns:
            other_id = c.addressee_id if c.requester_id == current_user.id else c.requester_id
            conn_map[other_id] = {
                'status': c.status,
                'id': c.id,
                'is_requester': c.requester_id == current_user.id,
                'created_at': c.created_at.isoformat() if c.created_at else None
            }

    results = []
    for cand in filtered_users:
        p = cand.profile
        match_info = MatchingService.calculate_match(current_user, cand) if current_user else {
            'compatibility_score': 85,
            'shared_interests': [ui.interest.name for ui in cand.interests[:3] if ui.interest],
            'shared_goals': [ug.goal.title for ug in cand.goals[:2] if ug.goal],
            'shared_skills': [us.skill.name for us in cand.skills[:2] if us.skill],
            'availability_overlap': [],
            'distance_bucket': "Nearby",
            'breakdown': {'interests': 80, 'goals': 80, 'activity_style': 80, 'skills': 70, 'availability': 80, 'location': 80}
        }

        if match_info and match_info.get('compatibility_score', 0) < min_score:
            continue

        results.append({
            'id': cand.id,
            'username': cand.username,
            'display_name': p.display_name if p else cand.username,
            'headline': p.headline or '' if p else '',
            'bio': p.bio or '' if p else '',
            'avatar_url': p.avatar_url if p else None,
            'city': p.city if (p and (not cand.location_pref or cand.location_pref.show_city)) else None,
            'activity_mode': p.activity_mode or 'both' if p else 'both',
            'preferred_group_size': p.preferred_group_size or 'any' if p else 'any',
            'looking_for_summary': p.looking_for_summary or '' if p else '',
            'interests': [ui.to_dict() for ui in cand.interests],
            'skills': [us.to_dict() for us in cand.skills],
            'goals': [ug.to_dict() for ug in cand.goals],
            'compatibility': match_info,
            'distance_bucket': match_info.get('distance_bucket', 'Nearby') if match_info else 'Nearby',
            'connection': conn_map.get(cand.id, {'status': 'none', 'id': None}),
            'is_following': cand.id in following_ids,
            'followers_count': follower_counts.get(cand.id, 0)
        })

    # Sort descending by compatibility score
    results.sort(key=lambda x: x['compatibility']['compatibility_score'] if x.get('compatibility') else 0, reverse=True)
    return jsonify(results), 200
