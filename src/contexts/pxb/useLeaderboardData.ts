
import { useState, useCallback } from 'react';
import { LeaderboardEntry, WinRateLeaderboardEntry } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';

export const useLeaderboardData = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winRateLeaderboard, setWinRateLeaderboard] = useState<WinRateLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWinRate, setIsLoadingWinRate] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get the leaderboard - top users by points
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, points, avatar_url')
        .order('points', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        setLeaderboard([]);
        return;
      }
      
      // Transform the data to match LeaderboardEntry
      const formattedLeaderboard: LeaderboardEntry[] = data.map((entry, index) => ({
        id: entry.id,
        username: entry.username || `User${index+1}`,
        displayName: entry.display_name,
        points: entry.points || 0,
        avatar: entry.avatar_url,
        rank: index + 1
      }));
      
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWinRateLeaderboard = useCallback(async () => {
    setIsLoadingWinRate(true);
    try {
      // Get the win rate leaderboard based on token trading
      const { data, error } = await supabase
        .from('token_transactions')
        .select(`
          userid,
          type,
          users!token_transactions_userid_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .limit(1000); // Get a reasonable amount of transactions to calculate with
      
      if (error) {
        console.error('Error fetching trade data for win rate:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        setWinRateLeaderboard([]);
        return;
      }
      
      // Calculate trades per user
      const tradeStats: Record<string, { 
        userId: string, 
        username: string | null, 
        displayName: string | null,
        avatar: string | null,
        totalTrades: number 
      }> = {};
      
      // Process all trades to gather user stats
      data.forEach(record => {
        const userId = record.userid;
        const user = record.users;
        
        if (!userId) return;
        
        if (!tradeStats[userId]) {
          tradeStats[userId] = {
            userId,
            username: user?.username || null,
            displayName: user?.display_name || null,
            avatar: user?.avatar_url || null,
            totalTrades: 0
          };
        }
        
        // Count this trade
        tradeStats[userId].totalTrades += 1;
      });
      
      // Convert to array and sort by trade count
      const tradersArray = Object.values(tradeStats)
        .filter(trader => trader.totalTrades >= 5) // Only include users with at least 5 trades
        .sort((a, b) => b.totalTrades - a.totalTrades);
      
      // Format as WinRateLeaderboardEntry - using trade count as the metric
      const formattedLeaderboard: WinRateLeaderboardEntry[] = tradersArray.map((trader, index) => ({
        id: trader.userId,
        username: trader.username || `Trader${index+1}`,
        displayName: trader.displayName || undefined,
        trades: trader.totalTrades,
        winRate: 100, // All trades are considered "wins" in a trading app
        avatar: trader.avatar || undefined,
        rank: index + 1
      }));
      
      setWinRateLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error in fetchWinRateLeaderboard:', error);
    } finally {
      setIsLoadingWinRate(false);
    }
  }, []);

  return {
    leaderboard,
    fetchLeaderboard,
    isLoading,
    winRateLeaderboard,
    fetchWinRateLeaderboard,
    isLoadingWinRate
  };
};
