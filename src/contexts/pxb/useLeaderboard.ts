
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardEntry } from '@/types/pxb';
import { toast } from 'sonner';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winRateLeaderboard, setWinRateLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isLoadingWinRate, setIsLoadingWinRate] = useState(false);

  // Fetch the top users by points
  const fetchLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    try {
      // Query the users table to get top users by points
      const { data, error } = await supabase
        .from('users')
        .select('id, username, points, wallet_address')
        .order('points', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard');
        return;
      }
      
      if (data) {
        const formattedLeaderboard: LeaderboardEntry[] = data.map((user, index) => ({
          id: user.id,
          rank: index + 1,
          username: user.username || `User_${user.wallet_address?.substring(0, 8)}`,
          points: user.points || 0,
          winRate: 0, // Default value, not relevant for points leaderboard
          walletAddress: user.wallet_address
        }));
        
        setLeaderboard(formattedLeaderboard);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
      toast.error('An error occurred while loading the leaderboard');
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, []);

  // Fetch the top users by win rate
  const fetchWinRateLeaderboard = useCallback(async () => {
    setIsLoadingWinRate(true);
    try {
      // This is a simplified example. In a real implementation, you would calculate win rates from the bets table
      // For now, we'll generate a sample win rate leaderboard
      const { data, error } = await supabase
        .from('users')
        .select('id, username, points, wallet_address')
        .order('points', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching win rate leaderboard:', error);
        toast.error('Failed to load win rate leaderboard');
        return;
      }
      
      if (data) {
        // In a real implementation, you would calculate actual win rates
        // This is just a placeholder for the interface
        const formattedLeaderboard: LeaderboardEntry[] = data.map((user, index) => {
          // Generate a random win rate between 40% and 90% for demonstration
          const winRate = Math.floor(Math.random() * 50) + 40;
          
          return {
            id: user.id,
            rank: index + 1,
            username: user.username || `User_${user.wallet_address?.substring(0, 8)}`,
            points: user.points || 0,
            winRate: winRate,
            walletAddress: user.wallet_address
          };
        });
        
        // Sort by win rate (in a real implementation, this would be done in the database query)
        formattedLeaderboard.sort((a, b) => b.winRate - a.winRate);
        
        // Reassign ranks after sorting
        formattedLeaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });
        
        setWinRateLeaderboard(formattedLeaderboard);
      }
    } catch (error) {
      console.error('Error in fetchWinRateLeaderboard:', error);
      toast.error('An error occurred while loading the win rate leaderboard');
    } finally {
      setIsLoadingWinRate(false);
    }
  }, []);

  return {
    leaderboard,
    winRateLeaderboard,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    isLeaderboardLoading,
    isLoadingWinRate
  };
};
