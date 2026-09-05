from datetime import datetime
from ..models.user import db, User
from ..models.message import Conversation, Message
from ..models.connection import Connection
from ..models.notification_and_safety import Notification, ContactShare, Block

class MessageService:
    @staticmethod
    def get_or_create_conversation(user1_id: str, user2_id: str):
        if user1_id == user2_id:
            return None, "Cannot chat with yourself"

        # Check block status
        is_blocked = Block.query.filter(
            ((Block.blocker_id == user1_id) & (Block.blocked_id == user2_id)) |
            ((Block.blocker_id == user2_id) & (Block.blocked_id == user1_id))
        ).first()
        if is_blocked:
            return None, "Messaging unavailable"

        # Canonical ordering to prevent duplicates
        u1, u2 = (user1_id, user2_id) if user1_id < user2_id else (user2_id, user1_id)
        
        conv = Conversation.query.filter_by(user1_id=u1, user2_id=u2).first()
        if not conv:
            conv = Conversation(user1_id=u1, user2_id=u2)
            db.session.add(conv)
            db.session.commit()
            
        return conv, None

    @staticmethod
    def get_user_conversations(user_id: str):
        convs = Conversation.query.filter(
            (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
        ).order_by(Conversation.last_message_at.desc()).all()
        
        return [c.to_dict(user_id) for c in convs]

    @staticmethod
    def get_conversation_messages(conv_id: str, current_user_id: str):
        conv = Conversation.query.get(conv_id)
        if not conv or (conv.user1_id != current_user_id and conv.user2_id != current_user_id):
            return None, "Conversation not found or unauthorized"

        # Mark unread incoming messages as read
        unread = Message.query.filter(
            Message.conversation_id == conv_id,
            Message.sender_id != current_user_id,
            Message.is_read == False
        ).all()
        for m in unread:
            m.is_read = True
        if unread:
            db.session.commit()

        # Check contact sharing state
        other_id = conv.user2_id if conv.user1_id == current_user_id else conv.user1_id
        shared_by_them = ContactShare.query.filter_by(sender_id=other_id, recipient_id=current_user_id).first()
        shared_by_me = ContactShare.query.filter_by(sender_id=current_user_id, recipient_id=other_id).first()

        other_user = User.query.get(other_id)
        other_contacts = None
        if shared_by_them and other_user and other_user.profile:
            other_contacts = {
                'email': other_user.email if shared_by_them.share_email else None,
                'phone': other_user.profile.phone if shared_by_them.share_phone else None,
                'telegram': other_user.profile.telegram if shared_by_them.share_telegram else None,
                'discord': other_user.profile.discord if shared_by_them.share_discord else None,
                'github': other_user.profile.github if shared_by_them.share_github else None,
                'website': other_user.profile.website if shared_by_them.share_website else None
            }

        return {
            'conversation': conv.to_dict(current_user_id),
            'messages': [m.to_dict() for m in conv.messages],
            'shared_contacts': other_contacts,
            'my_shared_contacts': shared_by_me.to_dict() if shared_by_me else None
        }, None

    @staticmethod
    def send_message(conv_id: str, sender: User, content: str, message_type: str = 'text', metadata_json: dict = None):
        conv = Conversation.query.get(conv_id)
        if not conv or (conv.user1_id != sender.id and conv.user2_id != sender.id):
            return None, "Conversation not found or unauthorized"

        msg = Message(
            conversation_id=conv_id,
            sender_id=sender.id,
            content=content,
            message_type=message_type,
            metadata_json=metadata_json
        )
        db.session.add(msg)
        conv.last_message_at = datetime.utcnow()

        # Send notification to recipient
        recipient_id = conv.user2_id if conv.user1_id == sender.id else conv.user1_id
        notif = Notification(
            recipient_id=recipient_id,
            sender_id=sender.id,
            type='message',
            title=f"New message from {sender.profile.display_name if sender.profile else sender.username}",
            message=content[:100],
            link=f"/messages/{conv_id}"
        )
        db.session.add(notif)
        db.session.commit()
        return msg, None

    @staticmethod
    def share_contacts(sender: User, recipient_id: str, share_fields: dict):
        if sender.id == recipient_id:
            return None, "Cannot share contacts with yourself"

        share = ContactShare.query.filter_by(sender_id=sender.id, recipient_id=recipient_id).first()
        if not share:
            share = ContactShare(sender_id=sender.id, recipient_id=recipient_id)
            db.session.add(share)

        share.share_email = bool(share_fields.get('email', False))
        share.share_phone = bool(share_fields.get('phone', False))
        share.share_telegram = bool(share_fields.get('telegram', False))
        share.share_discord = bool(share_fields.get('discord', False))
        share.share_github = bool(share_fields.get('github', False))
        share.share_website = bool(share_fields.get('website', False))

        # Also send an inline message card into conversation if conversation exists
        conv, _ = MessageService.get_or_create_conversation(sender.id, recipient_id)
        if conv:
            active_channels = [k for k, v in share_fields.items() if v]
            card_text = f"📇 Shared contact details ({', '.join(active_channels)})"
            msg = Message(
                conversation_id=conv.id,
                sender_id=sender.id,
                content=card_text,
                message_type='contact_share',
                metadata_json={'channels': active_channels}
            )
            db.session.add(msg)
            conv.last_message_at = datetime.utcnow()

        db.session.commit()
        return share, None

    @staticmethod
    def delete_message(message_id: str, current_user_id: str):
        msg = Message.query.get(message_id)
        if not msg:
            return False, "Message not found", 404

        # Only the author who sent the message can delete it
        if msg.sender_id != current_user_id:
            return False, "Only the author can delete their message", 403

        db.session.delete(msg)
        db.session.commit()
        return True, None, 200
