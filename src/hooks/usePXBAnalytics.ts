
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PXBAnalytics {
  totalMinted: number;
  totalUsers: number;
  usersWithPoints: number;
  averagePerUser: number;
  distributionByRange: {
    range: string;
    users: number;
    totalPoints: number;
    percentage: number;
  }[];
  topHolders: {
    username: string | null;
    points: number;
    percentage: number;
  }[];
  recentMints: {
    amount: number;
    timestamp: string;
    action: string;
  }[];
}

const DEFAULT_ANALYTICS: PXBAnalytics = {
  totalMinted: 0,
  totalUsers: 0,
  usersWithPoints: 0,
  averagePerUser: 0,
  distributionByRange: [],
  topHolders: [],
  recentMints: []
};

export const usePXBAnalytics = (pollingInterval = 1000) => {
  const [analytics, setAnalytics] = useState<PXBAnalytics>(DEFAULT_ANALYTICS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPXBAnalytics = async () => {
    try {
      // Get total minted from points_history using a more efficient query
      // This query sums all mint transactions excluding extremely large ones
      const { data: mintData, error: mintError } = await supabase
        .rpc('get_total_minted_points', {}, { count: 'exact' })
        .single();
      
      if (mintError) {
        // Fallback to the original query if the RPC function doesn't exist
        const { data: fallbackMintData, error: fallbackMintError } = await supabase
          .from('points_history')
          .select('amount')
          .eq('action', 'mint');
        
        if (fallbackMintError) throw fallbackMintError;
        
        // Calculate total minted (excluding extremely large transactions)
        const totalMinted = fallbackMintData
          .filter(record => record.amount !== 1008808000)
          .reduce((sum, record) => sum + (record.amount || 0), 0);
          
        // Update the analytics with just the total minted
        setAnalytics(prev => ({
          ...prev,
          totalMinted
        }));
      } else {
        // If the RPC function exists, use its result
        const totalMinted = mintData?.total_minted || 0;
        
        // Update the analytics with just the total minted
        setAnalytics(prev => ({
          ...prev,
          totalMinted
        }));
      }
      
      // Every 5 seconds, fetch the complete analytics (to reduce database load)
      if (Date.now() % 5000 < pollingInterval) {
        await fetchCompleteAnalytics();
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching PXB total minted:', err);
      setError('Failed to load PXB analytics');
      setIsLoading(false);
    }
  };

  const fetchCompleteAnalytics = async () => {
    try {
      // Get total minted from points_history
      const { data: mintData, error: mintError } = await supabase
        .from('points_history')
        .select('amount')
        .eq('action', 'mint');
      
      if (mintError) throw mintError;
      
      // Calculate total minted (excluding extremely large transactions)
      const totalMinted = mintData
        .filter(record => record.amount !== 1008808000)
        .reduce((sum, record) => sum + (record.amount || 0), 0);
      
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
      
      // Get distribution by ranges
      const ranges = [
        { min: 0, max: 1000, label: '0-1,000' },
        { min: 1001, max: 10000, label: '1,001-10,000' },
        { min: 10001, max: 100000, label: '10,001-100,000' },
        { min: 100001, max: 1000000, label: '100,001-1,000,000' },
        { min: 1000001, max: null, label: '1,000,000+' }
      ];
      
      const distributionPromises = ranges.map(async range => {
        let query = supabase.from('users').select('id, points', { count: 'exact' });
        
        if (range.min === 0) {
          query = query.eq('points', 0);
        } else if (range.max === null) {
          query = query.gte('points', range.min);
        } else {
          query = query.gte('points', range.min).lt('points', range.max);
        }
        
        const { data, count, error } = await query;
        
        if (error) throw error;
        
        const totalPoints = data?.reduce((sum, user) => sum + (user.points || 0), 0) || 0;
        
        return {
          range: range.label,
          users: count || 0,
          totalPoints,
          percentage: totalMinted > 0 ? (totalPoints / totalMinted) * 100 : 0
        };
      });
      
      const distributionByRange = await Promise.all(distributionPromises);
      
      // Get top holders (top 5)
      const { data: topHoldersData, error: topError } = await supabase
        .from('users')
        .select('username, points')
        .order('points', { ascending: false })
        .limit(5);
      
      if (topError) throw topError;
      
      const topHolders = topHoldersData.map(holder => ({
        username: holder.username || 'Anonymous',
        points: holder.points || 0,
        percentage: totalMinted > 0 ? ((holder.points || 0) / totalMinted) * 100 : 0
      }));
      
      // Get recent mints (last 5)
      const { data: recentMintsData, error: recentError } = await supabase
        .from('points_history')
        .select('amount, created_at, action')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;
      
      const recentMints = recentMintsData.map(mint => ({
        amount: mint.amount || 0,
        timestamp: mint.created_at || '',
        action: mint.action || ''
      }));
      
      // Set the complete analytics data
      setAnalytics({
        totalMinted,
        totalUsers,
        usersWithPoints,
        averagePerUser,
        distributionByRange,
        topHolders,
        recentMints
      });
    } catch (err) {
      console.error('Error fetching complete PXB analytics:', err);
      // Don't update error state here to avoid overriding the UI if only the full refresh fails
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPXBAnalytics();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchPXBAnalytics, pollingInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [pollingInterval]);

  return { analytics, isLoading, error, refetch: fetchPXBAnalytics };
};
