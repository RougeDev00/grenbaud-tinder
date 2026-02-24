export interface Profile {
  id: string;
  twitch_id: string;
  twitch_username: string;
  display_name: string;
  avatar_url: string;
  age?: number;
  city?: string;
  bio: string;
  hobbies: string;
  music: string;
  music_artists: string;
  youtube: string;
  youtube_channels: string;
  twitch_watches: string;
  twitch_streamers: string;
  grenbaud_is: string;
  instagram: string;
  looking_for?: string;
  gender?: string;
  free_time?: string;
  zodiac_sign: string;
  photo_1: string;
  photo_2: string;
  photo_3: string;
  is_registered?: boolean;
  tos_accepted?: boolean;
  personality_type?: string; // e.g. 'INFP-T'
  personality_mind?: number; // Extraverted vs Introverted
  personality_energy?: number; // Intuitive vs Observant
  personality_nature?: number; // Thinking vs Feeling
  personality_tactics?: number; // Judging vs Prospecting
  personality_identity?: number; // Assertive vs Turbulent
  ai_summary?: string;
  question_dream?: string;
  question_weekend?: string;
  question_redflag?: string;
  personality_ai_analysis?: string;
  personality_answers?: Record<number, number>;
  created_at?: string;
  ai_summary_regenerations?: number;
  personality_ai_regenerations?: number;
  is_banned?: boolean;
  ban_reason?: string | null;
  warning_message?: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: 'like' | 'dislike';
  created_at: string;
}

export interface Match {
  id: string;
  user_1: string;
  user_2: string;
  created_at: string;
}

export type AppView = 'landing' | 'registration' | 'explore' | 'aimatch' | 'events' | 'profile' | 'matches' | 'chat';

export interface AuthState {
  isAuthenticated: boolean;
  isSubscriber: boolean;
  isRegistered: boolean;
  currentUser: Profile | null;
  loading: boolean;
}

export type EventCategory = 'Gaming' | 'Chiacchiere' | 'Listening Party' | 'Reaction YouTube' | 'Altro';

export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: EventCategory;
  banner_url: string | null;
  event_time: string;
  max_participants: number;
  created_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface EventWithDetails extends Event {
  creator: Profile;
  participants: (EventParticipant & { profile: Profile })[];
}

export interface EventMessage {
  id: string;
  event_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Pick<Profile, 'id' | 'display_name' | 'twitch_username' | 'photo_1'>;
}

export interface EsploraPost {
  id: string;
  user_id: string;
  content_type: 'text' | 'image' | 'video';
  text_content: string | null;
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  color_theme: string;
  pos_x?: number;
  pos_y?: number;
  is_pinned?: boolean;
  created_at: string;
}

export interface EsploraComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
}

export interface EsploraCommentWithProfile extends EsploraComment {
  profile: Pick<Profile, 'id' | 'display_name' | 'twitch_username' | 'photo_1'>;
  replies?: EsploraCommentWithProfile[];
}

export type EsploraLiker = Pick<Profile, 'id' | 'twitch_username' | 'photo_1'> & {
  pos_x?: number;
  pos_y?: number;
};

export interface EsploraPostWithProfile extends EsploraPost {
  profile: Profile;
  hasLiked?: boolean;
  likers: EsploraLiker[];
}
