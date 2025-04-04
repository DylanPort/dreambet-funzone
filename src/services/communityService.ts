import { supabase } from "@/integrations/supabase/client";

export interface CommunityMessage {
  id: string;
  content: string;
  user_id: string;
  username?: string | null;
  created_at: string;
  user_pxb_points?: number;
  user_win_rate?: number;
  user_rank?: number;
}

export interface CommunityReply {
  id: string;
  message_id: string;
  content: string;
  user_id: string;
  username?: string | null;
  created_at: string;
}

// Get all community messages
export const getCommunityMessages = async (): Promise<CommunityMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        id,
        content,
        user_id,
        username,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching community messages:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error in getCommunityMessages:", error);
    throw error;
  }
};

// Post a new community message
export const postCommunityMessage = async (content: string, userId: string, username?: string): Promise<CommunityMessage | null> => {
  try {
    let actualUsername = username;
    
    if (!actualUsername) {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('wallet_address', userId)
        .single();
        
      if (userData && userData.username) {
        actualUsername = userData.username;
      }
    }
    
    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        content,
        user_id: userId,
        username: actualUsername
      })
      .select()
      .single();

    if (error) {
      console.error('Error posting community message:', error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      user_id: data.user_id,
      username: data.username
    };
  } catch (error) {
    console.error('Error in postCommunityMessage:', error);
    toast.error('Failed to post message. Please try again.');
    return null;
  }
};

// Get replies for a message
export const getRepliesForMessage = async (messageId: string): Promise<CommunityReply[]> => {
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
    console.error('Error in getRepliesForMessage:', error);
    return [];
  }
};

// Post a reply to a message
export const postReply = async (messageId: string, content: string, userId: string, username?: string): Promise<CommunityReply | null> => {
  try {
    let actualUsername = username;
    
    if (!actualUsername) {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('wallet_address', userId)
        .single();
        
      if (userData && userData.username) {
        actualUsername = userData.username;
      }
    }
    
    const { data, error } = await supabase
      .from('community_replies')
      .insert({
        message_id: messageId,
        content,
        user_id: userId,
        username: actualUsername
      })
      .select()
      .single();

    if (error) {
      console.error('Error posting reply:', error);
      throw error;
    }

    return data as CommunityReply;
  } catch (error) {
    console.error('Error in postReply:', error);
    toast.error('Failed to post reply. Please try again.');
    return null;
  }
};

// React to a message (like or dislike)
export const reactToMessage = async (messageId: string, userId: string, reactionType: 'like' | 'dislike'): Promise<boolean> => {
  try {
    const { data: existingReaction, error: checkError } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing reaction:', checkError);
      throw checkError;
    }

    if (existingReaction && existingReaction.reaction_type === reactionType) {
      const { error: deleteError } = await supabase
        .from('community_message_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('Error removing reaction:', deleteError);
        throw deleteError;
      }

      return true;
    }

    if (existingReaction) {
      const { error: updateError } = await supabase
        .from('community_message_reactions')
        .update({ reaction_type: reactionType })
        .eq('id', existingReaction.id);

      if (updateError) {
        console.error('Error updating reaction:', updateError);
        throw updateError;
      }

      return true;
    }

    const { error: insertError } = await supabase
      .from('community_message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction_type: reactionType
      });

    if (insertError) {
      console.error('Error inserting reaction:', insertError);
      throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error in reactToMessage:', error);
    toast.error('Failed to save your reaction. Please try again.');
    return false;
  }
};

// Get message reactions
export const getMessageReactions = async (messageId: string): Promise<{ likes: number; dislikes: number; userReaction?: 'like' | 'dislike' }> => {
  try {
    const { data, error } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) {
      console.error('Error fetching message reactions:', error);
      throw error;
    }

    const likes = data.filter(reaction => reaction.reaction_type === 'like').length;
    const dislikes = data.filter(reaction => reaction.reaction_type === 'dislike').length;

    return { likes, dislikes };
  } catch (error) {
    console.error('Error in getMessageReactions:', error);
    return { likes: 0, dislikes: 0 };
  }
};

// Get user reaction to a message
export const getUserReaction = async (messageId: string, userId: string): Promise<'like' | 'dislike' | null> => {
  try {
    const { data, error } = await supabase
      .from('community_message_reactions')
      .select('reaction_type')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user reaction:', error);
      throw error;
    }

    if (data && (data.reaction_type === 'like' || data.reaction_type === 'dislike')) {
      return data.reaction_type;
    }
    
    return null;
  } catch (error) {
    console.error('Error in getUserReaction:', error);
    return null;
  }
};

// Get top liked messages
export const getTopLikedMessages = async (limit: number = 5): Promise<CommunityMessage[]> => {
  try {
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('reaction_type', 'like');
    
    if (reactionsError) {
      console.error('Error fetching reactions for top liked:', reactionsError);
      throw reactionsError;
    }
    
    const likesCount: Record<string, number> = {};
    reactionsData.forEach(reaction => {
      likesCount[reaction.message_id] = (likesCount[reaction.message_id] || 0) + 1;
    });
    
    const topMessageIds = Object.entries(likesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    if (topMessageIds.length === 0) {
      return [];
    }
    
    const { data: messagesData, error: messagesError } = await supabase
      .from('community_messages')
      .select('*')
      .in('id', topMessageIds);
    
    if (messagesError) {
      console.error('Error fetching top messages:', messagesError);
      throw messagesError;
    }
    
    const topMessages = messagesData.map(message => ({
      ...message,
      likes_count: likesCount[message.id] || 0
    }));
    
    topMessages.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    
    return topMessages;
  } catch (error) {
    console.error('Error in getTopLikedMessages:', error);
    return [];
  }
};
