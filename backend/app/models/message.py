from datetime import datetime
from .user import db, generate_uuid

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user1_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user2_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    messages = db.relationship('Message', backref='conversation', cascade='all, delete-orphan', order_by='Message.created_at.asc()')

    __table_args__ = (
        db.UniqueConstraint('user1_id', 'user2_id', name='uq_conversation_users'),
    )

    def to_dict(self, current_user_id=None):
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        last_msg = self.messages[-1] if self.messages else None
        unread_count = sum(1 for m in self.messages if m.sender_id != current_user_id and not m.is_read) if current_user_id else 0
        
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'other_user': {
                'id': other_user.id if other_user else None,
                'username': other_user.username if other_user else '',
                'display_name': other_user.profile.display_name if other_user and other_user.profile else '',
                'avatar_url': other_user.profile.avatar_url if other_user and other_user.profile else None,
                'city': other_user.profile.city if other_user and other_user.profile else None,
                'headline': other_user.profile.headline if other_user and other_user.profile else None
            } if other_user else None,
            'last_message': last_msg.to_dict() if last_msg else None,
            'unread_count': unread_count,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None
        }

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, contact_share, invite
    metadata_json = db.Column(db.JSON, nullable=True)  # For structured info like shared contact cards
    is_read = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    sender = db.relationship('User', foreign_keys=[sender_id])

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_username': self.sender.username if self.sender else '',
            'sender_name': self.sender.profile.display_name if self.sender and self.sender.profile else '',
            'sender_avatar': self.sender.profile.avatar_url if self.sender and self.sender.profile else None,
            'content': self.content,
            'message_type': self.message_type,
            'metadata': self.metadata_json,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
