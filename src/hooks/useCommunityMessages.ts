
import { useState, useEffect } from 'react';
import { useUser } from '@/integrations/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { CommunityMessage, CommunityReply, MessageReactionCounts } from '@/types/community';

const useCommunityMessages = () => {
  const user = useUser();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, CommunityReply[]>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReactionCounts>>({});
  const [topLikedMessages, setTopLikedMessages] = useState<CommunityMessage[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .select(`
            id, 
            created_at, 
            content, 
            user_id, 
            likes_count,
            users(username)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching messages:", error);
          setError("Failed to load messages.");
        } else {
          // Properly type the messages with the username
          const typedMessages: CommunityMessage[] = data.map(msg => ({
            id: msg.id,
            created_at: msg.created_at,
            content: msg.content,
            user_id: msg.user_id,
            likes_count: msg.likes_count || 0,
            username: msg.users?.username || 'Unknown User',
          }));
          setMessages(typedMessages);
        }
      } catch (err) {
        console.error("Unexpected error fetching messages:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Setup Realtime subscription
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as CommunityMessage;
            setMessages(prevMessages => [newMessage, ...prevMessages]);
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Add the fetchTopLiked function
  const fetchTopLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .order('likes_count', { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching top liked messages:", error);
      } else {
        setTopLikedMessages(data as CommunityMessage[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching top liked messages:", err);
    }
  };

  // Add loadRepliesForMessage function
  const loadRepliesForMessage = async (messageId: string) => {
    try {
      // Need to directly query the database for replies
      const { data, error } = await supabase
        .from('message_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading replies:", error);
        return [];
      }

      const typedReplies = data as CommunityReply[];
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: typedReplies
      }));

      return typedReplies;
    } catch (err) {
      console.error("Error loading replies:", err);
      return [];
    }
  };

  // Add reactToMessage function
  const reactToMessage = async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!user) return;
    
    try {
      // Mock implementation for now
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: {
          likes: (prev[messageId]?.likes || 0) + (reactionType === 'like' ? 1 : 0),
          dislikes: (prev[messageId]?.dislikes || 0) + (reactionType === 'dislike' ? 1 : 0),
          userReaction: reactionType
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Error reacting to message:", error);
      return false;
    }
  };

  // Add postReply function
  const postReply = async (messageId: string, content: string) => {
    if (!user) return null;
    
    try {
      // Mock implementation for now
      const newReply: CommunityReply = {
        id: `reply-${Date.now()}`,
        message_id: messageId,
        content,
        created_at: new Date().toISOString(),
        user_id: user.id,
        username: 'Current User'
      };
      
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), newReply]
      }));
      
      return newReply;
    } catch (error) {
      console.error("Error posting reply:", error);
      return null;
    }
  };

  const postMessage = async (content: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setPosting(true);
      const { error } = await supabase
        .from('community_messages')
        .insert([{ content, user_id: user.id }]);

      if (error) {
        console.error("Error posting message:", error);
        setError("Failed to post message.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error posting message:", error);
      setError("Failed to post message.");
      return false;
    } finally {
      setPosting(false);
    }
  };

  return { 
    messages, 
    postMessage, 
    posting, 
    error, 
    loading,
    messageReplies,
    messageReactions,
    topLikedMessages,
    loadRepliesForMessage,
    postReply,
    reactToMessage,
    fetchTopLiked
  };
};

export default useCommunityMessages;
