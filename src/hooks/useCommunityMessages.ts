
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
        // Since we don't have a likes_count column or a users relation, update the query
        const { data, error } = await supabase
          .from('community_messages')
          .select(`
            id, 
            created_at, 
            content, 
            user_id,
            username
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching messages:", error);
          setError("Failed to load messages.");
        } else {
          // Map and type the messages with the available data
          const typedMessages: CommunityMessage[] = data.map(msg => ({
            id: msg.id,
            created_at: msg.created_at,
            content: msg.content,
            user_id: msg.user_id,
            username: msg.username || 'Unknown User',
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

  // Add the fetchTopLiked function - mocked since we don't have likes_count
  const fetchTopLiked = async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false })
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

  // Add loadRepliesForMessage function - mocked as we don't have community_replies table
  const loadRepliesForMessage = async (messageId: string) => {
    try {
      // Now that we have the community_replies table, fetch real replies
      const { data, error } = await supabase
        .from('community_replies')
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
      // Now using the real community_message_reactions table
      // First check if user already reacted
      const { data: existingReaction } = await supabase
        .from('community_message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingReaction) {
        // Update existing reaction if different
        if (existingReaction.reaction_type !== reactionType) {
          await supabase
            .from('community_message_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
        }
      } else {
        // Insert new reaction
        await supabase
          .from('community_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }
      
      // Get updated reaction counts
      const { data: likesData } = await supabase
        .from('community_message_reactions')
        .select('reaction_type')
        .eq('message_id', messageId);
      
      if (likesData) {
        const likes = likesData.filter(r => r.reaction_type === 'like').length;
        const dislikes = likesData.filter(r => r.reaction_type === 'dislike').length;
        
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: {
            likes,
            dislikes,
            userReaction: reactionType
          }
        }));
      }
      
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
      // Now using the real community_replies table
      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          message_id: messageId,
          content,
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Current User'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error posting reply:", error);
        return null;
      }
      
      const newReply = data as CommunityReply;
      
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
        .insert([{ 
          content, 
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous'
        }]);

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
