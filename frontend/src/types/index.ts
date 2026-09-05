export interface User {
  id: string;
  username: string;
  email?: string;
  is_active?: boolean;
  is_admin?: boolean;
  is_onboarded: boolean;
  created_at: string;
  profile?: Profile;
  location_pref?: LocationPreference;
  interests?: UserInterest[];
  skills?: UserSkill[];
  goals?: UserGoal[];
  availabilities?: Availability[];
}

export interface Profile {
  id?: string;
  user_id?: string;
  display_name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  country?: string;
  timezone?: string;
  status?: string;
  status_message?: string;
  activity_mode?: 'online' | 'in_person' | 'both';
  preferred_group_size?: '1-on-1' | 'small_group' | 'large_group' | 'any';
  looking_for_summary?: string;
  telegram?: string;
  discord?: string;
  phone?: string;
  github?: string;
  website?: string;
}

export interface LocationPreference {
  location_enabled: boolean;
  discovery_radius_km: number;
  show_on_nearby: boolean;
  show_distance: boolean;
  show_city: boolean;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface UserInterest {
  id?: string;
  name: string;
  category: string;
  icon?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id?: string;
  name: string;
  category?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  icon?: string;
}

export interface UserGoal {
  id?: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface Availability {
  id?: string;
  day_of_week: string;
  time_slot: string;
}

export interface CompatibilityBreakdown {
  interests: number;
  goals: number;
  activity_style: number;
  skills: number;
  availability: number;
  location: number;
}

export interface CompatibilityInfo {
  compatibility_score: number;
  shared_interests: string[];
  shared_goals: string[];
  shared_skills: string[];
  availability_overlap: string[];
  distance_bucket: string;
  approx_distance_km?: number;
  breakdown?: CompatibilityBreakdown;
}

export interface ConnectionStatus {
  status: 'none' | 'pending' | 'accepted' | 'declined' | 'self';
  id?: string;
  is_requester?: boolean;
  created_at?: string;
}

export interface UserCardData {
  id: string;
  username: string;
  display_name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  approx_lat?: number;
  approx_lon?: number;
  activity_mode?: string;
  preferred_group_size?: string;
  looking_for_summary?: string;
  distance_bucket?: string;
  approx_distance_km?: number;
  interests: UserInterest[];
  skills: UserSkill[];
  goals: UserGoal[];
  compatibility?: CompatibilityInfo;
  connection?: ConnectionStatus;
  is_following?: boolean;
  followers_count?: number;
}

export interface Activity {
  id: string;
  creator_id: string;
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  description: string;
  category: string;
  location_type: 'online' | 'in_person' | 'hybrid';
  city?: string;
  general_location?: string;
  approx_latitude?: number;
  approx_longitude?: number;
  distance_bucket?: string;
  approx_distance_km?: number;
  event_date: string;
  event_time: string;
  max_participants: number;
  participant_count: number;
  participants: ActivityParticipant[];
  required_skills: string[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  is_joined?: boolean;
  is_creator?: boolean;
  groups?: Group[];
  created_at?: string;
}

export interface ActivityParticipant {
  id: string;
  user_id: string;
  role: 'host' | 'member';
  joined_at?: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    headline?: string;
  };
}

export interface Project {
  id: string;
  creator_id: string;
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  title: string;
  description: string;
  category: string;
  image_url?: string;
  goals?: string;
  looking_for_roles: string[];
  required_skills: string[];
  max_members: number;
  member_count: number;
  members: ProjectMember[];
  groups?: Group[];
  status: string;
  stage: 'Idea' | 'Prototype' | 'MVP' | 'Launched';
  is_member?: boolean;
  is_creator?: boolean;
  created_at?: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  joined_at?: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    headline?: string;
  };
}

export interface PollOption {
  id: string;
  text: string;
  voters: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  is_anonymous?: boolean;
  is_closed?: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  has_reacted: boolean;
  users?: string[];
}

export interface GroupMessage {
  id: string;
  group_id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  content: string;
  message_type: 'text' | 'poll' | 'photo' | 'system';
  reply_to?: {
    id: string;
    author_name: string;
    content: string;
  };
  poll_data?: PollData;
  reactions?: MessageReaction[];
  is_pinned?: boolean;
  attachment_url?: string;
  created_at: string;
}

export type GroupPost = GroupMessage;

export interface Group {
  id: string;
  creator_id: string;
  project_id?: string;
  activity_id?: string;
  creator?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  name: string;
  description: string;
  category: string;
  avatar_url?: string;
  banner_url?: string;
  is_private: boolean;
  member_count: number;
  online_count?: number;
  members?: any[];
  messages?: GroupMessage[];
  pinned_message?: GroupMessage;
  last_message?: GroupMessage;
  is_member?: boolean;
  is_admin?: boolean;
  is_creator?: boolean;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'contact_share' | 'invite';
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    city?: string;
    headline?: string;
  };
  last_message?: Message;
  unread_count: number;
  last_message_at?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
