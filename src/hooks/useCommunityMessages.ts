
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/integrations/auth-helpers';
import { toast } from 'sonner';
import { CommunityMessage, CommunityReply, MessageReactionCounts } from '@/types/community';

const useCommunityMessages = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, CommunityReply[]>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReactionCounts>>({});
  const [topLikedMessages, setTopLikedMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch messages with user info
      const { data: messagesData, error: messagesError } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (messagesError) {
        throw messagesError;
      }
      
      // Fetch all user profiles to get points and stats
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, points, wallet_address');
      
      if (usersError) {
        console.error('Error fetching user data:', usersError);
      }
      
      // Create a map of user data for easy lookup
      const userDataMap: Record<string, any> = {};
      if (usersData) {
        usersData.forEach(user => {
          userDataMap[user.id || user.wallet_address] = user;
        });
      }
      
      // Fetch reactions for all messages
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('community_message_reactions')
        .select('*');
      
      if (reactionsError) {
        console.error('Error fetching reactions:', reactionsError);
      }
      
      // Calculate reaction counts for each message
      const reactionCounts: Record<string, MessageReactionCounts> = {};
      if (reactionsData) {
        reactionsData.forEach(reaction => {
          if (!reactionCounts[reaction.message_id]) {
            reactionCounts[reaction.message_id] = { likes: 0, dislikes: 0 };
          }
          
          if (reaction.reaction_type === 'like') {
            reactionCounts[reaction.message_id].likes += 1;
          } else if (reaction.reaction_type === 'dislike') {
            reactionCounts[reaction.message_id].dislikes += 1;
          }
          
          // Add user's reaction if present
          if (user && reaction.user_id === user.id) {
            reactionCounts[reaction.message_id].userReaction = reaction.reaction_type as 'like' | 'dislike';
          }
        });
      }
      
      setMessageReactions(reactionCounts);
      
      // Add user data to messages
      const enhancedMessages = messagesData.map(message => {
        const userData = userDataMap[message.user_id] || {};
        const messageReactionData = reactionCounts[message.id] || { likes: 0, dislikes: 0 };
        
        return {
          ...message,
          user_pxb_points: userData.points || 0,
          user_win_rate: 50, // Default win rate since we don't have actual data
          user_rank: 0, // Default rank
          likes_count: messageReactionData.likes,
          dislikes_count: messageReactionData.dislikes
        };
      });
      
      setMessages(enhancedMessages);
      
      // Get top liked messages
      const sortedByLikes = [...enhancedMessages].sort((a, b) => {
        return (b.likes_count || 0) - (a.likes_count || 0);
      });
      
      setTopLikedMessages(sortedByLikes.slice(0, 5));
      
    } catch (err: any) {
      console.error('Error fetching community messages:', err);
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  const fetchRepliesForMessage = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: data as CommunityReply[]
      }));
      
      return data;
    } catch (err: any) {
      console.error('Error fetching replies:', err);
      return [];
    }
  }, []);
  
  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, 
        payload => {
          console.log('New message received:', payload);
          const newMessage = payload.new as any;
          
          // Add the new message to the state
          setMessages(prevMessages => [
            {
              ...newMessage,
              user_pxb_points: 0,
              user_win_rate: 50,
              user_rank: 0,
              likes_count: 0,
              dislikes_count: 0
            },
            ...prevMessages
          ]);
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);
  
  const postMessage = useCallback(async (content: string) => {
    if (!user) {
      toast.error('You need to be logged in to post a message');
      return false;
    }
    
    if (!content.trim()) {
      toast.error('Message cannot be empty');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({
          content: content.trim(),
          user_id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Message posted successfully');
      return true;
    } catch (err: any) {
      console.error('Error posting message:', err);
      toast.error(err.message || 'Failed to post message');
      return false;
    }
  }, [user]);
  
  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!user) {
      toast.error('You need to be logged in to reply');
      return false;
    }
    
    if (!content.trim()) {
      toast.error('Reply cannot be empty');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          message_id: messageId,
          content: content.trim(),
          user_id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update the local state
      const newReply = data as CommunityReply;
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), newReply]
      }));
      
      toast.success('Reply posted successfully');
      return true;
    } catch (err: any) {
      console.error('Error posting reply:', err);
      toast.error(err.message || 'Failed to post reply');
      return false;
    }
  }, [user]);
  
  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!user) {
      toast.error('You need to be logged in to react');
      return false;
    }
    
    try {
      // Check if user has already reacted with this type
      const currentReaction = messageReactions[messageId]?.userReaction;
      
      if (currentReaction === reactionType) {
        // Remove the reaction if it already exists
        const { error } = await supabase
          .from('community_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update local state
        setMessageReactions(prev => {
          const updated = { ...prev };
          const msgReaction = updated[messageId];
          
          if (msgReaction) {
            if (reactionType === 'like') msgReaction.likes = Math.max(0, msgReaction.likes - 1);
            if (reactionType === 'dislike') msgReaction.dislikes = Math.max(0, msgReaction.dislikes - 1);
            msgReaction.userReaction = undefined;
          }
          
          return updated;
        });
      } else {
        // If changing reaction type, remove the old one first
        if (currentReaction) {
          await supabase
            .from('community_message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', user.id);
            
          // Update counts in state for the removed reaction
          setMessageReactions(prev => {
            const updated = { ...prev };
            const msgReaction = updated[messageId];
            
            if (msgReaction && currentReaction) {
              if (currentReaction === 'like') msgReaction.likes = Math.max(0, msgReaction.likes - 1);
              if (currentReaction === 'dislike') msgReaction.dislikes = Math.max(0, msgReaction.dislikes - 1);
            }
            
            return updated;
          });
        }
        
        // Add the new reaction
        const { error } = await supabase
          .from('community_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: reactionType
          });
        
        if (error) throw error;
        
        // Update local state
        setMessageReactions(prev => {
          const updated = { ...prev };
          
          if (!updated[messageId]) {
            updated[messageId] = { likes: 0, dislikes: 0 };
          }
          
          if (reactionType === 'like') updated[messageId].likes++;
          if (reactionType === 'dislike') updated[messageId].dislikes++;
          updated[messageId].userReaction = reactionType;
          
          return updated;
        });
      }
      
      // Update the messages state to reflect like counts
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id === messageId) {
            const reactionData = messageReactions[messageId] || { likes: 0, dislikes: 0 };
            return {
              ...msg,
              likes_count: reactionData.likes,
              dislikes_count: reactionData.dislikes
            };
          }
          return msg;
        })
      );
      
      // Also update top liked messages
      setTopLikedMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.id === messageId) {
            const reactionData = messageReactions[messageId] || { likes: 0, dislikes: 0 };
            return {
              ...msg,
              likes_count: reactionData.likes,
              dislikes_count: reactionData.dislikes
            };
          }
          return msg;
        });
        
        // Re-sort by likes
        return updated.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      });
      
      return true;
    } catch (err: any) {
      console.error('Error reacting to message:', err);
      toast.error(err.message || 'Failed to react to message');
      return false;
    }
  }, [messageReactions, user]);
  
  const fetchTopLiked = useCallback(async () => {
    // This is already handled in fetchMessages
    // but we'll provide the function for the component interface
    return topLikedMessages;
  }, [topLikedMessages]);
  
  const loadRepliesForMessage = useCallback(async (messageId: string) => {
    return await fetchRepliesForMessage(messageId);
  }, [fetchRepliesForMessage]);
  
  return {
    messages,
    messageReplies,
    messageReactions,
    topLikedMessages,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    postMessage,
    postReply,
    reactToMessage,
    refreshMessages: fetchMessages,
    loadRepliesForMessage,
    fetchTopLiked
  };
};

export default useCommunityMessages;
