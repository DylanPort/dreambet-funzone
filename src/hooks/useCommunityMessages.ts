
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
        // Modified query to not select fields that don't exist in the table
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
          // Properly type the messages and set default values for missing fields
          const typedMessages: CommunityMessage[] = data.map(msg => ({
            id: msg.id,
            created_at: msg.created_at,
            content: msg.content,
            user_id: msg.user_id,
            likes_count: 0, // Default value since column doesn't exist yet
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

  // Add the fetchTopLiked function
  const fetchTopLiked = async () => {
    try {
      // For now, just get the most recent messages since we don't have likes_count
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

  // Update loadRepliesForMessage function to use community_replies table
  const loadRepliesForMessage = async (messageId: string) => {
    try {
      // Changed from message_replies to community_replies
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
      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('community_message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReaction) {
        // Update existing reaction
        if (existingReaction.reaction_type === reactionType) {
          // If same reaction type, remove it (toggle off)
          await supabase
            .from('community_message_reactions')
            .delete()
            .eq('id', existingReaction.id);
        } else {
          // Change reaction type
          await supabase
            .from('community_message_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);
        }
      } else {
        // Create new reaction
        await supabase
          .from('community_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }

      // Get updated counts
      const { data: reactions } = await supabase
        .from('community_message_reactions')
        .select('*')
        .eq('message_id', messageId);

      const likes = reactions?.filter(r => r.reaction_type === 'like').length || 0;
      const dislikes = reactions?.filter(r => r.reaction_type === 'dislike').length || 0;
      const userReaction = reactions?.find(r => r.user_id === user.id)?.reaction_type as 'like' | 'dislike' | undefined;

      setMessageReactions(prev => ({
        ...prev,
        [messageId]: {
          likes,
          dislikes,
          userReaction
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
      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          message_id: messageId,
          content,
          user_id: user.id,
          username: user.username || 'User ' + user.id.substring(0, 6)
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
          username: user.username || 'User ' + user.id.substring(0, 6)
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
