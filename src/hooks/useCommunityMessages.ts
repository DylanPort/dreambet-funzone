
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  getCommunityMessages, 
  postCommunityMessage, 
  getRepliesForMessage, 
  postReply as postReplyService, 
  reactToMessage as reactToMessageService, 
  CommunityMessage, 
  CommunityReply,
  getTopLikedMessages
} from '@/services/communityService';
import { supabase } from '@/integrations/supabase/client';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [topLikedMessages, setTopLikedMessages] = useState<CommunityMessage[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, CommunityReply[]>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, { likes: number; dislikes: number; userReaction?: 'like' | 'dislike' }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { publicKey, connected } = useWallet();
  const { bets } = usePXBPoints();

  // Function to fetch message reactions
  const fetchMessageReactions = useCallback(async () => {
    try {
      if (!messages.length) return;

      const { data, error } = await supabase
        .from('community_message_reactions')
        .select('*');

      if (error) throw error;

      const reactionsMap: Record<string, { likes: number; dislikes: number; userReaction?: 'like' | 'dislike' }> = {};

      // Process all reactions and group by message_id
      data.forEach(reaction => {
        if (!reactionsMap[reaction.message_id]) {
          reactionsMap[reaction.message_id] = { likes: 0, dislikes: 0 };
        }

        if (reaction.reaction_type === 'like') {
          reactionsMap[reaction.message_id].likes++;
        } else if (reaction.reaction_type === 'dislike') {
          reactionsMap[reaction.message_id].dislikes++;
        }

        // Store current user's reaction
        if (connected && publicKey && reaction.user_id === publicKey.toString()) {
          if (reaction.reaction_type === 'like' || reaction.reaction_type === 'dislike') {
            reactionsMap[reaction.message_id].userReaction = reaction.reaction_type;
          }
        }
      });

      setMessageReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching message reactions:', error);
    }
  }, [messages, connected, publicKey]);

  // Function to fetch user data for messages
  const enrichMessagesWithUserData = useCallback(async (messages: CommunityMessage[]) => {
    try {
      // Get all unique user IDs from messages
      const userIds = [...new Set(messages.map(msg => msg.user_id))];
      
      if (userIds.length === 0) return messages;
      
      // Fetch user data for all messages at once
      const { data: usersData, error } = await supabase
        .from('users')
        .select('wallet_address, points, username')
        .in('wallet_address', userIds);
        
      if (error) throw error;
      
      // Create a map of user data by wallet address
      const userDataMap: Record<string, any> = {};
      usersData.forEach(user => {
        userDataMap[user.wallet_address] = user;
      });
      
      // Calculate win rates for each user if we have bets data
      const winRates: Record<string, number> = {};
      
      if (bets && bets.length > 0) {
        userIds.forEach(userId => {
          const userBets = bets.filter(bet => 
            bet.creator === userId || 
            bet.userId === userId
          );
          
          const completedBets = userBets.filter(bet => 
            bet.status === 'won' || bet.status === 'lost'
          );
          
          const wonBets = userBets.filter(bet => bet.status === 'won');
          
          winRates[userId] = completedBets.length > 0 
            ? (wonBets.length / completedBets.length) * 100 
            : 0;
        });
      }
      
      // Enrich messages with user data
      const enrichedMessages = messages.map(msg => {
        const userData = userDataMap[msg.user_id];
        
        return {
          ...msg,
          username: msg.username || (userData?.username || null),
          user_pxb_points: userData?.points || 0,
          user_win_rate: winRates[msg.user_id] || 0
        };
      });
      
      return enrichedMessages;
    } catch (error) {
      console.error('Error enriching messages with user data:', error);
      return messages;
    }
  }, [bets]);

  // Fetch community messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await getCommunityMessages();
      const enriched = await enrichMessagesWithUserData(fetchedMessages);
      setMessages(enriched);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [enrichMessagesWithUserData]);

  // Fetch top liked messages
  const fetchTopLiked = useCallback(async () => {
    try {
      const topMessages = await getTopLikedMessages(5);
      const enriched = await enrichMessagesWithUserData(topMessages);
      setTopLikedMessages(enriched);
    } catch (err) {
      console.error('Error fetching top liked messages:', err);
    }
  }, [enrichMessagesWithUserData]);

  // Post a new message
  const postMessage = useCallback(async (content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const userId = publicKey.toString();
      const newMessage = await postCommunityMessage(content, userId);
      
      if (newMessage) {
        // Refresh messages to include the new one
        fetchMessages();
      }
      
      return newMessage;
    } catch (err) {
      console.error('Error posting message:', err);
      throw err;
    }
  }, [connected, publicKey, fetchMessages]);

  // Load replies for a message
  const loadRepliesForMessage = useCallback(async (messageId: string) => {
    try {
      const replies = await getRepliesForMessage(messageId);
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: replies
      }));
      return replies;
    } catch (err) {
      console.error('Error loading replies:', err);
      throw err;
    }
  }, []);

  // Post a reply to a message
  const postReply = useCallback(async (messageId: string, content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const userId = publicKey.toString();
      const newReply = await postReplyService(messageId, content, userId);
      
      if (newReply) {
        setMessageReplies(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), newReply]
        }));
      }
      
      return newReply;
    } catch (err) {
      console.error('Error posting reply:', err);
      throw err;
    }
  }, [connected, publicKey]);

  // React to a message
  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const userId = publicKey.toString();
      await reactToMessageService(messageId, userId, reactionType);
      
      // Update local state
      setMessageReactions(prev => {
        const messagePrev = prev[messageId] || { likes: 0, dislikes: 0 };
        let likes = messagePrev.likes;
        let dislikes = messagePrev.dislikes;

        // If user already reacted with the same type, remove it
        if (messagePrev.userReaction === reactionType) {
          if (reactionType === 'like') likes--;
          if (reactionType === 'dislike') dislikes--;
          
          return {
            ...prev,
            [messageId]: { likes, dislikes }
          };
        }
        
        // If user already reacted with the other type, switch it
        if (messagePrev.userReaction) {
          if (messagePrev.userReaction === 'like') {
            likes--;
            dislikes++;
          } else {
            likes++;
            dislikes--;
          }
          
          return {
            ...prev,
            [messageId]: { likes, dislikes, userReaction: reactionType }
          };
        }
        
        // If user hasn't reacted yet, add their reaction
        if (reactionType === 'like') likes++;
        if (reactionType === 'dislike') dislikes++;
        
        return {
          ...prev,
          [messageId]: { likes, dislikes, userReaction: reactionType }
        };
      });
      
      // Refresh top liked messages
      fetchTopLiked();
      
      return true;
    } catch (err) {
      console.error('Error reacting to message:', err);
      throw err;
    }
  }, [connected, publicKey, fetchTopLiked]);

  // Initialize real-time subscriptions
  useEffect(() => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('community-messages-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages'
        }, 
        payload => {
          // Check if this message is already in our list
          const exists = messages.some(msg => msg.id === payload.new.id);
          if (!exists) {
            enrichMessagesWithUserData([payload.new as CommunityMessage])
              .then(enrichedMessages => {
                setMessages(prev => [enrichedMessages[0], ...prev]);
              });
          }
        }
      )
      .subscribe();

    // Subscribe to new replies
    const repliesSubscription = supabase
      .channel('community-replies-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_replies'
        }, 
        payload => {
          const newReply = payload.new as CommunityReply;
          setMessageReplies(prev => {
            const msgReplies = prev[newReply.message_id] || [];
            // Check if this reply is already in our list
            const exists = msgReplies.some(reply => reply.id === newReply.id);
            if (!exists) {
              return {
                ...prev,
                [newReply.message_id]: [...msgReplies, newReply]
              };
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Subscribe to new reactions
    const reactionsSubscription = supabase
      .channel('community-reactions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'community_message_reactions'
        }, 
        () => {
          // Just fetch all reactions again
          fetchMessageReactions();
          fetchTopLiked();
        }
      )
      .subscribe();

    // Initial fetch
    fetchMessages();
    fetchMessageReactions();
    fetchTopLiked();

    // Cleanup subscriptions on unmount
    return () => {
      messagesSubscription.unsubscribe();
      repliesSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [fetchMessages, fetchMessageReactions, fetchTopLiked, messages, enrichMessagesWithUserData]);

  return {
    messages,
    messageReplies,
    messageReactions,
    topLikedMessages,
    loading,
    error,
    postMessage,
    loadRepliesForMessage,
    postReply,
    reactToMessage,
    fetchTopLiked
  };
};
