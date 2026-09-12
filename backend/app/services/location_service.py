from ..models.user import db, User
from ..models.profile import LocationPreference
from ..models.activity import Activity, ActivityParticipant
from ..models.follow import Follow
from ..models.notification_and_safety import Block
from ..utils.location_utils import haversine_distance_km, fuzz_coordinates, format_distance_bucket
from .matching_service import MatchingService
from .connection_service import ConnectionService

class LocationService:
    @staticmethod
    def update_user_location(user: User, lat: float, lon: float, city: str = None, country: str = None) -> LocationPreference:
        if not user.location_pref:
            user.location_pref = LocationPreference(user_id=user.id)
            db.session.add(user.location_pref)
        
        pref = user.location_pref
        pref.location_enabled = True
        pref.approx_latitude = lat
        pref.approx_longitude = lon
        
        f_lat, f_lon = fuzz_coordinates(lat, lon, user.id)
        pref.fuzzed_latitude = f_lat
        pref.fuzzed_longitude = f_lon
        
        if city and user.profile:
            user.profile.city = city
        if country and user.profile:
            user.profile.country = country
            
        db.session.commit()
        return pref

    @staticmethod
    def get_nearby_users(current_user: User, max_radius_km: float = 50.0, category_filter: str = None, search_query: str = None, lat: float = None, lon: float = None):
        import math
        from sqlalchemy.orm import joinedload, selectinload
        from sqlalchemy import func
        from ..models.taxonomy import UserInterest, UserSkill, UserGoal
        from ..models.connection import Connection

        # Exclude blocked users & current user in 1 query
        excluded_ids = set()
        if current_user:
            excluded_ids.add(current_user.id)
            blocks = Block.query.filter(
                (Block.blocker_id == current_user.id) | (Block.blocked_id == current_user.id)
            ).all()
            for b in blocks:
                excluded_ids.add(b.blocked_id if b.blocker_id == current_user.id else b.blocker_id)

        curr_pref = current_user.location_pref if current_user else None
        curr_lat = lat if lat is not None else (curr_pref.approx_latitude if (curr_pref and curr_pref.location_enabled) else None)
        curr_lon = lon if lon is not None else (curr_pref.approx_longitude if (curr_pref and curr_pref.location_enabled) else None)

        query = User.query.join(LocationPreference).options(
            joinedload(User.profile),
            joinedload(User.location_pref),
            selectinload(User.interests).joinedload(UserInterest.interest),
            selectinload(User.skills).joinedload(UserSkill.skill),
            selectinload(User.goals).joinedload(UserGoal.goal)
        ).filter(
            User.is_active == True,
            User.is_onboarded == True,
            LocationPreference.location_enabled == True,
            LocationPreference.show_on_nearby == True
        )
        if excluded_ids:
            query = query.filter(User.id.notin_(excluded_ids))

        # SQL-level bounding box filter (fast indexed spatial pre-filter)
        if curr_lat is not None and curr_lon is not None:
            d_lat = max_radius_km / 111.0
            rad = math.radians(curr_lat)
            d_lon = max_radius_km / (111.0 * max(math.cos(rad), 0.1))
            query = query.filter(
                LocationPreference.approx_latitude.between(curr_lat - d_lat, curr_lat + d_lat),
                LocationPreference.approx_longitude.between(curr_lon - d_lon, curr_lon + d_lon)
            )

        candidates = query.limit(50).all()
        filtered = []

        for cand in candidates:
            cand_pref = cand.location_pref
            if not cand_pref or not cand_pref.location_enabled or not cand_pref.show_on_nearby:
                continue

            cand_lat = cand_pref.approx_latitude
            cand_lon = cand_pref.approx_longitude

            if curr_lat is not None and curr_lon is not None and cand_lat is not None and cand_lon is not None:
                dist = haversine_distance_km(curr_lat, curr_lon, cand_lat, cand_lon)
                if dist > max_radius_km:
                    continue
            else:
                dist = None

            # Category / Interests filter
            if category_filter and category_filter.lower() != 'all':
                cat_lower = category_filter.lower()
                matches_cat = any(
                    cat_lower in ui.interest.category.lower() or cat_lower in ui.interest.name.lower()
                    for ui in cand.interests if ui.interest
                )
                if not matches_cat:
                    continue

            # Search text query
            if search_query:
                q = search_query.lower()
                p = cand.profile
                matches_q = (
                    (p and p.display_name and q in p.display_name.lower()) or
                    (p and p.headline and q in p.headline.lower()) or
                    (p and p.bio and q in p.bio.lower()) or
                    any(q in ui.interest.name.lower() for ui in cand.interests if ui.interest) or
                    any(q in ug.goal.title.lower() for ug in cand.goals if ug.goal) or
                    any(q in us.skill.name.lower() for us in cand.skills if us.skill)
                )
                if not matches_q:
                    continue

            filtered.append((cand, dist))

        if not filtered:
            return []

        cand_ids = [u.id for u, _ in filtered]

        # Batch 1: follower counts
        follower_counts = dict(
            db.session.query(Follow.followed_id, func.count(Follow.id))
            .filter(Follow.followed_id.in_(cand_ids))
            .group_by(Follow.followed_id)
            .all()
        )

        # Batch 2: following
        following_ids = set()
        if current_user:
            following_rows = Follow.query.filter(
                Follow.follower_id == current_user.id,
                Follow.followed_id.in_(cand_ids)
            ).all()
            following_ids = {f.followed_id for f in following_rows}

        # Batch 3: connections
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
        for cand, dist in filtered:
            cand_pref = cand.location_pref
            p = cand.profile
            match_data = MatchingService.calculate_match(current_user, cand) if current_user else {
                'compatibility_score': 85,
                'shared_interests': [ui.interest.name for ui in cand.interests[:3] if ui.interest],
                'shared_goals': [ug.goal.title for ug in cand.goals[:2] if ug.goal],
                'shared_skills': [us.skill.name for us in cand.skills[:2] if us.skill],
                'availability_overlap': [],
                'distance_bucket': "Nearby",
                'breakdown': {'interests': 80, 'goals': 80, 'activity_style': 80, 'skills': 70, 'availability': 80, 'location': 80}
            }

            fuzzed_lat = cand_pref.fuzzed_latitude or (cand_pref.approx_latitude + 0.008 if cand_pref.approx_latitude else None)
            fuzzed_lon = cand_pref.fuzzed_longitude or (cand_pref.approx_longitude + 0.008 if cand_pref.approx_longitude else None)

            results.append({
                'id': cand.id,
                'username': cand.username,
                'display_name': p.display_name if p else cand.username,
                'headline': p.headline or '' if p else '',
                'bio': p.bio or '' if p else '',
                'avatar_url': p.avatar_url if p else None,
                'city': p.city if (p and cand_pref.show_city) else None,
                'approx_lat': fuzzed_lat,
                'approx_lon': fuzzed_lon,
                'distance_bucket': format_distance_bucket(dist) if cand_pref.show_distance else "Location hidden",
                'approx_distance_km': round(dist, 1) if dist is not None else None,
                'compatibility': match_data,
                'interests': [ui.to_dict() for ui in cand.interests],
                'skills': [us.to_dict() for us in cand.skills],
                'goals': [ug.to_dict() for ug in cand.goals],
                'activity_mode': p.activity_mode or 'both' if p else 'both',
                'connection': conn_map.get(cand.id, {'status': 'none', 'id': None}),
                'is_following': cand.id in following_ids,
                'followers_count': follower_counts.get(cand.id, 0)
            })

        # Sort by distance first, then compatibility
        results.sort(key=lambda x: (x['approx_distance_km'] if x['approx_distance_km'] is not None else 9999, -(x['compatibility']['compatibility_score'] if x.get('compatibility') else 0)))
        return results

    @staticmethod
    def get_nearby_activities(current_user: User, max_radius_km: float = 50.0, category_filter: str = None, lat: float = None, lon: float = None):
        import math
        from sqlalchemy.orm import joinedload, selectinload
        from sqlalchemy import and_, or_

        curr_pref = current_user.location_pref if current_user else None
        curr_lat = lat if lat is not None else (curr_pref.approx_latitude if (curr_pref and curr_pref.location_enabled) else None)
        curr_lon = lon if lon is not None else (curr_pref.approx_longitude if (curr_pref and curr_pref.location_enabled) else None)

        query = Activity.query.options(
            joinedload(Activity.creator).joinedload(User.profile),
            selectinload(Activity.participants).joinedload(ActivityParticipant.user).joinedload(User.profile),
            selectinload(Activity.groups)
        ).filter(Activity.status == 'upcoming')

        if category_filter and category_filter.lower() != 'all':
            query = query.filter(Activity.category.ilike(f"%{category_filter}%"))

        # SQL-level bounding box
        if curr_lat is not None and curr_lon is not None:
            d_lat = max_radius_km / 111.0
            rad = math.radians(curr_lat)
            d_lon = max_radius_km / (111.0 * max(math.cos(rad), 0.1))
            query = query.filter(
                or_(
                    Activity.location_type == 'online',
                    and_(
                        Activity.approx_latitude.between(curr_lat - d_lat, curr_lat + d_lat),
                        Activity.approx_longitude.between(curr_lon - d_lon, curr_lon + d_lon)
                    )
                )
            )

        activities = query.order_by(Activity.created_at.desc()).limit(40).all()
        results = []
        
        for act in activities:
            dist = None
            if act.location_type in ['in_person', 'hybrid'] and act.approx_latitude is not None and act.approx_longitude is not None:
                if curr_lat is not None and curr_lon is not None:
                    dist = haversine_distance_km(curr_lat, curr_lon, act.approx_latitude, act.approx_longitude)
                    if dist > max_radius_km:
                        continue
            
            data = act.to_dict(current_user.id if current_user else None)
            data['distance_bucket'] = format_distance_bucket(dist) if dist is not None else ("Online" if act.location_type == 'online' else "Nearby")
            data['approx_distance_km'] = round(dist, 1) if dist is not None else None
            results.append(data)
            
        results.sort(key=lambda x: (x['approx_distance_km'] if x['approx_distance_km'] is not None else 9999))
        return results
