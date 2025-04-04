
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

  const fetchMessageReactions = useCallback(async () => {
    try {
      if (!messages.length) return;

      const { data, error } = await supabase
        .from('community_message_reactions')
        .select('*');

      if (error) throw error;

      const reactionsMap: Record<string, { likes: number; dislikes: number; userReaction?: 'like' | 'dislike' }> = {};

      data.forEach(reaction => {
        if (!reactionsMap[reaction.message_id]) {
          reactionsMap[reaction.message_id] = { likes: 0, dislikes: 0 };
        }

        if (reaction.reaction_type === 'like') {
          reactionsMap[reaction.message_id].likes++;
        } else if (reaction.reaction_type === 'dislike') {
          reactionsMap[reaction.message_id].dislikes++;
        }

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

  const enrichMessagesWithUserData = useCallback(async (messages: CommunityMessage[]) => {
    try {
      const userIds = [...new Set(messages.map(msg => msg.user_id))];
      
      if (userIds.length === 0) return messages;
      
      const { data: usersData, error } = await supabase
        .from('users')
        .select('wallet_address, points, username')
        .in('wallet_address', userIds);
        
      if (error) throw error;
      
      const userDataMap: Record<string, any> = {};
      usersData.forEach(user => {
        userDataMap[user.wallet_address] = user;
      });
      
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('users')
        .select('id, wallet_address, points')
        .order('points', { ascending: false })
        .limit(100);
        
      if (leaderboardError) throw leaderboardError;
      
      const rankMap: Record<string, number> = {};
      if (leaderboardData) {
        leaderboardData.forEach((user, index) => {
          if (user.wallet_address) {
            rankMap[user.wallet_address] = index + 1;
          }
        });
      }
      
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('creator, status')
        .in('creator', userIds)
        .in('status', ['won', 'lost', 'completed']);
        
      if (betsError) {
        console.error('Error fetching bets data:', betsError);
      }
      
      const winRates: Record<string, { total: number, wins: number }> = {};
      
      if (betsData) {
        userIds.forEach(userId => {
          winRates[userId] = { total: 0, wins: 0 };
        });
        
        betsData.forEach(bet => {
          if (!bet.creator) return;
          
          if (!winRates[bet.creator]) {
            winRates[bet.creator] = { total: 0, wins: 0 };
          }
          
          winRates[bet.creator].total += 1;
          
          if (bet.status === 'won') {
            winRates[bet.creator].wins += 1;
          }
        });
      }
      
      const enrichedMessages = messages.map(msg => {
        const userData = userDataMap[msg.user_id];
        const userRank = rankMap[msg.user_id];
        const userWinRateData = winRates[msg.user_id];
        
        const winRateValue = userWinRateData && userWinRateData.total > 0
          ? (userWinRateData.wins / userWinRateData.total) * 100
          : 0;
        
        return {
          ...msg,
          username: msg.username || (userData?.username || null),
          user_pxb_points: userData?.points || 0,
          user_win_rate: winRateValue,
          user_rank: userRank
        };
      });
      
      return enrichedMessages;
    } catch (error) {
      console.error('Error enriching messages with user data:', error);
      return messages;
    }
  }, [bets]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await getCommunityMessages();
      const enriched = await enrichMessagesWithUserData(fetchedMessages);
      setMessages(enriched);
      
      // Load all replies for all messages
      const repliesPromises = enriched.map(message => getRepliesForMessage(message.id));
      const repliesResults = await Promise.all(repliesPromises);
      
      const repliesMap: Record<string, CommunityReply[]> = {};
      enriched.forEach((message, index) => {
        repliesMap[message.id] = repliesResults[index];
      });
      
      setMessageReplies(repliesMap);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [enrichMessagesWithUserData]);

  const fetchTopLiked = useCallback(async () => {
    try {
      const topMessages = await getTopLikedMessages(5);
      const enriched = await enrichMessagesWithUserData(topMessages);
      setTopLikedMessages(enriched);
    } catch (err) {
      console.error('Error fetching top liked messages:', err);
    }
  }, [enrichMessagesWithUserData]);

  const postMessage = useCallback(async (content: string) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const userId = publicKey.toString();
      const newMessage = await postCommunityMessage(content, userId);
      
      if (newMessage) {
        fetchMessages();
      }
      
      return newMessage;
    } catch (err) {
      console.error('Error posting message:', err);
      throw err;
    }
  }, [connected, publicKey, fetchMessages]);

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

  const reactToMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const userId = publicKey.toString();
      await reactToMessageService(messageId, userId, reactionType);
      
      setMessageReactions(prev => {
        const messagePrev = prev[messageId] || { likes: 0, dislikes: 0 };
        let likes = messagePrev.likes;
        let dislikes = messagePrev.dislikes;

        if (messagePrev.userReaction === reactionType) {
          if (reactionType === 'like') likes--;
          if (reactionType === 'dislike') dislikes--;
          
          return {
            ...prev,
            [messageId]: { likes, dislikes }
          };
        }
        
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
        
        if (reactionType === 'like') likes++;
        if (reactionType === 'dislike') dislikes++;
        
        return {
          ...prev,
          [messageId]: { likes, dislikes, userReaction: reactionType }
        };
      });
      
      fetchTopLiked();
      
      return true;
    } catch (err) {
      console.error('Error reacting to message:', err);
      throw err;
    }
  }, [connected, publicKey, fetchTopLiked]);

  useEffect(() => {
    const messagesSubscription = supabase
      .channel('community-messages-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages'
        }, 
        payload => {
          const exists = messages.some(msg => msg.id === payload.new.id);
          if (!exists) {
            enrichMessagesWithUserData([payload.new as CommunityMessage])
              .then(enrichedMessages => {
                setMessages(prev => [enrichedMessages[0], ...prev]);
                
                // Load replies for the new message
                getRepliesForMessage(enrichedMessages[0].id)
                  .then(replies => {
                    setMessageReplies(prev => ({
                      ...prev,
                      [enrichedMessages[0].id]: replies
                    }));
                  });
              });
          }
        }
      )
      .subscribe();

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

    const reactionsSubscription = supabase
      .channel('community-reactions-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'community_message_reactions'
        }, 
        () => {
          fetchMessageReactions();
          fetchTopLiked();
        }
      )
      .subscribe();

    fetchMessages();
    fetchMessageReactions();
    fetchTopLiked();

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
