from datetime import datetime
from .user import db, generate_uuid

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    
    type = db.Column(db.String(50), nullable=False)  # connection_request, connection_accepted, message, activity_invite, project_invite, group_invite
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    link = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    sender = db.relationship('User', foreign_keys=[sender_id])

    def to_dict(self):
        return {
            'id': self.id,
            'recipient_id': self.recipient_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.profile.display_name if self.sender and self.sender.profile else None,
            'sender_avatar': self.sender.profile.avatar_url if self.sender and self.sender.profile else None,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Block(db.Model):
    __tablename__ = 'blocks'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    blocker_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    blocked_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('blocker_id', 'blocked_id', name='uq_blocker_blocked'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'blocker_id': self.blocker_id,
            'blocked_id': self.blocked_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    reporter_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reported_user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    reason = db.Column(db.String(100), nullable=False)  # spam, harassment, inappropriate_content, fake_profile, other
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, dismissed, actioned
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'reporter_id': self.reporter_id,
            'reported_user_id': self.reported_user_id,
            'reason': self.reason,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ContactShare(db.Model):
    __tablename__ = 'contact_shares'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    share_email = db.Column(db.Boolean, default=False)
    share_phone = db.Column(db.Boolean, default=False)
    share_telegram = db.Column(db.Boolean, default=False)
    share_discord = db.Column(db.Boolean, default=False)
    share_github = db.Column(db.Boolean, default=False)
    share_website = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('sender_id', 'recipient_id', name='uq_contact_share_pair'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'share_email': self.share_email,
            'share_phone': self.share_phone,
            'share_telegram': self.share_telegram,
            'share_discord': self.share_discord,
            'share_github': self.share_github,
            'share_website': self.share_website
        }
