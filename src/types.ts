export type Language = 'en' | 'es' | 'fr' | 'system';
export type Theme = 'light' | 'dark' | 'auto';

export type AccountStatus = 'active' | 'suspended' | 'disabled' | 'limited' | 'permanently_disabled' | 'deactivated';
export type AppealStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type SubscriptionPlan = 'none' | 'essential' | 'premium' | 'diamond';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  bio: string;
  dob?: string;
  avatar_url?: string;
  IsDeleted: boolean;
  account_status: AccountStatus;
  limited_until?: number;
  suspension_reason?: string;
  appeal_status: AppealStatus;
  IsIdentityVerify: boolean;
  is_private: boolean;
  phone_number?: string;
  wallet_balance?: number;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  strikes_count?: number;
  warnings_count?: number;
  created_at: string;
  needsProfileSetup?: boolean;
  is_2fa_enabled?: boolean;
  is_upgraded?: boolean;
  subscription_plan?: SubscriptionPlan;
  interests?: string[];
}

export interface Post {
  id: string; // 12-digit string
  user_id: string;
  author_username: string;
  author_email?: string;
  author_avatar?: string;
  author_is_verified?: boolean;
  caption: string;
  type: 'text' | 'image' | 'video';
  media_url?: string;
  tags?: string[];
  hashtags?: string[];
  category?: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_archived?: boolean;
  is_official?: boolean;
  created_at?: string; // empty string or omitted for official Garexcell posts if desired
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_username: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Chat {
  id: string;
  participant_id: string;
  participant_username: string;
  participant_avatar?: string;
  last_message: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  sender_id: string;
  sender_username: string;
  type: 'follow' | 'message' | 'like' | 'system';
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  full_name: string;
  dob: string;
  email: string;
  phone_number: string;
  doc_type: string;
  doc_number: string;
  doc_expiry: string;
  extracted_data: Record<string, string>;
  selfie_code: string;
  status: 'pending' | 'verified' | 'failed';
  timestamp: string;
}

export interface RecentAccount {
  user_id: string;
  email: string;
  username: string;
  avatar_url?: string;
  last_login: string;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  players: string;
  description: string;
  rating: number;
  category?: string;
  thumbnail_url?: string;
  banner_url?: string;
  developer?: string;
}
