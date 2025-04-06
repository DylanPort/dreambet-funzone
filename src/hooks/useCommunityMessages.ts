
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

export interface CommunityMessage {
  id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
  user_avatar?: string;
  user_pxb_points?: number;
  user_win_rate?: number;
  user_rank?: number;
  avatar_url?: string; // Added this property
}

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = usePXBPoints();

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await supabase
        .from('community_messages')
        .select(`
          id,
          content,
          user_id,
          username,
          created_at,
          users:user_id (
            avatar_url,
            points
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error fetching community messages:', error);
        return;
      }
      
      if (messagesData) {
        // Map to proper format, handling missing users safely
        const formattedMessages: CommunityMessage[] = messagesData.map(msg => {
          // Handle users being null or having a SelectQueryError
          const userAvatar = typeof msg.users === 'object' && msg.users !== null 
            ? (msg.users as any)?.avatar_url 
            : undefined;
            
          const userPxbPoints = typeof msg.users === 'object' && msg.users !== null
            ? (msg.users as any)?.points
            : 0;
            
          return {
            id: msg.id,
            content: msg.content,
            user_id: msg.user_id,
            username: msg.username || 'Anonymous',
            created_at: msg.created_at,
            user_avatar: userAvatar,
            avatar_url: userAvatar, // Added avatar_url for consistency
            user_pxb_points: userPxbPoints,
            // Add mock data for win rate and rank for UI
            user_win_rate: Math.floor(Math.random() * 100),
            user_rank: Math.floor(Math.random() * 100) + 1
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add postMessage function
  const postMessage = async (content: string): Promise<boolean> => {
    if (!userProfile || !content.trim()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content: content.trim(),
          user_id: userProfile.id,
          username: userProfile.username
        });

      if (error) {
        console.error('Error posting message:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in postMessage:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time listener for new messages
    const channel = supabase
      .channel('community_messages_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages' 
        }, 
        (payload) => {
          const newMessage = payload.new as any;
          
          // Add the new message to state
          setMessages(prevMessages => {
            // Create a CommunityMessage object from payload
            const messageToAdd: CommunityMessage = {
              id: newMessage.id,
              content: newMessage.content,
              user_id: newMessage.user_id,
              username: newMessage.username || 'Anonymous',
              created_at: newMessage.created_at,
              // Add mock data
              user_pxb_points: Math.floor(Math.random() * 10000),
              user_win_rate: Math.floor(Math.random() * 100),
              user_rank: Math.floor(Math.random() * 100) + 1
            };
            
            // Fetch user details for the new message
            supabase
              .from('users')
              .select('avatar_url, points')
              .eq('id', newMessage.user_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  // Update this specific message with user details
                  setMessages(currentMessages => 
                    currentMessages.map(msg => 
                      msg.id === newMessage.id
                        ? { 
                            ...msg, 
                            user_avatar: data.avatar_url,
                            avatar_url: data.avatar_url, // Added avatar_url for consistency
                            user_pxb_points: data.points
                          }
                        : msg
                    )
                  );
                }
              })
              .catch(error => console.error('Error fetching user for new message:', error));
            
            return [messageToAdd, ...prevMessages];
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return { messages, loading, postMessage };
};
