
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchCommunityMessages, postCommunityMessage, CommunityMessage } from '@/services/communityService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';

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
        setMessages(prevMessages => [payload.new as CommunityMessage, ...prevMessages]);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
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
  
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);
  
  return {
    messages,
    loading,
    error,
    postMessage,
    refreshMessages
  };
};

// Add missing import
import { supabase } from "@/integrations/supabase/client";
