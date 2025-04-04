
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the types for the community message
export interface CommunityMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string | null;
  likes_count?: number;
  dislikes_count?: number;
  user_pxb_points?: number; // Added user points
  user_win_rate?: number;   // Added user win rate
  user_rank?: number;       // Added user rank
}

// Define the type for the community reply
export interface CommunityReply {
  id: string;
  content: string;
  created_at: string;
  message_id: string;
  user_id: string;
  username: string | null;
}

// Define the type for the reaction object
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

// Get community messages
export const getCommunityMessages = async (): Promise<CommunityMessage[]> => {
  try {
    // Get messages with direct query since there's an issue with the join
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching community messages:', error);
      throw error;
    }

    // Format the messages without user data (will be added in useCommunityMessages hook)
    const messages = data.map(item => {
      return {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        user_id: item.user_id,
        username: item.username || null,
        user_pxb_points: 0, // Will be populated in the hook
        user_win_rate: 0,   // Will be populated in the hook
        user_rank: 0        // Will be populated in the hook
      };
    });

    return messages;
  } catch (error) {
    console.error('Error in getCommunityMessages:', error);
    return [];
  }
};

// Post a new community message
export const postCommunityMessage = async (content: string, userId: string, username?: string): Promise<CommunityMessage | null> => {
  try {
    // Get the user's username from the users table if available
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
    
    // Insert the new message
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
    // Get the user's username from the users table if available
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
    
    // Insert the new reply
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
    // Check if the user has already reacted to this message
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

    // If the user already reacted with the same type, remove the reaction
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

    // If the user already reacted with a different type, update the reaction
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

    // Otherwise, insert a new reaction
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

    // Make sure we only return 'like' or 'dislike' or null to satisfy TypeScript
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
    // Get message reactions
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('community_message_reactions')
      .select('*')
      .eq('reaction_type', 'like');
    
    if (reactionsError) {
      console.error('Error fetching reactions for top liked:', reactionsError);
      throw reactionsError;
    }
    
    // Count likes per message
    const likesCount: Record<string, number> = {};
    reactionsData.forEach(reaction => {
      likesCount[reaction.message_id] = (likesCount[reaction.message_id] || 0) + 1;
    });
    
    // Get top message IDs
    const topMessageIds = Object.entries(likesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    if (topMessageIds.length === 0) {
      return [];
    }
    
    // Get the actual messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('community_messages')
      .select('*')
      .in('id', topMessageIds);
    
    if (messagesError) {
      console.error('Error fetching top messages:', messagesError);
      throw messagesError;
    }
    
    // Add the likes count to each message
    const topMessages = messagesData.map(message => ({
      ...message,
      likes_count: likesCount[message.id] || 0
    }));
    
    // Sort by likes count
    topMessages.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    
    return topMessages;
  } catch (error) {
    console.error('Error in getTopLikedMessages:', error);
    return [];
  }
};
