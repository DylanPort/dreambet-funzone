
export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  display_name: string | null;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  display_name: string | null;
  isLiked?: boolean;
}

export interface UserProfile {
  id: string;
  username: string | null;
  wallet_address: string;
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  points?: number;
}

export interface Conversation {
  conversation_user_id: string;
  conversation_username: string | null;
  conversation_display_name: string | null;
  conversation_avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  recipient_username: string;
}
