from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
from ..models.user import db, User
from ..models.group import Group, GroupMember, GroupMessage
from ..models.notification_and_safety import Notification

class GroupService:
    @staticmethod
    def get_all(category=None, search=None, current_user_id=None):
        query = Group.query
        if category and category.lower() != 'all':
            query = query.filter(Group.category.ilike(f"%{category}%"))
        if search:
            query = query.filter(
                (Group.name.ilike(f"%{search}%")) |
                (Group.description.ilike(f"%{search}%"))
            )
        
        groups = query.order_by(Group.created_at.desc()).all()
        return [g.to_dict(current_user_id) for g in groups]

    @staticmethod
    def get_by_id(group_id: str, current_user_id: str = None):
        group = Group.query.get(group_id)
        if not group:
            return None
        
        data = group.to_dict(current_user_id)
        data['messages'] = [m.to_dict(current_user_id) for m in group.messages]
        return data

    @staticmethod
    def create_group(creator: User, data: dict):
        group = Group(
            creator_id=creator.id,
            name=data.get('name'),
            description=data.get('description'),
            category=data.get('category', 'Learning'),
            avatar_url=data.get('avatar_url'),
            banner_url=data.get('banner_url'),
            is_private=bool(data.get('is_private', False))
        )
        db.session.add(group)
        db.session.flush()

        member = GroupMember(group_id=group.id, user_id=creator.id, role='admin')
        db.session.add(member)
        
        # Add invited members (for private groups)
        invited_ids = data.get('invited_member_ids', [])
        for uid in invited_ids:
            if uid == creator.id:
                continue
            invited_user = User.query.get(uid)
            if invited_user:
                m = GroupMember(group_id=group.id, user_id=uid, role='member')
                db.session.add(m)

        # Add welcome message
        welcome_msg = GroupMessage(
            group_id=group.id,
            author_id=creator.id,
            content=f"Welcome to {group.name}! 🎉 Feel free to chat, ask questions, or share what you're working on.",
            message_type='text'
        )
        db.session.add(welcome_msg)
        
        db.session.commit()
        return group

    @staticmethod
    def join_group(group_id: str, user: User):
        from ..models.connection import Connection
        from ..models.follow import Follow

        group = Group.query.get(group_id)
        if not group:
            return None, "Group not found"
            
        existing = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
        if existing:
            return None, "Already a member of this group"

        # Private group restriction: must be connected or followed by creator
        if group.is_private:
            creator_id = group.creator_id

            is_connected = Connection.query.filter(
                ((Connection.requester_id == creator_id) & (Connection.addressee_id == user.id)) |
                ((Connection.requester_id == user.id) & (Connection.addressee_id == creator_id)),
                Connection.status == 'accepted'
            ).first() is not None

            is_follow_related = (
                Follow.query.filter_by(follower_id=creator_id, followed_id=user.id).first() is not None or
                Follow.query.filter_by(follower_id=user.id, followed_id=creator_id).first() is not None
            )

            if not is_connected and not is_follow_related:
                return None, "This is a private group. You must be connected to or following the group creator to join."

        member = GroupMember(group_id=group_id, user_id=user.id, role='member')
        db.session.add(member)

        # System message for joined user
        sys_msg = GroupMessage(
            group_id=group.id,
            author_id=user.id,
            content=f"{user.profile.display_name if user.profile else user.username} joined the group",
            message_type='system'
        )
        db.session.add(sys_msg)

        db.session.commit()
        return group.to_dict(user.id), None

    @staticmethod
    def leave_group(group_id: str, user_id: str):
        group = Group.query.get(group_id)
        if not group:
            return False, "Group not found"
            
        member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
        if not member:
            return False, "Not a member"
            
        db.session.delete(member)
        db.session.commit()
        return True, None

    @staticmethod
    def send_group_message(group_id: str, author: User, data: dict):
        group = Group.query.get(group_id)
        if not group:
            return None, "Group not found"
            
        is_member = any(m.user_id == author.id for m in group.members)
        if not is_member and not group.is_private:
            member = GroupMember(group_id=group.id, user_id=author.id, role='member')
            db.session.add(member)
            db.session.flush()
        elif not is_member and group.is_private:
            return None, "Must be a group member to send messages"

        content = data.get('content', '').strip()
        msg_type = data.get('message_type', 'text')
        reply_to_id = data.get('reply_to_id')
        poll_data = data.get('poll_data')
        attachment_url = data.get('attachment_url')

        if msg_type == 'text' and not content:
            return None, "Message content cannot be empty"

        if msg_type == 'poll' and not poll_data:
            return None, "Poll data is required for polls"

        msg = GroupMessage(
            group_id=group_id,
            author_id=author.id,
            content=content or (poll_data.get('question') if poll_data else ''),
            message_type=msg_type,
            reply_to_id=reply_to_id,
            poll_data=poll_data,
            attachment_url=attachment_url,
            reactions={}
        )
        db.session.add(msg)
        group.updated_at = datetime.utcnow()
        db.session.commit()
        return msg.to_dict(author.id), None

    @staticmethod
    def toggle_reaction(message_id: str, user: User, emoji: str):
        msg = GroupMessage.query.get(message_id)
        if not msg:
            return None, "Message not found"
            
        reactions = dict(msg.reactions or {})
        current_users = list(reactions.get(emoji, []))
        
        if user.id in current_users:
            current_users.remove(user.id)
        else:
            current_users.append(user.id)
            
        if current_users:
            reactions[emoji] = current_users
        elif emoji in reactions:
            del reactions[emoji]

        msg.reactions = reactions
        flag_modified(msg, 'reactions')
        db.session.commit()
        return msg.to_dict(user.id), None

    @staticmethod
    def vote_poll(message_id: str, user: User, option_id: str):
        msg = GroupMessage.query.get(message_id)
        if not msg or msg.message_type != 'poll' or not msg.poll_data:
            return None, "Poll not found"
            
        poll_data = dict(msg.poll_data)
        options = list(poll_data.get('options', []))
        
        # Check if user already voted for this option (toggle off vote)
        already_voted_this = False
        for opt in options:
            if opt.get('id') == option_id and user.id in opt.get('voters', []):
                already_voted_this = True
                break

        # Update options
        updated_options = []
        for opt in options:
            opt_copy = dict(opt)
            voters = list(opt_copy.get('voters', []))
            if user.id in voters:
                voters.remove(user.id)
            if opt_copy.get('id') == option_id and not already_voted_this:
                voters.append(user.id)
            opt_copy['voters'] = voters
            updated_options.append(opt_copy)
            
        poll_data['options'] = updated_options
        msg.poll_data = poll_data
        flag_modified(msg, 'poll_data')
        db.session.commit()
        return msg.to_dict(user.id), None

    @staticmethod
    def toggle_pin_message(message_id: str, user: User):
        msg = GroupMessage.query.get(message_id)
        if not msg:
            return None, "Message not found"
            
        group = msg.group
        is_admin = any(m.user_id == user.id and m.role == 'admin' for m in group.members) or (group.creator_id == user.id)
        if not is_admin:
            return None, "Only group admins can pin messages"

        new_pinned = not msg.is_pinned
        if new_pinned:
            # Unpin any previous message
            for m in group.messages:
                m.is_pinned = False
        msg.is_pinned = new_pinned
        db.session.commit()
        return msg.to_dict(user.id), None

    @staticmethod
    def unpin_message(message_id: str, user: User):
        msg = GroupMessage.query.get(message_id)
        if not msg:
            return None, "Message not found"
            
        group = msg.group
        is_admin = any(m.user_id == user.id and m.role == 'admin' for m in group.members) or (group.creator_id == user.id)
        if not is_admin:
            return None, "Only group admins can unpin messages"

        msg.is_pinned = False
        db.session.commit()
        return msg.to_dict(user.id), None

    @staticmethod
    def delete_message(message_id: str, current_user: User):
        msg = GroupMessage.query.get(message_id)
        if not msg:
            return False, "Message not found", 404

        # Only the author who sent the message can delete it
        if msg.sender_id != current_user.id:
            return False, "Only the author can delete their message", 403

        # If it was pinned, unpin it first
        if msg.is_pinned:
            msg.is_pinned = False

        db.session.delete(msg)
        db.session.commit()
        return True, None, 200

    @staticmethod
    def update_group(group_id: str, current_user: User, data: dict):
        group = Group.query.get(group_id)
        if not group:
            return None, "Group not found", 404

        is_creator = group.creator_id == current_user.id
        is_project_lead = group.project and group.project.creator_id == current_user.id
        is_admin = getattr(current_user, 'role', '') == 'admin'

        if not (is_creator or is_project_lead or is_admin):
            return None, "Only the creator or project lead can edit this group", 403

        if 'name' in data and data['name']:
            group.name = data['name'].strip()
        if 'description' in data and data['description']:
            group.description = data['description']
        if 'category' in data and data['category']:
            group.category = data['category']
        if 'avatar_url' in data:
            group.avatar_url = data['avatar_url']
        if 'banner_url' in data:
            group.banner_url = data['banner_url']
        if 'is_private' in data:
            group.is_private = bool(data['is_private'])

        db.session.commit()
        return group.to_dict(current_user.id), None, 200

    @staticmethod
    def delete_group(group_id: str, current_user: User):
        group = Group.query.get(group_id)
        if not group:
            return False, "Group not found", 404

        is_creator = group.creator_id == current_user.id
        is_project_lead = group.project and group.project.creator_id == current_user.id
        is_admin = getattr(current_user, 'role', '') == 'admin'

        if not (is_creator or is_project_lead or is_admin):
            return False, "Only the creator or project lead can delete this group", 403

        db.session.delete(group)
        db.session.commit()
        return True, None, 200
