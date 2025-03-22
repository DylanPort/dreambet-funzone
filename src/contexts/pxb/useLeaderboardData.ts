
import { useState, useCallback } from 'react';
import { UserProfile } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';

export const useLeaderboardData = () => {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('points', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      const formattedLeaderboard: UserProfile[] = data.map(user => ({
        id: user.id,
        username: user.username || user.wallet_address.substring(0, 8),
        pxbPoints: user.points,
        createdAt: user.created_at,
        wallet_address: user.wallet_address // Adding the wallet_address property
      }));
      
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    leaderboard,
    isLoading,
    fetchLeaderboard
  };
};
