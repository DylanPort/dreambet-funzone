
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCommunityMessages, 
  postCommunityMessage, 
  fetchRepliesForMessage, 
  postReplyToMessage,
  addReactionToMessage,
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
  const [messageReplies, setMessageReplies] = useState<{[key: string]: CommunityReply[]}>({});
  const [messageReactions, setMessageReactions] = useState<MessageReactions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { publicKey } = useWallet();

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchCommunityMessages();
      setMessages(fetchedMessages);
      
      // Initialize reaction counts
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

  // Post a new message
  const postMessage = useCallback(async (content: string) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    const newMessage = await postCommunityMessage(content, userId);
    
    // Update messages state
    setMessages(prev => [newMessage, ...prev]);
    
    // Initialize reactions for this message
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

  // Load replies for a specific message
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

  // Post a reply to a message
  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    const newReply = await postReplyToMessage(messageId, content, userId);
    
    // Update replies state
    setMessageReplies(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), newReply]
    }));
    
    return newReply;
  }, [publicKey]);

  // React to a message (like/dislike)
  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const userId = publicKey.toString();
    
    try {
      // Call API to add/update/remove the reaction
      const result = await addReactionToMessage(messageId, userId, reactionType);
      
      // Get current user reaction
      const currentReaction = messageReactions[messageId]?.userReaction;
      
      // Update local state based on the action taken (add/update/remove)
      setMessageReactions(prev => {
        const newState = { ...prev };
        
        if (!result) {
          // Reaction was removed
          newState[messageId] = {
            likes: currentReaction === 'like' ? prev[messageId].likes - 1 : prev[messageId].likes,
            dislikes: currentReaction === 'dislike' ? prev[messageId].dislikes - 1 : prev[messageId].dislikes,
            userReaction: null
          };
        } else if (currentReaction && currentReaction !== reactionType) {
          // Reaction was changed (e.g., from like to dislike)
          newState[messageId] = {
            likes: currentReaction === 'like' ? prev[messageId].likes - 1 : prev[messageId].likes + (reactionType === 'like' ? 1 : 0),
            dislikes: currentReaction === 'dislike' ? prev[messageId].dislikes - 1 : prev[messageId].dislikes + (reactionType === 'dislike' ? 1 : 0),
            userReaction: reactionType
          };
        } else if (!currentReaction) {
          // New reaction was added
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

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'community_messages' 
      }, (payload) => {
        // Only add the message if it's not from the current user
        // to avoid duplication with optimistic updates
        if (payload.new && (!publicKey || payload.new.user_id !== publicKey.toString())) {
          const newMessage = payload.new as CommunityMessage;
          setMessages(prev => [newMessage, ...prev]);
          
          // Initialize reactions for this message
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
      
    // Also subscribe to reactions
    const reactionsChannel = supabase
      .channel('public:community_message_reactions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'community_message_reactions' 
      }, (payload) => {
        // Refresh messages to get updated reaction counts
        // In a production app, we'd implement a more sophisticated approach
        // to update just the affected message's reaction counts
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
    messageReplies,
    messageReactions,
    loading,
    error,
    postMessage,
    loadRepliesForMessage,
    postReply,
    reactToMessage
  };
};
