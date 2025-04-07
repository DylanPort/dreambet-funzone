import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityMessage } from '@/types/community';

const useCommunityMessages = () => {
  const user = useUser();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .select('id, created_at, content, user_id, users(username)')
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const postMessage = async (content: string): Promise<void> => {
    if (!user) return;
    
    try {
      setPosting(true);
      const { error } = await supabase
        .from('community_messages')
        .insert([{ content, user_id: user.id }]);

      if (error) {
        console.error("Error posting message:", error);
        setError("Failed to post message.");
        throw error;
      }
    } catch (error) {
      console.error("Error posting message:", error);
      setError("Failed to post message.");
      throw error;
    } finally {
      setPosting(false);
    }
  };

  return { messages, postMessage, posting, error, loading };
};

export default useCommunityMessages;
