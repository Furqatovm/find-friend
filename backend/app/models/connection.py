from datetime import datetime
from .user import db, generate_uuid

class Connection(db.Model):
    __tablename__ = 'connections'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    requester_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    addressee_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, cancelled
    message = db.Column(db.String(255), nullable=True)  # Optional initial note
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = db.relationship('User', foreign_keys=[requester_id])
    addressee = db.relationship('User', foreign_keys=[addressee_id])

    __table_args__ = (
        db.UniqueConstraint('requester_id', 'addressee_id', name='uq_requester_addressee'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'addressee_id': self.addressee_id,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
