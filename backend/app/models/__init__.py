from .user import db, User, generate_uuid
from .profile import Profile, LocationPreference
from .taxonomy import Interest, UserInterest, Skill, UserSkill, Goal, UserGoal, Availability
from .connection import Connection
from .message import Conversation, Message
from .activity import Activity, ActivityParticipant
from .project import Project, ProjectMember
from .group import Group, GroupMember, GroupMessage
from .notification_and_safety import Notification, Block, Report, ContactShare

# Alias for backward compatibility
GroupPost = GroupMessage

__all__ = [
    'db',
    'User',
    'Profile',
    'LocationPreference',
    'Interest',
    'UserInterest',
    'Skill',
    'UserSkill',
    'Goal',
    'UserGoal',
    'Availability',
    'Connection',
    'Conversation',
    'Message',
    'Activity',
    'ActivityParticipant',
    'Project',
    'ProjectMember',
    'Group',
    'GroupMember',
    'GroupMessage',
    'GroupPost',
    'Notification',
    'Block',
    'Report',
    'ContactShare',
    'generate_uuid'
]
