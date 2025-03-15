
import { useState, useEffect, useCallback } from 'react';
import { getUserPoints, initializeUserPoints } from '@/services/pointsService';
import { useWallet } from '@solana/wallet-adapter-react';

export const useUserPoints = () => {
  const [points, setPoints] = useState<{ total: number; available: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();

  const fetchPoints = useCallback(async () => {
    if (!connected) {
      setPoints(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Initialize points if needed
      await initializeUserPoints();
      
      // Get current points
      const userPoints = await getUserPoints();
      setPoints(userPoints);
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => {
    fetchPoints();
    
    // Set up event listener for points updates
    const handlePointsUpdate = () => {
      console.log('Points update event received');
      fetchPoints();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, [fetchPoints]);

  return { points, loading, refreshPoints: fetchPoints };
};

export default useUserPoints;
