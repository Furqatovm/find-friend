from datetime import datetime
from .user import db, generate_uuid

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Startups, Open Source, Game Dev, AI, Research, etc.
    goals = db.Column(db.Text, nullable=True)
    
    looking_for_roles = db.Column(db.String(255), nullable=False)  # e.g., "Frontend Dev, UI/UX Designer, ML Engineer"
    required_skills = db.Column(db.String(255), nullable=True)    # e.g., "React, Python, PyTorch"
    
    image_url = db.Column(db.String(500), nullable=True)
    max_members = db.Column(db.Integer, default=5)
    status = db.Column(db.String(20), default='recruiting')  # recruiting, in_progress, completed
    stage = db.Column(db.String(50), default='Idea')  # Idea, Prototype, MVP, Launched
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[creator_id])
    members = db.relationship('ProjectMember', backref='project', cascade='all, delete-orphan')
    groups = db.relationship('Group', backref='project', cascade='all, delete-orphan', order_by='Group.created_at.asc()')

    def to_dict(self, current_user_id=None):
        is_member = any(m.user_id == current_user_id for m in self.members) if current_user_id else False
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
            'image_url': self.image_url,
            'goals': self.goals,
            'looking_for_roles': [r.strip() for r in self.looking_for_roles.split(',')] if self.looking_for_roles else [],
            'required_skills': [s.strip() for s in self.required_skills.split(',')] if self.required_skills else [],
            'max_members': self.max_members,
            'member_count': len(self.members),
            'members': [m.to_dict() for m in self.members],
            'groups': [g.to_dict(current_user_id) for g in self.groups],
            'status': self.status,
            'stage': self.stage,
            'is_member': is_member,
            'is_creator': is_creator,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ProjectMember(db.Model):
    __tablename__ = 'project_members'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(50), default='Contributor')  # Lead, Frontend, Backend, Designer, etc.
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')

    __table_args__ = (
        db.UniqueConstraint('project_id', 'user_id', name='uq_project_member'),
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
