import requests
import logging

import threading

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = '7968530811:AAFyAKWD8Pgq7Yjg06T_zvopNvFCqVWqXNM'
TELEGRAM_API_BASE = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}'

# In-memory cached chat_id to avoid repeated getUpdates roundtrips
_CACHED_CHAT_ID = None

class TelegramBotService:
    """
    Sends user support messages to the Telegram bot asynchronously.
    The bot forwards these to the admin's Telegram chat without blocking user requests.
    """

    @staticmethod
    def get_bot_chat_id():
        global _CACHED_CHAT_ID
        if _CACHED_CHAT_ID:
            return _CACHED_CHAT_ID

        try:
            res = requests.get(f'{TELEGRAM_API_BASE}/getUpdates', timeout=3)
            data = res.json()
            if data.get('ok') and data.get('result'):
                for update in reversed(data['result']):
                    chat = update.get('message', {}).get('chat', {})
                    if chat.get('id'):
                        _CACHED_CHAT_ID = chat['id']
                        return _CACHED_CHAT_ID
        except Exception as e:
            logger.warning(f'Failed to get Telegram bot chat_id: {e}')
        return None

    @staticmethod
    def _dispatch_async(chat_id: str, text: str):
        try:
            res = requests.post(
                f'{TELEGRAM_API_BASE}/sendMessage',
                json={
                    'chat_id': chat_id,
                    'text': text,
                    'parse_mode': 'Markdown'
                },
                timeout=5
            )
            result = res.json()
            if result.get('ok'):
                logger.info(f'Support message sent to Telegram chat {chat_id}')
            else:
                logger.warning(f'Telegram API response: {result}')
        except Exception as e:
            logger.warning(f'Async Telegram dispatch error: {e}')

    @staticmethod
    def send_support_message(
        sender_username: str,
        sender_display_name: str,
        sender_email: str = '',
        sender_telegram: str = '',
        topic: str = 'support',
        subject: str = 'General Inquiry',
        message: str = ''
    ) -> bool:
        """
        Send a formatted support message to Telegram bot in a background thread.
        Returns True immediately to prevent blocking the user HTTP request.
        """
        chat_id = TelegramBotService.get_bot_chat_id()
        if not chat_id:
            logger.info('No active Telegram chat_id found yet for notifications.')
            return False

        topic_emoji = {
            'support': '🛠',
            'safety': '🚨',
            'feature': '💡',
            'partnership': '🤝',
            'other': '📩'
        }
        emoji = topic_emoji.get(topic, '📩')

        contact_lines = []
        if sender_telegram:
            contact_lines.append(f'  📱 Telegram: @{sender_telegram.lstrip("@")}')
        if sender_email:
            contact_lines.append(f'  ✉️ Email: {sender_email}')
        contact_lines.append(f'  👤 WithMe: @{sender_username}')

        contact_section = '\n'.join(contact_lines)

        text = (
            f'{emoji} *NEW SUPPORT REQUEST*\n'
            f'━━━━━━━━━━━━━━━━━━━━\n\n'
            f'*Topic:* {topic.upper()}\n'
            f'*Subject:* {subject}\n'
            f'*From:* {sender_display_name} (@{sender_username})\n\n'
            f'💬 *Message:*\n'
            f'{message}\n\n'
            f'━━━━━━━━━━━━━━━━━━━━\n'
            f'📞 *Contact this user:*\n'
            f'{contact_section}\n'
        )

        # Dispatch non-blocking background thread
        thread = threading.Thread(
            target=TelegramBotService._dispatch_async,
            args=(chat_id, text),
            daemon=True
        )
        thread.start()
        return True
