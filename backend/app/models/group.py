from datetime import datetime
from .user import db, generate_uuid

class Group(db.Model):
    __tablename__ = 'groups'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True, index=True)
    activity_id = db.Column(db.String(36), db.ForeignKey('activities.id', ondelete='CASCADE'), nullable=True, index=True)
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    avatar_url = db.Column(db.String(500), nullable=True)
    banner_url = db.Column(db.String(500), nullable=True)
    
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[creator_id])
    members = db.relationship('GroupMember', backref='group', cascade='all, delete-orphan')
    messages = db.relationship('GroupMessage', backref='group', cascade='all, delete-orphan', order_by='GroupMessage.created_at.asc()')

    def to_dict(self, current_user_id=None):
        is_member = any(m.user_id == current_user_id for m in self.members) if current_user_id else False
        is_admin = any(m.user_id == current_user_id and m.role == 'admin' for m in self.members) if current_user_id else False
        is_creator = self.creator_id == current_user_id if current_user_id else False
        pinned = next((m for m in self.messages if m.is_pinned), None)
        last_msg = self.messages[-1] if self.messages else None
        
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'project_id': self.project_id,
            'activity_id': self.activity_id,
            'creator': {
                'id': self.creator.id if self.creator else None,
                'username': self.creator.username if self.creator else '',
                'display_name': self.creator.profile.display_name if self.creator and self.creator.profile else '',
                'avatar_url': self.creator.profile.avatar_url if self.creator and self.creator.profile else None
            } if self.creator else None,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'avatar_url': self.avatar_url,
            'banner_url': self.banner_url,
            'is_private': self.is_private,
            'member_count': len(self.members),
            'online_count': max(1, int(len(self.members) * 0.6)),
            'members': [m.to_dict() for m in self.members],
            'pinned_message': pinned.to_dict(current_user_id) if pinned else None,
            'last_message': last_msg.to_dict(current_user_id) if last_msg else None,
            'is_member': is_member,
            'is_admin': is_admin,
            'is_creator': is_creator,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class GroupMember(db.Model):
    __tablename__ = 'group_members'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    group_id = db.Column(db.String(36), db.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(20), default='member')  # admin, moderator, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    __table_args__ = (
        db.UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'user': {
                'id': self.user.id if self.user else None,
                'username': self.user.username if self.user else '',
                'display_name': self.user.profile.display_name if self.user and self.user.profile else '',
                'avatar_url': self.user.profile.avatar_url if self.user and self.user.profile else None,
                'headline': self.user.profile.headline if self.user and self.user.profile else None
            } if self.user else None
        }

class GroupMessage(db.Model):
    __tablename__ = 'group_messages'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    group_id = db.Column(db.String(36), db.ForeignKey('groups.id', ondelete='CASCADE'), nullable=False, index=True)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, poll, photo, system
    reply_to_id = db.Column(db.String(36), db.ForeignKey('group_messages.id', ondelete='SET NULL'), nullable=True)
    
    poll_data = db.Column(db.JSON, nullable=True)  # { question: str, options: [{ id, text, voters: [userIds] }], is_closed: bool }
    reactions = db.Column(db.JSON, default=dict)   # { "👍": ["userId1"], "❤️": ["userId2"] }
    is_pinned = db.Column(db.Boolean, default=False)
    attachment_url = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    author = db.relationship('User', foreign_keys=[author_id])
    reply_to = db.relationship('GroupMessage', remote_side=[id], foreign_keys=[reply_to_id])

    def to_dict(self, current_user_id=None):
        # Format reactions into structured list
        reaction_counts = []
        user_reactions = []
        if self.reactions and isinstance(self.reactions, dict):
            for emoji, uids in self.reactions.items():
                if uids:
                    reaction_counts.append({
                        'emoji': emoji,
                        'count': len(uids),
                        'has_reacted': current_user_id in uids if current_user_id else False
                    })
                    if current_user_id and current_user_id in uids:
                        user_reactions.append(emoji)

        return {
            'id': self.id,
            'group_id': self.group_id,
            'author_id': self.author_id,
            'author_name': self.author.profile.display_name if self.author and self.author.profile else (self.author.username if self.author else 'Member'),
            'author_username': self.author.username if self.author else '',
            'author_avatar': self.author.profile.avatar_url if self.author and self.author.profile else None,
            'content': self.content,
            'message_type': self.message_type,
            'reply_to': {
                'id': self.reply_to.id,
                'author_name': self.reply_to.author.profile.display_name if self.reply_to.author and self.reply_to.author.profile else self.reply_to.author.username,
                'content': self.reply_to.content[:80]
            } if self.reply_to else None,
            'poll_data': self.poll_data,
            'reactions': reaction_counts,
            'is_pinned': self.is_pinned,
            'attachment_url': self.attachment_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
