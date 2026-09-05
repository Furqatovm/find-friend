import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_onboarded = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    location_pref = db.relationship('LocationPreference', backref='user', uselist=False, cascade='all, delete-orphan')
    
    interests = db.relationship('UserInterest', backref='user', cascade='all, delete-orphan')
    skills = db.relationship('UserSkill', backref='user', cascade='all, delete-orphan')
    goals = db.relationship('UserGoal', backref='user', cascade='all, delete-orphan')
    availabilities = db.relationship('Availability', backref='user', cascade='all, delete-orphan')

    def set_password(self, password: str):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'username': self.username,
            'is_active': self.is_active,
            'is_admin': self.is_admin or False,
            'is_onboarded': self.is_onboarded,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'profile': self.profile.to_dict() if self.profile else None,
            'location_pref': self.location_pref.to_dict() if self.location_pref else None
        }
        if include_private:
            data['email'] = self.email
        return data
