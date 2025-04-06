import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

interface CommunityMessage {
  id: string;
  created_at: string;
  message: string;
  user_id: string;
  username: string;
  avatar_url: string;
}

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const { userProfile } = usePXBPoints();
  const [loading, setLoading] = useState(true);

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
        }

        if (data) {
          const formattedMessages = data.map(message => ({
            id: message.id,
            created_at: message.created_at,
            message: message.message,
            user_id: message.user_id,
            username: (message.users as any)?.username || 'Unknown',
            avatar_url: (message.users as any)?.avatar_url || ''
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching community messages:', error);
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
            message: newMessage.message,
            user_id: newMessage.user_id,
            username: (newMessage.users as any)?.username || 'Unknown',
            avatar_url: (newMessage.users as any)?.avatar_url || ''
          }, ...prevMessages]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [userProfile]);

  return {
    messages,
    loading
  };
};
