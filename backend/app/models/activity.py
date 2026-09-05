from datetime import datetime
from .user import db, generate_uuid

class Activity(db.Model):
    __tablename__ = 'activities'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Study, Coding, Gaming, Languages, Sports, etc.
    
    location_type = db.Column(db.String(20), default='online')  # online, in_person, hybrid
    city = db.Column(db.String(100), nullable=True)
    general_location = db.Column(db.String(200), nullable=True)  # e.g., "Central Library 3rd Floor" or "Discord Server"
    approx_latitude = db.Column(db.Float, nullable=True)
    approx_longitude = db.Column(db.Float, nullable=True)
    
    event_date = db.Column(db.String(50), nullable=False)  # e.g., "2026-09-10"
    event_time = db.Column(db.String(50), nullable=False)  # e.g., "16:00"
    
    max_participants = db.Column(db.Integer, default=6)
    required_skills = db.Column(db.String(255), nullable=True)  # comma-separated
    status = db.Column(db.String(20), default='upcoming')  # upcoming, active, completed, cancelled
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[creator_id])
    participants = db.relationship('ActivityParticipant', backref='activity', cascade='all, delete-orphan')
    groups = db.relationship('Group', backref='activity', cascade='all, delete-orphan')

    def to_dict(self, current_user_id=None):
        is_joined = any(p.user_id == current_user_id for p in self.participants) if current_user_id else False
        is_creator = self.creator_id == current_user_id if current_user_id else False
        
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'creator': {
                'id': self.creator.id if self.creator else None,
                'username': self.creator.username if self.creator else '',
                'display_name': self.creator.profile.display_name if self.creator and self.creator.profile else '',
                'avatar_url': self.creator.profile.avatar_url if self.creator and self.creator.profile else None
            } if self.creator else None,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'location_type': self.location_type,
            'city': self.city,
            'general_location': self.general_location,
            'approx_latitude': self.approx_latitude,
            'approx_longitude': self.approx_longitude,
            'event_date': self.event_date,
            'event_time': self.event_time,
            'max_participants': self.max_participants,
            'participant_count': len(self.participants),
            'participants': [p.to_dict() for p in self.participants],
            'required_skills': [s.strip() for s in self.required_skills.split(',')] if self.required_skills else [],
            'status': self.status,
            'is_joined': is_joined,
            'is_creator': is_creator,
            'groups': [g.to_dict(current_user_id) for g in self.groups] if self.groups else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ActivityParticipant(db.Model):
    __tablename__ = 'activity_participants'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    activity_id = db.Column(db.String(36), db.ForeignKey('activities.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(20), default='member')  # host, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    __table_args__ = (
        db.UniqueConstraint('activity_id', 'user_id', name='uq_activity_participant'),
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
