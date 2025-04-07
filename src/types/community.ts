
export interface CommunityMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  likes_count?: number;
  dislikes_count?: number;
  user_pxb_points?: number;
  user_win_rate?: number;
  user_rank?: number;
  avatar_url?: string;
}

export interface CommunityReply {
  id: string;
  message_id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
}

export interface MessageReaction {
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
}

export interface MessageReactionCounts {
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike';
}
