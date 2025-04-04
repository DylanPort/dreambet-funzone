
import { supabase } from "@/integrations/supabase/client";

export interface CommunityMessage {
  id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
  replies?: CommunityReply[];
  likes_count?: number;
}

export interface CommunityReply {
  id: string;
  message_id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
}

export const fetchCommunityMessages = async (): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        replies:community_replies(*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching community messages:', error);
      throw error;
    }
    
    return data as unknown as CommunityMessage[];
  } catch (error) {
    console.error('Error in fetchCommunityMessages:', error);
    throw error;
  }
};

export const postCommunityMessage = async (
  content: string,
  userId: string,
  username?: string
): Promise<CommunityMessage> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        user_id: userId,
        username: username || null,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error posting community message:', error);
      throw error;
    }
    
    return data as unknown as CommunityMessage;
  } catch (error) {
    console.error('Error in postCommunityMessage:', error);
    throw error;
  }
};

export const postReplyToMessage = async (
  messageId: string,
  content: string,
  userId: string,
  username?: string
): Promise<CommunityReply> => {
  try {
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        message_id: messageId,
        user_id: userId,
        username: username || null,
        content
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error posting reply:', error);
      throw error;
    }
    
    return data as unknown as CommunityReply;
  } catch (error) {
    console.error('Error in postReplyToMessage:', error);
    throw error;
  }
};

export const reactToMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    // First check if user already liked this message
    const { data: existingLike, error: checkError } = await supabase
      .from('community_likes')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking if message is already liked:', checkError);
      throw checkError;
    }
    
    if (existingLike) {
      // User already liked, so unlike
      const { error: unlikeError } = await supabase
        .from('community_likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (unlikeError) {
        console.error('Error unliking message:', unlikeError);
        throw unlikeError;
      }
    } else {
      // User hasn't liked, so add like
      const { error: likeError } = await supabase
        .from('community_likes')
        .insert({
          message_id: messageId,
          user_id: userId
        });
      
      if (likeError) {
        console.error('Error liking message:', likeError);
        throw likeError;
      }
    }
  } catch (error) {
    console.error('Error in reactToMessage:', error);
    throw error;
  }
};

export const getMessageLikes = async (messageId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('community_likes')
      .select('id', { count: 'exact', head: true })
      .eq('message_id', messageId);
    
    if (error) {
      console.error('Error getting message likes:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getMessageLikes:', error);
    return 0;
  }
};

export const hasUserLikedMessage = async (messageId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('community_likes')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if user liked message:', error);
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in hasUserLikedMessage:', error);
    return false;
  }
};
