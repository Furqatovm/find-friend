from datetime import datetime
from .user import db, generate_uuid

class Interest(db.Model):
    __tablename__ = 'interests'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, default='Other')
    icon = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'icon': self.icon
        }

class UserInterest(db.Model):
    __tablename__ = 'user_interests'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    interest_id = db.Column(db.String(36), db.ForeignKey('interests.id', ondelete='CASCADE'), nullable=False)
    
    interest = db.relationship('Interest')

    def to_dict(self):
        return {
            'id': self.interest.id if self.interest else None,
            'name': self.interest.name if self.interest else '',
            'category': self.interest.category if self.interest else 'Other',
            'icon': self.interest.icon if self.interest else None
        }

class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, default='General')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category
        }

class UserSkill(db.Model):
    __tablename__ = 'user_skills'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.String(36), db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False)
    level = db.Column(db.String(20), default='Beginner')  # Beginner, Intermediate, Advanced

    skill = db.relationship('Skill')

    def to_dict(self):
        return {
            'id': self.skill.id if self.skill else None,
            'name': self.skill.name if self.skill else '',
            'category': self.skill.category if self.skill else 'General',
            'level': self.level
        }

class Goal(db.Model):
    __tablename__ = 'goals'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, default='General')
    icon = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'icon': self.icon
        }

class UserGoal(db.Model):
    __tablename__ = 'user_goals'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    goal_id = db.Column(db.String(36), db.ForeignKey('goals.id', ondelete='CASCADE'), nullable=False)

    goal = db.relationship('Goal')

    def to_dict(self):
        return {
            'id': self.goal.id if self.goal else None,
            'title': self.goal.title if self.goal else '',
            'category': self.goal.category if self.goal else 'General',
            'icon': self.goal.icon if self.goal else None
        }

class Availability(db.Model):
    __tablename__ = 'availabilities'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    day_of_week = db.Column(db.String(20), nullable=False)  # Monday, Tuesday, etc. or Weekdays, Weekends
    time_slot = db.Column(db.String(50), nullable=False)    # Morning (08:00-12:00), Afternoon (12:00-18:00), Evening (18:00-22:00), Night (22:00+)

    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'time_slot': self.time_slot
        }
