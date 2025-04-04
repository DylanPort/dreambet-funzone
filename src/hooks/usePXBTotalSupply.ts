
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PXBSupplyData {
  totalMinted: number;
  totalUsers: number;
  usersWithPoints: number;
  averagePerUser: number;
}

export const usePXBTotalSupply = (refreshInterval = 1000) => {
  const [supplyData, setSupplyData] = useState<PXBSupplyData>({
    totalMinted: 0,
    totalUsers: 0,
    usersWithPoints: 0,
    averagePerUser: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalMinted = async () => {
    try {
      // Get total minted (sum of all points in users table)
      const { data: mintedData, error: mintedError } = await supabase
        .rpc('get_total_minted_pxb');
      
      if (mintedError) throw mintedError;
      
      const totalMinted = mintedData || 0;
      
      // Get total users count
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('count');
      
      if (userError) throw userError;
      
      const totalUsers = userData[0]?.count || 0;
      
      // Get users with points count
      const { data: usersWithPointsData, error: pointsError } = await supabase
        .from('users')
        .select('count')
        .gt('points', 0);
      
      if (pointsError) throw pointsError;
      
      const usersWithPoints = usersWithPointsData[0]?.count || 0;
      
      // Calculate average points per user (only for users with points)
      const averagePerUser = usersWithPoints > 0 ? 
        Math.round(totalMinted / usersWithPoints) : 0;
      
      setSupplyData({
        totalMinted,
        totalUsers,
        usersWithPoints,
        averagePerUser
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching PXB total minted:', err);
      setError('Failed to load PXB supply data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTotalMinted();
    
    // Set up interval for real-time updates
    const intervalId = setInterval(fetchTotalMinted, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return { supplyData, isLoading, error, refetch: fetchTotalMinted };
};
