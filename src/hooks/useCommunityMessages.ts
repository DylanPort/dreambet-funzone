
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/integrations/auth-helpers';
import { toast } from 'sonner';

export interface CommunityMessage {
  id: string;
  content: string;
  username: string | null;
  user_id: string;
  created_at: string;
  reactions: MessageReaction[];
  replies: MessageReply[];
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
  username: string | null;
  user_id: string;
  created_at: string;
}

export const useCommunityMessages = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (messagesError) {
        throw messagesError;
      }
      
      // Fetch reactions for all messages
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('community_message_reactions')
        .select('*');
      
      if (reactionsError) {
        throw reactionsError;
      }
      
      // Fetch replies for all messages
      const { data: repliesData, error: repliesError } = await supabase
        .from('community_replies')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (repliesError) {
        throw repliesError;
      }
      
      // Map reactions and replies to their respective messages
      const messagesWithData = messagesData.map(message => {
        const messageReactions = reactionsData.filter(
          reaction => reaction.message_id === message.id
        );
        
        const messageReplies = repliesData.filter(
          reply => reply.message_id === message.id
        );
        
        return {
          ...message,
          reactions: messageReactions,
          replies: messageReplies
        };
      });
      
      setMessages(messagesWithData);
    } catch (err: any) {
      console.error('Error fetching community messages:', err);
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, payload => {
        console.log('New message received:', payload);
        const newMessage = payload.new as any;
        
        // Add the new message with empty reactions and replies arrays
        setMessages(prevMessages => [
          {
            ...newMessage,
            reactions: [],
            replies: []
          },
          ...prevMessages
        ]);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_message_reactions'
      }, payload => {
        console.log('New reaction received:', payload);
        const newReaction = payload.new as MessageReaction;
        
        // Update the messages with the new reaction
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === newReaction.message_id
              ? { ...message, reactions: [...message.reactions, newReaction] }
              : message
          )
        );
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_replies'
      }, payload => {
        console.log('New reply received:', payload);
        const newReply = payload.new as MessageReply;
        
        // Update the messages with the new reply
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === newReply.message_id
              ? { ...message, replies: [...message.replies, newReply] }
              : message
          )
        );
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
      
      toast.success('Reply posted successfully');
      return true;
    } catch (err: any) {
      console.error('Error posting reply:', err);
      toast.error(err.message || 'Failed to post reply');
      return false;
    }
  }, [user]);
  
  const reactToMessage = useCallback(async (messageId: string, reactionType: string) => {
    if (!user) {
      toast.error('You need to be logged in to react');
      return false;
    }
    
    try {
      // Check if user has already reacted with this reaction
      const existingReaction = messages
        .find(m => m.id === messageId)
        ?.reactions.find(r => r.user_id === user.id && r.reaction_type === reactionType);
      
      if (existingReaction) {
        // Remove the reaction if it already exists
        const { error } = await supabase
          .from('community_message_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        if (error) {
          throw error;
        }
        
        // Update local state
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === messageId
              ? { 
                  ...message, 
                  reactions: message.reactions.filter(r => r.id !== existingReaction.id)
                }
              : message
          )
        );
        
        return true;
      }
      
      // Add the new reaction
      const { data, error } = await supabase
        .from('community_message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (err: any) {
      console.error('Error reacting to message:', err);
      toast.error(err.message || 'Failed to react to message');
      return false;
    }
  }, [messages, user]);
  
  return {
    messages,
    isLoading,
    error,
    postMessage,
    postReply,
    reactToMessage,
    refreshMessages: fetchMessages
  };
};
