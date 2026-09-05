from ..models.user import db, User
from ..models.connection import Connection
from ..models.notification_and_safety import Notification, ContactShare, Block

class ConnectionService:
    @staticmethod
    def get_connection_status(user1_id: str, user2_id: str):
        if user1_id == user2_id:
            return {'status': 'self'}
        
        conn = Connection.query.filter(
            ((Connection.requester_id == user1_id) & (Connection.addressee_id == user2_id)) |
            ((Connection.requester_id == user2_id) & (Connection.addressee_id == user1_id))
        ).first()
        
        if not conn:
            return {'status': 'none', 'id': None}
        
        return {
            'status': conn.status,
            'id': conn.id,
            'is_requester': conn.requester_id == user1_id,
            'created_at': conn.created_at.isoformat() if conn.created_at else None
        }

    @staticmethod
    def send_request(requester: User, addressee_id: str, note: str = None):
        if requester.id == addressee_id:
            return None, "You cannot connect with yourself"

        # Check block
        is_blocked = Block.query.filter(
            ((Block.blocker_id == requester.id) & (Block.blocked_id == addressee_id)) |
            ((Block.blocker_id == addressee_id) & (Block.blocked_id == requester.id))
        ).first()
        if is_blocked:
            return None, "Unable to send request to this user"

        existing = Connection.query.filter(
            ((Connection.requester_id == requester.id) & (Connection.addressee_id == addressee_id)) |
            ((Connection.requester_id == addressee_id) & (Connection.addressee_id == requester.id))
        ).first()

        if existing:
            if existing.status == 'accepted':
                return None, "You are already connected"
            elif existing.status == 'pending':
                return None, "A connection request is already pending"
            else:
                existing.status = 'pending'
                existing.requester_id = requester.id
                existing.addressee_id = addressee_id
                existing.message = note
                db.session.commit()
                return existing, None

        conn = Connection(
            requester_id=requester.id,
            addressee_id=addressee_id,
            status='pending',
            message=note
        )
        db.session.add(conn)

        # Create notification
        notif = Notification(
            recipient_id=addressee_id,
            sender_id=requester.id,
            type='connection_request',
            title='New Connection Request',
            message=f"{requester.profile.display_name if requester.profile else requester.username} sent you a connection request.",
            link=f"/users/{requester.id}"
        )
        db.session.add(notif)
        db.session.commit()
        return conn, None

    @staticmethod
    def respond_to_request(connection_id: str, current_user_id: str, action: str):
        conn = Connection.query.get(connection_id)
        if not conn or conn.addressee_id != current_user_id:
            return None, "Connection request not found or unauthorized"
        
        if action == 'accept':
            conn.status = 'accepted'
            # Notify requester
            notif = Notification(
                recipient_id=conn.requester_id,
                sender_id=current_user_id,
                type='connection_accepted',
                title='Connection Accepted',
                message="Your connection request was accepted! You can now message each other.",
                link=f"/users/{current_user_id}"
            )
            db.session.add(notif)
        elif action == 'decline':
            conn.status = 'declined'
        else:
            return None, "Invalid action"
            
        db.session.commit()
        return conn, None

    @staticmethod
    def remove_connection(connection_id: str, current_user_id: str):
        conn = Connection.query.get(connection_id)
        if not conn or (conn.requester_id != current_user_id and conn.addressee_id != current_user_id):
            return False, "Connection not found or unauthorized"
        
        db.session.delete(conn)
        db.session.commit()
        return True, None

    @staticmethod
    def get_user_connections(user_id: str):
        conns = Connection.query.filter(
            ((Connection.requester_id == user_id) | (Connection.addressee_id == user_id)) &
            (Connection.status == 'accepted')
        ).all()

        results = []
        for c in conns:
            other_user = c.addressee if c.requester_id == user_id else c.requester
            if other_user and other_user.is_active:
                results.append({
                    'connection_id': c.id,
                    'user': {
                        'id': other_user.id,
                        'username': other_user.username,
                        'display_name': other_user.profile.display_name if other_user.profile else other_user.username,
                        'headline': other_user.profile.headline if other_user.profile else '',
                        'avatar_url': other_user.profile.avatar_url if other_user.profile else None,
                        'city': other_user.profile.city if other_user.profile else None
                    },
                    'connected_at': c.updated_at.isoformat() if c.updated_at else None
                })
        return results

    @staticmethod
    def get_mutual_connections(user1_id: str, user2_id: str):
        if user1_id == user2_id:
            return []

        def get_friend_ids(uid):
            conns = Connection.query.filter(
                ((Connection.requester_id == uid) | (Connection.addressee_id == uid)) &
                (Connection.status == 'accepted')
            ).all()
            return {c.addressee_id if c.requester_id == uid else c.requester_id for c in conns}

        friends1 = get_friend_ids(user1_id)
        friends2 = get_friend_ids(user2_id)
        mutual_ids = friends1.intersection(friends2)

        if not mutual_ids:
            return []

        mutual_users = User.query.filter(User.id.in_(mutual_ids), User.is_active == True).all()
        return [{
            'id': u.id,
            'username': u.username,
            'display_name': u.profile.display_name if u.profile else u.username,
            'avatar_url': u.profile.avatar_url if u.profile else None,
            'headline': u.profile.headline if u.profile else ''
        } for u in mutual_users]
