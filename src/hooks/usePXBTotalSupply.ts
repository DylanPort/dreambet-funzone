
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
    totalMinted: 1000000000, // Set to 1 billion to force the fully minted state
    totalUsers: 0,
    usersWithPoints: 0,
    averagePerUser: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalMinted = async () => {
    try {
      // Get total users count
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('count');
      
      if (userError) throw userError;
      
      const totalUsers = userData[0]?.count || 0;
      
      // Fixed values for fully minted supply
      const totalMinted = 1000000000; // 1 billion (fully minted)
      const usersWithPoints = 8035; // Fixed value as shown in the image
      
      // Calculate average points per user
      const averagePerUser = usersWithPoints > 0 ? 
        Math.round(Number(totalMinted) / Number(usersWithPoints)) : 0;
      
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
