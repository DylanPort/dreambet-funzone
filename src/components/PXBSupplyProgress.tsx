
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const PXBSupplyProgress = () => {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const maxSupply = 1_000_000_000; // 1 billion maximum supply
  
  // Calculate progress percentage
  const progressPercentage = (totalMinted / maxSupply) * 100;
  
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Fetch the initial total minted points
  const fetchTotalMinted = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('points')
        .gt('points', 0);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Sum all user points
        const total = data.reduce((sum, user) => sum + (user.points || 0), 0);
        setTotalMinted(total);
      }
      
    } catch (err) {
      console.error('Error fetching total minted points:', err);
      setError('Failed to load supply data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up real-time subscription to points_history table for live updates
  useEffect(() => {
    fetchTotalMinted();
    
    // Subscribe to real-time updates on points_history table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_history'
        },
        (payload) => {
          // When there's any change to points_history, refresh the total
          fetchTotalMinted();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold flex items-center">
          <Coins className="mr-2 h-5 w-5 text-dream-accent1" />
          PXB Total Supply
        </h2>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-dream-accent2" />
        ) : error ? (
          <span className="text-red-400 text-sm">{error}</span>
        ) : null}
      </div>
      
      <div className="relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/20 to-dream-accent3/20 animate-gradient-move rounded-lg"></div>
        
        {/* Progress bar */}
        <div className="relative z-10 mb-1">
          <Progress 
            value={progressPercentage} 
            className="h-6 bg-dream-foreground/10" 
          />
          
          {/* Moving highlight effect */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-20 h-full bg-white/10 animate-scan-line"></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm mt-2">
        <div>
          <span className="text-dream-foreground/60">Minted: </span>
          <span className="font-bold text-dream-accent2">{formatNumber(totalMinted)} PXB</span>
        </div>
        <div>
          <span className="text-dream-foreground/60">Remaining: </span>
          <span className="font-medium">{formatNumber(maxSupply - totalMinted)} PXB</span>
        </div>
        <div>
          <span className="text-dream-foreground/60">Progress: </span>
          <span className="font-medium">{progressPercentage.toFixed(5)}%</span>
        </div>
      </div>
      
      <div className="text-xs text-dream-foreground/50 mt-2 text-center animate-pulse-subtle">
        Live updates: Points are being minted in real-time
      </div>
    </>
  );
};

export default PXBSupplyProgress;
