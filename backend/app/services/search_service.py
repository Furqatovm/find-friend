from ..models.user import User
from ..models.profile import Profile
from ..models.activity import Activity
from ..models.project import Project
from ..models.group import Group
from ..models.taxonomy import Interest, Skill, Goal
from ..services.matching_service import MatchingService

class SearchService:
    @staticmethod
    def global_search(query: str, current_user: User = None, limit: int = 8):
        q = (query or '').strip()
        if not q:
            return {
                'users': [],
                'activities': [],
                'projects': [],
                'groups': [],
                'tags': []
            }

        like_term = f"%{q}%"

        # 1. Search Users
        user_query = User.query.join(Profile, isouter=True).filter(
            (User.username.ilike(like_term)) |
            (Profile.display_name.ilike(like_term)) |
            (Profile.headline.ilike(like_term)) |
            (Profile.bio.ilike(like_term)) |
            (Profile.city.ilike(like_term))
        )
        if current_user:
            user_query = user_query.filter(User.id != current_user.id)

        found_users = user_query.limit(limit).all()
        users_result = []
        for u in found_users:
            u_dict = u.to_dict()
            if current_user:
                comp = MatchingService.calculate_compatibility(current_user, u)
                u_dict['compatibility'] = comp
            users_result.append(u_dict)

        # 2. Search Activities
        found_activities = Activity.query.filter(
            (Activity.title.ilike(like_term)) |
            (Activity.description.ilike(like_term)) |
            (Activity.category.ilike(like_term)) |
            (Activity.city.ilike(like_term))
        ).limit(limit).all()
        activities_result = [a.to_dict(current_user.id if current_user else None) for a in found_activities]

        # 3. Search Projects
        found_projects = Project.query.filter(
            (Project.title.ilike(like_term)) |
            (Project.description.ilike(like_term)) |
            (Project.category.ilike(like_term)) |
            (Project.goals.ilike(like_term))
        ).limit(limit).all()
        projects_result = [p.to_dict(current_user.id if current_user else None) for p in found_projects]

        # 4. Search Groups
        found_groups = Group.query.filter(
            (Group.name.ilike(like_term)) |
            (Group.description.ilike(like_term)) |
            (Group.category.ilike(like_term))
        ).limit(limit).all()
        groups_result = [g.to_dict(current_user.id if current_user else None) for g in found_groups]

        # 5. Matching Interests & Skills tags
        found_interests = Interest.query.filter(Interest.name.ilike(like_term)).limit(4).all()
        found_skills = Skill.query.filter(Skill.name.ilike(like_term)).limit(4).all()
        tags_result = [
            {'type': 'interest', 'name': i.name, 'category': i.category} for i in found_interests
        ] + [
            {'type': 'skill', 'name': s.name, 'category': s.category} for s in found_skills
        ]

        return {
            'query': q,
            'total_count': len(users_result) + len(activities_result) + len(projects_result) + len(groups_result),
            'users': users_result,
            'activities': activities_result,
            'projects': projects_result,
            'groups': groups_result,
            'tags': tags_result
        }
