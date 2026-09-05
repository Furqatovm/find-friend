import requests
import logging

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = '7968530811:AAFyAKWD8Pgq7Yjg06T_zvopNvFCqVWqXNM'
TELEGRAM_API_BASE = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}'


class TelegramBotService:
    """
    Sends user support messages to the Manabu Telegram bot.
    The bot forwards these to the admin's Telegram chat.
    """

    @staticmethod
    def get_bot_chat_id():
        """
        Fetch the latest chat_id from getUpdates so we know where to send.
        Falls back to stored chat_id if no updates available.
        """
        try:
            res = requests.get(f'{TELEGRAM_API_BASE}/getUpdates', timeout=5)
            data = res.json()
            if data.get('ok') and data.get('result'):
                # Get the most recent chat that messaged the bot
                for update in reversed(data['result']):
                    chat = update.get('message', {}).get('chat', {})
                    if chat.get('id'):
                        return chat['id']
        except Exception as e:
            logger.error(f'Failed to get Telegram bot chat_id: {e}')
        return None

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
        Send a formatted support message to Telegram bot.
        Returns True if sent successfully.
        """
        chat_id = TelegramBotService.get_bot_chat_id()
        if not chat_id:
            logger.warning('No Telegram chat_id found. Admin needs to /start the bot first.')
            return False

        # Topic emoji mapping
        topic_emoji = {
            'support': '🛠',
            'safety': '🚨',
            'feature': '💡',
            'partnership': '🤝',
            'other': '📩'
        }
        emoji = topic_emoji.get(topic, '📩')

        # Build contact section
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

        try:
            res = requests.post(
                f'{TELEGRAM_API_BASE}/sendMessage',
                json={
                    'chat_id': chat_id,
                    'text': text,
                    'parse_mode': 'Markdown'
                },
                timeout=10
            )
            result = res.json()
            if result.get('ok'):
                logger.info(f'Support message sent to Telegram chat {chat_id}')
                return True
            else:
                logger.error(f'Telegram API error: {result}')
                return False
        except Exception as e:
            logger.error(f'Failed to send Telegram message: {e}')
            return False
