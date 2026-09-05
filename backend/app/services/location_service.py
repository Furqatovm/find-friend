from ..models.user import db, User
from ..models.profile import LocationPreference
from ..models.activity import Activity
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
    def get_nearby_users(current_user: User, max_radius_km: float = 50.0, category_filter: str = None, search_query: str = None):
        # Exclude blocked users
        blocked_ids = {b.blocked_id for b in Block.query.filter_by(blocker_id=current_user.id).all()}
        blocked_by_ids = {b.blocker_id for b in Block.query.filter_by(blocked_id=current_user.id).all()}
        excluded_ids = blocked_ids.union(blocked_by_ids)
        excluded_ids.add(current_user.id)

        curr_pref = current_user.location_pref
        curr_lat = curr_pref.approx_latitude if (curr_pref and curr_pref.location_enabled) else None
        curr_lon = curr_pref.approx_longitude if (curr_pref and curr_pref.location_enabled) else None

        candidates = User.query.filter(
            User.id.notin_(excluded_ids),
            User.is_active == True,
            User.is_onboarded == True
        ).all()

        results = []
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

            # Category / Interests filter if specified
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

            match_data = MatchingService.calculate_match(current_user, cand)
            
            # Safe fuzzed coordinates for Map display (approximate point + jitter)
            # NEVER return exact GPS
            fuzzed_lat = cand_pref.fuzzed_latitude or (cand_lat + 0.008 if cand_lat else None)
            fuzzed_lon = cand_pref.fuzzed_longitude or (cand_lon + 0.008 if cand_lon else None)

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
                'city': cand.profile.city if (cand.profile and cand_pref.show_city) else None,
                'approx_lat': fuzzed_lat,
                'approx_lon': fuzzed_lon,
                'distance_bucket': format_distance_bucket(dist) if cand_pref.show_distance else "Location hidden",
                'approx_distance_km': round(dist, 1) if dist is not None else None,
                'compatibility': match_data,
                'interests': [ui.to_dict() for ui in cand.interests],
                'skills': [us.to_dict() for us in cand.skills],
                'goals': [ug.to_dict() for ug in cand.goals],
                'activity_mode': cand.profile.activity_mode if cand.profile else 'both',
                'connection': conn_status,
                'is_following': is_following,
                'followers_count': followers_count
            })

        # Sort by distance first, then compatibility
        results.sort(key=lambda x: (x['approx_distance_km'] if x['approx_distance_km'] is not None else 9999, -x['compatibility']['compatibility_score']))
        return results

    @staticmethod
    def get_nearby_activities(current_user: User, max_radius_km: float = 50.0, category_filter: str = None):
        curr_pref = current_user.location_pref
        curr_lat = curr_pref.approx_latitude if (curr_pref and curr_pref.location_enabled) else None
        curr_lon = curr_pref.approx_longitude if (curr_pref and curr_pref.location_enabled) else None

        activities = Activity.query.filter(Activity.status == 'upcoming').all()
        results = []
        
        for act in activities:
            if category_filter and category_filter.lower() != 'all' and act.category.lower() != category_filter.lower():
                continue
                
            dist = None
            if act.location_type in ['in_person', 'hybrid'] and act.approx_latitude is not None and act.approx_longitude is not None:
                if curr_lat is not None and curr_lon is not None:
                    dist = haversine_distance_km(curr_lat, curr_lon, act.approx_latitude, act.approx_longitude)
                    if dist > max_radius_km:
                        continue
            
            data = act.to_dict(current_user.id)
            data['distance_bucket'] = format_distance_bucket(dist) if dist is not None else ("Online" if act.location_type == 'online' else "Nearby")
            data['approx_distance_km'] = round(dist, 1) if dist is not None else None
            results.append(data)
            
        results.sort(key=lambda x: (x['approx_distance_km'] if x['approx_distance_km'] is not None else 9999))
        return results
