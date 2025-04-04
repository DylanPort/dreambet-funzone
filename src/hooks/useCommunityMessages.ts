import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCommunityMessages, 
  postCommunityMessage, 
  fetchRepliesForMessage, 
  postReplyToMessage,
  addReactionToMessage,
  fetchTopLikedMessages,
  CommunityMessage,
  CommunityReply,
  MessageReaction
} from '@/services/communityService';

interface MessageReactions {
  [messageId: string]: {
    likes: number;
    dislikes: number;
    userReaction: 'like' | 'dislike' | null;
  };
}

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [topLikedMessages, setTopLikedMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<{[key: string]: CommunityReply[]}>({});
  const [messageReactions, setMessageReactions] = useState<MessageReactions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { publicKey } = useWallet();

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchCommunityMessages();
      setMessages(fetchedMessages);
      
      const initialReactions: MessageReactions = {};
      for (const msg of fetchedMessages) {
        initialReactions[msg.id] = {
          likes: msg.likes_count || 0,
          dislikes: msg.dislikes_count || 0,
          userReaction: msg.user_reaction || null
        };
      }
      setMessageReactions(initialReactions);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopLiked = useCallback(async () => {
    try {
      const topMessages = await fetchTopLikedMessages();
      setTopLikedMessages(topMessages);
    } catch (err) {
      console.error('Error fetching top liked messages:', err);
    }
  }, []);

  const postMessage = useCallback(async (content: string) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    const newMessage = await postCommunityMessage(content, userId);
    
    setMessages(prev => [newMessage, ...prev]);
    
    setMessageReactions(prev => ({
      ...prev,
      [newMessage.id]: {
        likes: 0,
        dislikes: 0,
        userReaction: null
      }
    }));
    
    return newMessage;
  }, [publicKey]);

  const loadRepliesForMessage = useCallback(async (messageId: string) => {
    try {
      const replies = await fetchRepliesForMessage(messageId);
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: replies
      }));
      return replies;
    } catch (err) {
      console.error(`Error fetching replies for message ${messageId}:`, err);
      throw err;
    }
  }, []);

  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    const newReply = await postReplyToMessage(messageId, content, userId);
    
    setMessageReplies(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), newReply]
    }));
    
    return newReply;
  }, [publicKey]);

  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    
    try {
      const result = await addReactionToMessage(messageId, userId, reactionType);
      
      const currentReaction = messageReactions[messageId]?.userReaction;
      
      setMessageReactions(prev => {
        const newState = { ...prev };
        
        if (!result) {
          newState[messageId] = {
            likes: currentReaction === 'like' ? prev[messageId].likes - 1 : prev[messageId].likes,
            dislikes: currentReaction === 'dislike' ? prev[messageId].dislikes - 1 : prev[messageId].dislikes,
            userReaction: null
          };
        } else if (currentReaction && currentReaction !== reactionType) {
          newState[messageId] = {
            likes: currentReaction === 'like' ? prev[messageId].likes - 1 : prev[messageId].likes + (reactionType === 'like' ? 1 : 0),
            dislikes: currentReaction === 'dislike' ? prev[messageId].dislikes - 1 : prev[messageId].dislikes + (reactionType === 'dislike' ? 1 : 0),
            userReaction: reactionType
          };
        } else if (!currentReaction) {
          newState[messageId] = {
            likes: reactionType === 'like' ? prev[messageId].likes + 1 : prev[messageId].likes,
            dislikes: reactionType === 'dislike' ? prev[messageId].dislikes + 1 : prev[messageId].dislikes,
            userReaction: reactionType
          };
        }
        
        return newState;
      });
      
      return result;
    } catch (err) {
      console.error(`Error reacting to message ${messageId}:`, err);
      throw err;
    }
  }, [publicKey, messageReactions]);

  useEffect(() => {
    fetchMessages();
    fetchTopLiked();
  }, [fetchMessages, fetchTopLiked]);

  useEffect(() => {
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'community_messages' 
      }, (payload) => {
        if (payload.new && (!publicKey || payload.new.user_id !== publicKey.toString())) {
          const newMessage = payload.new as CommunityMessage;
          setMessages(prev => [newMessage, ...prev]);
          
          setMessageReactions(prev => ({
            ...prev,
            [newMessage.id]: {
              likes: 0,
              dislikes: 0,
              userReaction: null
            }
          }));
        }
      })
      .subscribe();
      
    const reactionsChannel = supabase
      .channel('public:community_message_reactions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'community_message_reactions' 
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [fetchMessages, publicKey]);

  return {
    messages,
    topLikedMessages,
    messageReplies,
    messageReactions,
    loading,
    error,
    postMessage,
    loadRepliesForMessage,
    postReply,
    reactToMessage,
    fetchTopLiked
  };
};
