
import { supabase } from "@/integrations/supabase/client";

export interface CommunityMessage {
  id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
  reply_count?: number;
  likes_count?: number;
  dislikes_count?: number;
  user_reaction?: 'like' | 'dislike' | null;
}

export interface CommunityReply {
  id: string;
  message_id: string;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export const fetchCommunityMessages = async (): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
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

export const fetchRepliesForMessage = async (messageId: string): Promise<CommunityReply[]> => {
  try {
    const { data, error } = await supabase
      .from('community_replies')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
    
    return data as CommunityReply[];
  } catch (error) {
    console.error('Error in fetchRepliesForMessage:', error);
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
    
    return data as CommunityReply;
  } catch (error) {
    console.error('Error in postReplyToMessage:', error);
    throw error;
  }
};

export const fetchMessageReactions = async (messageId: string): Promise<MessageReaction[]> => {
  try {
    const { data, error } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('message_id', messageId);
    
    if (error) {
      console.error('Error fetching message reactions:', error);
      throw error;
    }
    
    return data as MessageReaction[];
  } catch (error) {
    console.error('Error in fetchMessageReactions:', error);
    throw error;
  }
};

export const addReactionToMessage = async (
  messageId: string,
  userId: string,
  reactionType: 'like' | 'dislike'
): Promise<MessageReaction> => {
  try {
    // First, check if user already has a reaction to this message
    const { data: existingReaction } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // User is toggling off the same reaction - delete it
        const { error: deleteError } = await supabase
          .from('community_message_reactions')
          .delete()
          .eq('id', existingReaction.id);
          
        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          throw deleteError;
        }
        
        return null as unknown as MessageReaction;
      } else {
        // User is changing reaction type - update it
        const { data, error } = await supabase
          .from('community_message_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating reaction:', error);
          throw error;
        }
        
        return data as MessageReaction;
      }
    } else {
      // User is adding a new reaction
      const { data, error } = await supabase
        .from('community_message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error adding reaction:', error);
        throw error;
      }
      
      return data as MessageReaction;
    }
  } catch (error) {
    console.error('Error in addReactionToMessage:', error);
    throw error;
  }
};
