from datetime import datetime
from .user import db, generate_uuid

class Follow(db.Model):
    __tablename__ = 'follows'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    follower_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    followed_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    follower = db.relationship('User', foreign_keys=[follower_id])
    followed = db.relationship('User', foreign_keys=[followed_id])

    __table_args__ = (
        db.UniqueConstraint('follower_id', 'followed_id', name='uq_follower_followed'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'follower_id': self.follower_id,
            'followed_id': self.followed_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
