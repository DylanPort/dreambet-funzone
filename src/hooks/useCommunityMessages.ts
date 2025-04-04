
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  fetchCommunityMessages, 
  postCommunityMessage, 
  postReplyToMessage,
  reactToMessage,
  CommunityMessage, 
  CommunityReply 
} from '@/services/communityService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { supabase } from "@/integrations/supabase/client";

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { publicKey, connected } = useWallet();
  const { userProfile } = usePXBPoints();
  
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await fetchCommunityMessages();
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, payload => {
        // Add new message to the state
        setMessages(prevMessages => [payload.new as unknown as CommunityMessage, ...prevMessages]);
      })
      .subscribe();

    // Subscribe to replies
    const repliesChannel = supabase
      .channel('public:community_replies')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_replies'
      }, payload => {
        const newReply = payload.new as unknown as CommunityReply;
        // Update the message with the new reply
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === newReply.message_id 
              ? { 
                  ...msg, 
                  replies: [...(msg.replies || []), newReply] 
                } 
              : msg
          )
        );
      })
      .subscribe();

    // Subscribe to likes
    const likesChannel = supabase
      .channel('public:community_likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_likes'
      }, () => {
        // Just refresh the messages to get updated like counts
        loadMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [loadMessages]);
  
  const postMessage = useCallback(async (content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toString();
    const username = userProfile?.username;
    
    return await postCommunityMessage(content, walletAddress, username);
  }, [connected, publicKey, userProfile]);

  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toString();
    const username = userProfile?.username;
    
    return await postReplyToMessage(messageId, content, walletAddress, username);
  }, [connected, publicKey, userProfile]);

  const toggleLike = useCallback(async (messageId: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toString();
    await reactToMessage(messageId, walletAddress);
  }, [connected, publicKey]);
  
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);
  
  return {
    messages,
    loading,
    error,
    postMessage,
    postReply,
    toggleLike,
    refreshMessages
  };
};
