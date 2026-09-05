from ..models.user import db, User
from ..models.activity import Activity, ActivityParticipant
from ..models.notification_and_safety import Notification
from ..utils.location_utils import fuzz_coordinates

class ActivityService:
    @staticmethod
    def get_all(category=None, location_type=None, search=None, current_user_id=None):
        query = Activity.query
        if category and category.lower() != 'all':
            query = query.filter(Activity.category.ilike(f"%{category}%"))
        if location_type and location_type.lower() != 'all':
            query = query.filter(Activity.location_type == location_type)
        if search:
            query = query.filter(
                (Activity.title.ilike(f"%{search}%")) |
                (Activity.description.ilike(f"%{search}%")) |
                (Activity.city.ilike(f"%{search}%"))
            )
        
        activities = query.order_by(Activity.created_at.desc()).all()
        return [a.to_dict(current_user_id) for a in activities]

    @staticmethod
    def get_by_id(activity_id: str, current_user_id: str = None):
        act = Activity.query.get(activity_id)
        return act.to_dict(current_user_id) if act else None

    @staticmethod
    def create_activity(creator: User, data: dict):
        lat = data.get('approx_latitude')
        lon = data.get('approx_longitude')
        if lat and lon:
            lat, lon = fuzz_coordinates(float(lat), float(lon))

        act = Activity(
            creator_id=creator.id,
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category', 'Study'),
            location_type=data.get('location_type', 'online'),
            city=data.get('city') or (creator.profile.city if creator.profile else None),
            general_location=data.get('general_location'),
            approx_latitude=lat,
            approx_longitude=lon,
            event_date=data.get('event_date'),
            event_time=data.get('event_time'),
            max_participants=int(data.get('max_participants', 6)),
            required_skills=data.get('required_skills')
        )
        db.session.add(act)
        db.session.flush()

        # Add creator as host participant
        participant = ActivityParticipant(activity_id=act.id, user_id=creator.id, role='host')
        db.session.add(participant)

        # Automatically create linked activity chat group
        from ..models.group import Group, GroupMember, GroupMessage
        group = Group(
            creator_id=creator.id,
            activity_id=act.id,
            name=f"{act.title} Chat",
            description=f"Official coordination channel for activity '{act.title}' ({act.event_date} {act.event_time})",
            category=act.category or 'Activities',
            is_private=False
        )
        db.session.add(group)
        db.session.flush()
        db.session.add(GroupMember(group_id=group.id, user_id=creator.id, role='admin'))
        db.session.add(GroupMessage(
            group_id=group.id,
            author_id=creator.id,
            content=f"Welcome to the activity group chat for '{act.title}'! 📅 Date: {act.event_date} at {act.event_time}",
            message_type='system'
        ))

        db.session.commit()
        return act

    @staticmethod
    def join_activity(activity_id: str, user: User):
        act = Activity.query.get(activity_id)
        if not act:
            return None, "Activity not found"
        
        if len(act.participants) >= act.max_participants:
            return None, "Activity is full"
            
        existing = ActivityParticipant.query.filter_by(activity_id=activity_id, user_id=user.id).first()
        if existing:
            return None, "Already joined this activity"

        part = ActivityParticipant(activity_id=activity_id, user_id=user.id, role='member')
        db.session.add(part)

        # Auto-join user to activity chat group if exists
        from ..models.group import GroupMember
        for grp in act.groups:
            if not any(m.user_id == user.id for m in grp.members):
                db.session.add(GroupMember(group_id=grp.id, user_id=user.id, role='member'))

        # Notify host
        if act.creator_id != user.id:
            notif = Notification(
                recipient_id=act.creator_id,
                sender_id=user.id,
                type='activity_joined',
                title='New Participant',
                message=f"{user.profile.display_name if user.profile else user.username} joined your activity '{act.title}'.",
                link=f"/activities/{act.id}"
            )
            db.session.add(notif)
            
        db.session.commit()
        return act.to_dict(user.id), None

    @staticmethod
    def get_or_create_activity_group(activity_id: str, user: User):
        act = Activity.query.get(activity_id)
        if not act:
            return None, "Activity not found"

        from ..models.group import Group, GroupMember, GroupMessage
        grp = Group.query.filter_by(activity_id=act.id).first()
        if not grp:
            grp = Group(
                creator_id=act.creator_id,
                activity_id=act.id,
                name=f"{act.title} Chat",
                description=f"Official coordination channel for activity '{act.title}'",
                category=act.category or 'Activities',
                is_private=False
            )
            db.session.add(grp)
            db.session.flush()

            # Add host and all current participants
            for p in act.participants:
                role = 'admin' if p.role == 'host' else 'member'
                db.session.add(GroupMember(group_id=grp.id, user_id=p.user_id, role=role))

            db.session.add(GroupMessage(
                group_id=grp.id,
                author_id=act.creator_id,
                content=f"Welcome to the activity group chat for '{act.title}'! 📅 Date: {act.event_date} at {act.event_time}",
                message_type='system'
            ))
            db.session.commit()
        else:
            if not any(m.user_id == user.id for m in grp.members):
                db.session.add(GroupMember(group_id=grp.id, user_id=user.id, role='member'))
                db.session.commit()

        return grp.to_dict(user.id), None

    @staticmethod
    def leave_activity(activity_id: str, user_id: str):
        act = Activity.query.get(activity_id)
        if not act:
            return False, "Activity not found"
            
        part = ActivityParticipant.query.filter_by(activity_id=activity_id, user_id=user_id).first()
        if not part:
            return False, "Not participating in this activity"
            
        if part.role == 'host' and len(act.participants) > 1:
            # Transfer host to next member
            next_part = next(p for p in act.participants if p.user_id != user_id)
            next_part.role = 'host'
            act.creator_id = next_part.user_id
            
        db.session.delete(part)
        
        # If no participants left, remove or mark cancelled
        if len(act.participants) <= 1:
            act.status = 'cancelled'

        db.session.commit()
        return True, None
