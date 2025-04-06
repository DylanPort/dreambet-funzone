
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

export interface CommunityMessage {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  username: string;
  avatar_url: string;
  user_pxb_points?: number;
  user_win_rate?: number;
  user_rank?: number;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface MessageReply {
  id: string;
  message_id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
}

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const { userProfile } = usePXBPoints();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageReplies, setMessageReplies] = useState<{[key: string]: MessageReply[]}>({});
  const [messageReactions, setMessageReactions] = useState<{[key: string]: MessageReaction[]}>({});
  const [topLikedMessages, setTopLikedMessages] = useState<CommunityMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('community_messages')
          .select('*, users(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching community messages:', error);
          setError(error.message);
        }

        if (data) {
          const formattedMessages = data.map(message => ({
            id: message.id,
            created_at: message.created_at,
            content: message.content,
            user_id: message.user_id,
            username: message.username || 'Unknown',
            avatar_url: message.users?.avatar_url || ''
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching community messages:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const messagesSubscription = supabase
      .channel('public:community_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, payload => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as any;
          setMessages(prevMessages => [{
            id: newMessage.id,
            created_at: newMessage.created_at,
            content: newMessage.content,
            user_id: newMessage.user_id,
            username: newMessage.username || 'Unknown',
            avatar_url: ''
          }, ...prevMessages]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [userProfile]);

  const postMessage = async (messageContent: string) => {
    if (!userProfile) return false;
    
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({
          user_id: userProfile.id,
          username: userProfile.username,
          content: messageContent
        })
        .select();
      
      if (error) {
        console.error('Error posting message:', error);
        setError(error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error posting message:', error);
      setError(errorMessage);
      return false;
    }
  };

  const loadRepliesForMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching replies:', error);
        return;
      }
      
      if (data) {
        setMessageReplies(prev => ({
          ...prev,
          [messageId]: data
        }));
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const postReply = async (messageId: string, content: string) => {
    if (!userProfile) return false;
    
    try {
      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          message_id: messageId,
          user_id: userProfile.id,
          username: userProfile.username,
          content
        })
        .select();
        
      if (error) {
        console.error('Error posting reply:', error);
        return false;
      }
      
      // Update local state
      if (data) {
        setMessageReplies(prev => {
          const currentReplies = prev[messageId] || [];
          return {
            ...prev,
            [messageId]: [...currentReplies, data[0]]
          };
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error posting reply:', error);
      return false;
    }
  };

  const reactToMessage = async (messageId: string, reactionType: string) => {
    if (!userProfile) return false;
    
    try {
      // Check if user already reacted with the same type
      const existingReactions = messageReactions[messageId] || [];
      const userReaction = existingReactions.find(r => 
        r.user_id === userProfile.id && r.reaction_type === reactionType
      );
      
      if (userReaction) {
        // Remove the reaction
        const { error } = await supabase
          .from('community_message_reactions')
          .delete()
          .eq('id', userReaction.id);
          
        if (error) {
          console.error('Error removing reaction:', error);
          return false;
        }
        
        // Update local state
        setMessageReactions(prev => {
          const updated = {...prev};
          updated[messageId] = existingReactions.filter(r => r.id !== userReaction.id);
          return updated;
        });
      } else {
        // Add the reaction
        const { data, error } = await supabase
          .from('community_message_reactions')
          .insert({
            message_id: messageId,
            user_id: userProfile.id,
            reaction_type: reactionType
          })
          .select();
          
        if (error) {
          console.error('Error adding reaction:', error);
          return false;
        }
        
        // Update local state
        if (data) {
          setMessageReactions(prev => {
            const currentReactions = prev[messageId] || [];
            return {
              ...prev,
              [messageId]: [...currentReactions, data[0]]
            };
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error reacting to message:', error);
      return false;
    }
  };

  const fetchTopLiked = async () => {
    try {
      // This is a simplified query - in a real app, you might want to count reactions
      const { data, error } = await supabase
        .from('community_messages')
        .select('*, users(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching top liked messages:', error);
        return;
      }
      
      if (data) {
        const formattedMessages = data.map(message => ({
          id: message.id,
          created_at: message.created_at,
          content: message.content,
          user_id: message.user_id,
          username: message.username || 'Unknown',
          avatar_url: message.users?.avatar_url || ''
        }));
        setTopLikedMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching top liked messages:', error);
    }
  };

  return {
    messages,
    loading,
    error,
    postMessage,
    messageReplies,
    messageReactions,
    loadRepliesForMessage,
    postReply,
    reactToMessage,
    topLikedMessages,
    fetchTopLiked
  };
};
