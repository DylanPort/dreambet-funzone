
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchCommunityMessages, postCommunityMessage, CommunityMessage, fetchRepliesForMessage, postReplyToMessage, CommunityReply } from '@/services/communityService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { supabase } from "@/integrations/supabase/client";

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, CommunityReply[]>>({});
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
    
    // Set up real-time subscription for new messages
    const messagesChannel = supabase
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
      
    // Set up real-time subscription for new replies
    const repliesChannel = supabase
      .channel('public:community_replies')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_replies'
      }, payload => {
        const newReply = payload.new as unknown as CommunityReply;
        // Add new reply to the appropriate message
        setMessageReplies(prevReplies => ({
          ...prevReplies,
          [newReply.message_id]: [
            ...(prevReplies[newReply.message_id] || []),
            newReply
          ]
        }));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(repliesChannel);
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
  
  const loadRepliesForMessage = useCallback(async (messageId: string) => {
    try {
      const replies = await fetchRepliesForMessage(messageId);
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: replies
      }));
      return replies;
    } catch (err) {
      console.error('Failed to load replies:', err);
      return [];
    }
  }, []);
  
  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toString();
    const username = userProfile?.username;
    
    return await postReplyToMessage(messageId, content, walletAddress, username);
  }, [connected, publicKey, userProfile]);
  
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);
  
  return {
    messages,
    messageReplies,
    loading,
    error,
    postMessage,
    postReply,
    loadRepliesForMessage,
    refreshMessages
  };
};
