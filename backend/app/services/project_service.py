from ..models.user import db, User
from ..models.project import Project, ProjectMember
from ..models.notification_and_safety import Notification

class ProjectService:
    @staticmethod
    def get_all(category=None, stage=None, search=None, current_user_id=None):
        query = Project.query
        if category and category.lower() != 'all':
            query = query.filter(Project.category.ilike(f"%{category}%"))
        if stage and stage.lower() != 'all':
            query = query.filter(Project.stage == stage)
        if search:
            query = query.filter(
                (Project.title.ilike(f"%{search}%")) |
                (Project.description.ilike(f"%{search}%")) |
                (Project.looking_for_roles.ilike(f"%{search}%")) |
                (Project.required_skills.ilike(f"%{search}%"))
            )
        
        projects = query.order_by(Project.created_at.desc()).all()
        return [p.to_dict(current_user_id) for p in projects]

    @staticmethod
    def get_by_id(project_id: str, current_user_id: str = None):
        project = Project.query.get(project_id)
        return project.to_dict(current_user_id) if project else None

    @staticmethod
    def create_project(creator: User, data: dict):
        project = Project(
            creator_id=creator.id,
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category', 'Startups'),
            image_url=data.get('image_url'),
            goals=data.get('goals'),
            looking_for_roles=data.get('looking_for_roles', 'Contributor'),
            required_skills=data.get('required_skills', ''),
            max_members=int(data.get('max_members', 5)),
            stage=data.get('stage', 'Idea')
        )
        db.session.add(project)
        db.session.flush()

        # Add creator as Lead
        member = ProjectMember(project_id=project.id, user_id=creator.id, role='Project Lead')
        db.session.add(member)
        db.session.commit()
        return project

    @staticmethod
    def join_project(project_id: str, user: User, role: str = 'Contributor'):
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found"
        
        if len(project.members) >= project.max_members:
            return None, "Project team is full"
            
        existing = ProjectMember.query.filter_by(project_id=project_id, user_id=user.id).first()
        if existing:
            return None, "Already a member of this project"

        member = ProjectMember(project_id=project_id, user_id=user.id, role=role)
        db.session.add(member)

        # Notify lead
        if project.creator_id != user.id:
            notif = Notification(
                recipient_id=project.creator_id,
                sender_id=user.id,
                type='project_invite',
                title='New Project Teammate',
                message=f"{user.profile.display_name if user.profile else user.username} joined your project '{project.title}' as {role}.",
                link=f"/projects/{project.id}"
            )
            db.session.add(notif)
            
        db.session.commit()
        return project.to_dict(user.id), None

    @staticmethod
    def leave_project(project_id: str, user_id: str):
        project = Project.query.get(project_id)
        if not project:
            return False, "Project not found"
            
        member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
        if not member:
            return False, "Not a member of this project"
            
        db.session.delete(member)
        db.session.commit()
        return True, None

    @staticmethod
    def update_project(project_id: str, current_user: User, data: dict):
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found", 404
            
        is_creator = project.creator_id == current_user.id
        is_admin = getattr(current_user, 'role', '') == 'admin'
        if not (is_creator or is_admin):
            return None, "Only the project creator can edit this project", 403

        if 'title' in data and data['title']:
            project.title = data['title']
        if 'description' in data and data['description']:
            project.description = data['description']
        if 'category' in data and data['category']:
            project.category = data['category']
        if 'stage' in data and data['stage']:
            project.stage = data['stage']
        if 'goals' in data:
            project.goals = data['goals']
        if 'image_url' in data:
            project.image_url = data['image_url']
        if 'looking_for_roles' in data and data['looking_for_roles']:
            roles = data['looking_for_roles']
            project.looking_for_roles = ', '.join(roles) if isinstance(roles, list) else str(roles)
        if 'required_skills' in data:
            skills = data['required_skills']
            project.required_skills = ', '.join(skills) if isinstance(skills, list) else str(skills)
        if 'max_members' in data and data['max_members']:
            try:
                project.max_members = int(data['max_members'])
            except (ValueError, TypeError):
                pass
        if 'status' in data and data['status']:
            project.status = data['status']

        db.session.commit()
        return project.to_dict(current_user.id), None, 200

    @staticmethod
    def delete_project(project_id: str, current_user: User):
        project = Project.query.get(project_id)
        if not project:
            return False, "Project not found", 404
            
        is_creator = project.creator_id == current_user.id
        is_admin = getattr(current_user, 'role', '') == 'admin'
        if not (is_creator or is_admin):
            return False, "Only the project creator can delete this project", 403

        db.session.delete(project)
        db.session.commit()
        return True, None, 200

    @staticmethod
    def get_project_groups(project_id: str, current_user_id: str = None):
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found"
        return [g.to_dict(current_user_id) for g in project.groups], None

    @staticmethod
    def create_project_group(project_id: str, creator: User, data: dict):
        project = Project.query.get(project_id)
        if not project:
            return None, "Project not found", 404

        # Verify creator is either the project lead or a member of the project
        is_creator = project.creator_id == creator.id
        is_member = any(m.user_id == creator.id for m in project.members)
        if not (is_creator or is_member or getattr(creator, 'role', '') == 'admin'):
            return None, "You must be a team member of this project to create a project group", 403

        name = (data.get('name') or '').strip()
        if not name:
            return None, "Group name is required", 400

        from ..models.group import Group, GroupMember, GroupMessage

        group = Group(
            creator_id=creator.id,
            project_id=project.id,
            name=name,
            description=data.get('description') or f"Chat and discussion group for project '{project.title}'",
            category=data.get('category') or project.category or 'Projects',
            avatar_url=data.get('avatar_url') or project.image_url,
            banner_url=data.get('banner_url'),
            is_private=bool(data.get('is_private', False))
        )
        db.session.add(group)
        db.session.flush()

        # Add group creator as admin
        creator_member = GroupMember(group_id=group.id, user_id=creator.id, role='admin')
        db.session.add(creator_member)

        # Automatically join all existing project team members so they can chat right away
        for pm in project.members:
            if pm.user_id != creator.id:
                m = GroupMember(group_id=group.id, user_id=pm.user_id, role='member')
                db.session.add(m)

        # Create welcome message
        welcome = GroupMessage(
            group_id=group.id,
            author_id=creator.id,
            content=f"Welcome to the {group.name} group chat for '{project.title}'! 🚀",
            message_type='system'
        )
        db.session.add(welcome)

        # Create notifications for team members
        for pm in project.members:
            if pm.user_id != creator.id:
                notif = Notification(
                    recipient_id=pm.user_id,
                    sender_id=creator.id,
                    type='group_invite',
                    title=f"New Chat Group in '{project.title}'",
                    message=f"{creator.profile.display_name if creator.profile else creator.username} created group '{group.name}' for team discussion.",
                    link=f"/groups/{group.id}"
                )
                db.session.add(notif)

        db.session.commit()
        return group.to_dict(creator.id), None, 201
