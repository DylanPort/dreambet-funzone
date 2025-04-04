
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  fetchCommunityMessages, 
  postCommunityMessage, 
  CommunityMessage, 
  fetchRepliesForMessage, 
  postReplyToMessage, 
  CommunityReply,
  fetchMessageReactions,
  addReactionToMessage
} from '@/services/communityService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { supabase } from "@/integrations/supabase/client";

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, CommunityReply[]>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, { likes: number, dislikes: number, userReaction: 'like' | 'dislike' | null }>>({});
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
      
      // Load reaction counts for each message
      const reactionPromises = fetchedMessages.map(async (message) => {
        const reactions = await fetchMessageReactions(message.id);
        const likes = reactions.filter(r => r.reaction_type === 'like').length;
        const dislikes = reactions.filter(r => r.reaction_type === 'dislike').length;
        
        // Check if the current user has reacted
        let userReaction: 'like' | 'dislike' | null = null;
        if (publicKey) {
          const userReactionData = reactions.find(r => r.user_id === publicKey.toString());
          if (userReactionData) {
            userReaction = userReactionData.reaction_type as 'like' | 'dislike';
          }
        }
        
        return { messageId: message.id, likes, dislikes, userReaction };
      });
      
      const reactionResults = await Promise.all(reactionPromises);
      const reactionsMap: Record<string, { likes: number, dislikes: number, userReaction: 'like' | 'dislike' | null }> = {};
      
      reactionResults.forEach(result => {
        reactionsMap[result.messageId] = {
          likes: result.likes,
          dislikes: result.dislikes,
          userReaction: result.userReaction
        };
      });
      
      setMessageReactions(reactionsMap);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setLoading(false);
    }
  }, [publicKey]);
  
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
      
    // Set up real-time subscription for reactions
    const reactionsChannel = supabase
      .channel('public:community_message_reactions')
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'community_message_reactions'
      }, async payload => {
        // Reload reactions for the affected message
        const messageId = payload.new?.message_id || payload.old?.message_id;
        if (messageId) {
          const reactions = await fetchMessageReactions(messageId);
          const likes = reactions.filter(r => r.reaction_type === 'like').length;
          const dislikes = reactions.filter(r => r.reaction_type === 'dislike').length;
          
          // Check if the current user has reacted
          let userReaction: 'like' | 'dislike' | null = null;
          if (publicKey) {
            const userReactionData = reactions.find(r => r.user_id === publicKey.toString());
            if (userReactionData) {
              userReaction = userReactionData.reaction_type as 'like' | 'dislike';
            }
          }
          
          setMessageReactions(prev => ({
            ...prev,
            [messageId]: {
              likes,
              dislikes,
              userReaction
            }
          }));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [loadMessages, publicKey]);
  
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
  
  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toString();
    
    return await addReactionToMessage(messageId, walletAddress, reactionType);
  }, [connected, publicKey]);
  
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);
  
  return {
    messages,
    messageReplies,
    messageReactions,
    loading,
    error,
    postMessage,
    postReply,
    loadRepliesForMessage,
    reactToMessage,
    refreshMessages
  };
};
