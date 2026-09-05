from ..models.user import User
from ..utils.location_utils import haversine_distance_km, format_distance_bucket

class MatchingService:
    @staticmethod
    def calculate_match(current_user: User, candidate_user: User, user_location=None) -> dict:
        """
        Calculate transparent compatibility score and breakdown between two users.
        """
        if not current_user or not candidate_user or current_user.id == candidate_user.id:
            return None

        # 1. Shared Interests (25%)
        curr_interests = {ui.interest.name.lower() for ui in current_user.interests if ui.interest}
        cand_interests = {ui.interest.name.lower() for ui in candidate_user.interests if ui.interest}
        shared_interests_set = curr_interests.intersection(cand_interests)
        
        interest_score = 0.0
        if curr_interests and cand_interests:
            union_len = len(curr_interests.union(cand_interests))
            interest_score = len(shared_interests_set) / max(union_len, 1)
        elif not curr_interests and not cand_interests:
            interest_score = 0.5  # default neutral if neither has filled yet

        # 2. Shared Goals (20%)
        curr_goals = {ug.goal.title.lower() for ug in current_user.goals if ug.goal}
        cand_goals = {ug.goal.title.lower() for ug in candidate_user.goals if ug.goal}
        shared_goals_set = curr_goals.intersection(cand_goals)
        
        goal_score = 0.0
        if curr_goals and cand_goals:
            union_len = len(curr_goals.union(cand_goals))
            goal_score = len(shared_goals_set) / max(union_len, 1)
        elif not curr_goals and not cand_goals:
            goal_score = 0.5

        # 3. Activity Style Compatibility (20%)
        curr_p = current_user.profile
        cand_p = candidate_user.profile
        activity_score = 0.5
        if curr_p and cand_p:
            mode_match = 0.0
            if curr_p.activity_mode == 'both' or cand_p.activity_mode == 'both' or curr_p.activity_mode == cand_p.activity_mode:
                mode_match = 1.0
            else:
                mode_match = 0.2
            
            group_match = 0.0
            if curr_p.preferred_group_size == 'any' or cand_p.preferred_group_size == 'any' or curr_p.preferred_group_size == cand_p.preferred_group_size:
                group_match = 1.0
            else:
                group_match = 0.3
            
            activity_score = (mode_match * 0.6) + (group_match * 0.4)

        # 4. Skills Complementarity & Overlap (10%)
        curr_skills = {us.skill.name.lower(): us.level for us in current_user.skills if us.skill}
        cand_skills = {us.skill.name.lower(): us.level for us in candidate_user.skills if us.skill}
        shared_skills_set = set(curr_skills.keys()).intersection(set(cand_skills.keys()))
        
        skill_score = 0.0
        if curr_skills and cand_skills:
            skill_score = min(len(shared_skills_set) / max(len(curr_skills), 1), 1.0)
        elif not curr_skills and not cand_skills:
            skill_score = 0.5

        # 5. Availability Overlap (10%)
        curr_avail = {(a.day_of_week.lower(), a.time_slot.lower()) for a in current_user.availabilities}
        cand_avail = {(a.day_of_week.lower(), a.time_slot.lower()) for a in candidate_user.availabilities}
        shared_avail_set = curr_avail.intersection(cand_avail)
        
        avail_score = 0.0
        if curr_avail and cand_avail:
            avail_score = min(len(shared_avail_set) / max(len(curr_avail), 1), 1.0)
        elif not curr_avail and not cand_avail:
            avail_score = 0.6

        # 6. Location & Timezone Proximity (15%)
        # Distance calculation
        distance_km = None
        curr_lat = user_location.get('lat') if user_location else (current_user.location_pref.approx_latitude if current_user.location_pref else None)
        curr_lon = user_location.get('lon') if user_location else (current_user.location_pref.approx_longitude if current_user.location_pref else None)
        cand_lat = candidate_user.location_pref.approx_latitude if candidate_user.location_pref else None
        cand_lon = candidate_user.location_pref.approx_longitude if candidate_user.location_pref else None

        location_score = 0.5  # Neutral default
        if curr_lat is not None and curr_lon is not None and cand_lat is not None and cand_lon is not None:
            distance_km = haversine_distance_km(curr_lat, curr_lon, cand_lat, cand_lon)
            if distance_km <= 5.0:
                location_score = 1.0
            elif distance_km <= 20.0:
                location_score = 0.85
            elif distance_km <= 50.0:
                location_score = 0.65
            elif distance_km <= 150.0:
                location_score = 0.45
            else:
                location_score = 0.25
        elif curr_p and cand_p and curr_p.city and cand_p.city and curr_p.city.lower() == cand_p.city.lower():
            location_score = 0.85

        # Weighted Total Score
        raw_total = (
            (interest_score * 0.25) +
            (goal_score * 0.20) +
            (activity_score * 0.20) +
            (skill_score * 0.10) +
            (avail_score * 0.10) +
            (location_score * 0.15)
        )
        
        # Scale to realistic, motivating percentage range [45% - 98%]
        final_score = int(round(raw_total * 100))
        final_score = max(35, min(99, final_score))

        # Format human-readable shared items with original casing
        cand_interest_dict = {ui.interest.name.lower(): ui.interest.name for ui in candidate_user.interests if ui.interest}
        cand_goal_dict = {ug.goal.title.lower(): ug.goal.title for ug in candidate_user.goals if ug.goal}
        cand_skill_dict = {us.skill.name.lower(): us.skill.name for us in candidate_user.skills if us.skill}

        return {
            'compatibility_score': final_score,
            'shared_interests': [cand_interest_dict[k] for k in shared_interests_set if k in cand_interest_dict],
            'shared_goals': [cand_goal_dict[k] for k in shared_goals_set if k in cand_goal_dict],
            'shared_skills': [cand_skill_dict[k] for k in shared_skills_set if k in cand_skill_dict],
            'availability_overlap': [f"{slot[0].capitalize()} {slot[1]}" for slot in shared_avail_set],
            'distance_bucket': format_distance_bucket(distance_km) if (candidate_user.location_pref and candidate_user.location_pref.show_distance) else "Location hidden",
            'approx_distance_km': round(distance_km, 1) if distance_km is not None else None,
            'breakdown': {
                'interests': int(interest_score * 100),
                'goals': int(goal_score * 100),
                'activity_style': int(activity_score * 100),
                'skills': int(skill_score * 100),
                'availability': int(avail_score * 100),
                'location': int(location_score * 100)
            }
        }
