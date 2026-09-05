from datetime import datetime
from .user import db, generate_uuid

class Profile(db.Model):
    __tablename__ = 'profiles'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    display_name = db.Column(db.String(100), nullable=False)
    headline = db.Column(db.String(150), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    
    city = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    timezone = db.Column(db.String(50), default='UTC')
    
    # Preferences
    activity_mode = db.Column(db.String(20), default='both')  # online, in_person, both
    preferred_group_size = db.Column(db.String(20), default='any')  # 1-on-1, small_group, large_group, any
    looking_for_summary = db.Column(db.String(255), nullable=True)
    
    # Live User Status
    status = db.Column(db.String(20), default='online')  # online, available, busy, away, offline
    status_message = db.Column(db.String(100), nullable=True)
    
    # Social contacts (private by default, shared voluntarily)
    telegram = db.Column(db.String(100), nullable=True)
    discord = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    github = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(200), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'display_name': self.display_name,
            'headline': self.headline,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'city': self.city,
            'country': self.country,
            'timezone': self.timezone,
            'activity_mode': self.activity_mode,
            'preferred_group_size': self.preferred_group_size,
            'looking_for_summary': self.looking_for_summary,
            'status': self.status or 'online',
            'status_message': self.status_message or '',
            'telegram': self.telegram,
            'discord': self.discord,
            'github': self.github
        }

class LocationPreference(db.Model):
    __tablename__ = 'location_preferences'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    location_enabled = db.Column(db.Boolean, default=False)
    # Stored fuzzed/approximate coordinates (never raw precise GPS)
    approx_latitude = db.Column(db.Float, nullable=True)
    approx_longitude = db.Column(db.Float, nullable=True)
    fuzzed_latitude = db.Column(db.Float, nullable=True)
    fuzzed_longitude = db.Column(db.Float, nullable=True)
    geohash_prefix = db.Column(db.String(12), nullable=True)
    
    discovery_radius_km = db.Column(db.Integer, default=25)
    show_on_nearby = db.Column(db.Boolean, default=True)
    show_distance = db.Column(db.Boolean, default=True)
    show_city = db.Column(db.Boolean, default=True)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'location_enabled': self.location_enabled,
            'discovery_radius_km': self.discovery_radius_km,
            'show_on_nearby': self.show_on_nearby,
            'show_distance': self.show_distance,
            'show_city': self.show_city
        }
