
import { useState, useCallback } from 'react';
import { UserProfile } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';

export const useLeaderboardData = () => {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [winrateLeaderboard, setWinrateLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch points leaderboard
      const { data: pointsData, error: pointsError } = await supabase
        .from('users')
        .select('*')
        .order('points', { ascending: false })
        .limit(10);
      
      if (pointsError) {
        console.error('Error fetching points leaderboard:', pointsError);
        return;
      }
      
      const formattedPointsLeaderboard: UserProfile[] = pointsData.map(user => ({
        id: user.id,
        username: user.username || user.wallet_address.substring(0, 8),
        pxbPoints: user.points,
        createdAt: user.created_at
      }));
      
      setLeaderboard(formattedPointsLeaderboard);
      
      // Fetch win rate leaderboard
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('bettor1_id, outcome, status')
        .or('status.eq.won,status.eq.lost,status.eq.completed')
        .order('created_at', { ascending: false });
      
      if (betsError) {
        console.error('Error fetching bets data:', betsError);
        return;
      }
      
      // Calculate win rates for users
      const userWins = {};
      const userTotals = {};
      
      betsData.forEach(bet => {
        if (!bet.bettor1_id) return;
        
        const userId = bet.bettor1_id;
        
        // Initialize if first encounter
        if (!userTotals[userId]) {
          userTotals[userId] = 0;
          userWins[userId] = 0;
        }
        
        // Count total bets
        userTotals[userId]++;
        
        // Count wins
        if (bet.outcome === 'win' || bet.status === 'won') {
          userWins[userId]++;
        }
      });
      
      // Get user details for users with bets
      const userIds = Object.keys(userTotals);
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, wallet_address')
          .in('id', userIds);
        
        if (userError) {
          console.error('Error fetching user data for win rates:', userError);
          return;
        }
        
        // Calculate win rates and create leaderboard
        const winRateData = userData.map(user => {
          const userId = user.id;
          const totalBets = userTotals[userId] || 0;
          const wins = userWins[userId] || 0;
          const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
          
          return {
            id: userId,
            username: user.username || user.wallet_address.substring(0, 8),
            winRate: winRate,
            totalBets: totalBets,
            wins: wins
          };
        });
        
        // Sort by win rate
        const sortedWinRateData = winRateData
          .sort((a, b) => {
            // First sort by win rate
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            // If win rates are equal, sort by number of bets (more bets is better)
            return b.totalBets - a.totalBets;
          })
          .slice(0, 10);
        
        setWinrateLeaderboard(sortedWinRateData);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFullLeaderboard = useCallback(async (type: 'points' | 'winrate') => {
    try {
      if (type === 'points') {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('points', { ascending: false })
          .limit(50);
        
        if (error) {
          console.error('Error fetching full points leaderboard:', error);
          return [];
        }
        
        return data.map(user => ({
          id: user.id,
          username: user.username || user.wallet_address.substring(0, 8),
          pxbPoints: user.points,
          createdAt: user.created_at
        }));
      } else {
        // For win rate, we need to reuse the calculation logic
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select('bettor1_id, outcome, status')
          .or('status.eq.won,status.eq.lost,status.eq.completed');
        
        if (betsError) {
          console.error('Error fetching all bets data:', betsError);
          return [];
        }
        
        // Calculate win rates for users (same logic as above)
        const userWins = {};
        const userTotals = {};
        
        betsData.forEach(bet => {
          if (!bet.bettor1_id) return;
          
          const userId = bet.bettor1_id;
          
          // Initialize if first encounter
          if (!userTotals[userId]) {
            userTotals[userId] = 0;
            userWins[userId] = 0;
          }
          
          // Count total bets
          userTotals[userId]++;
          
          // Count wins
          if (bet.outcome === 'win' || bet.status === 'won') {
            userWins[userId]++;
          }
        });
        
        // Get user details for users with bets
        const userIds = Object.keys(userTotals);
        if (userIds.length === 0) {
          return [];
        }
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, wallet_address')
          .in('id', userIds);
        
        if (userError) {
          console.error('Error fetching user data for all win rates:', userError);
          return [];
        }
        
        // Calculate win rates and create leaderboard
        const winRateData = userData.map(user => {
          const userId = user.id;
          const totalBets = userTotals[userId] || 0;
          const wins = userWins[userId] || 0;
          const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
          
          return {
            id: userId,
            username: user.username || user.wallet_address.substring(0, 8),
            winRate: winRate,
            totalBets: totalBets,
            wins: wins
          };
        });
        
        // Sort by win rate and limit to 50
        return winRateData
          .sort((a, b) => {
            // First sort by win rate
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            // If win rates are equal, sort by number of bets (more bets is better)
            return b.totalBets - a.totalBets;
          })
          .slice(0, 50);
      }
    } catch (error) {
      console.error(`Error fetching full ${type} leaderboard:`, error);
      return [];
    }
  }, []);

  return {
    leaderboard,
    winrateLeaderboard,
    fetchLeaderboard,
    fetchFullLeaderboard,
    isLoading
  };
};
