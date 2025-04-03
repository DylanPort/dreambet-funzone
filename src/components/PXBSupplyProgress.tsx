import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

const PXBSupplyProgress = () => {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const maxSupply = 1_000_000_000; // 1 billion maximum supply
  const stakingRewards = 400_000_000; // 400 million reserved for staking rewards
  const additionalBurned = 110_000_000; // 110 million reserved/removed from circulation (10M + 100M previously burned)
  const totalReserved = stakingRewards + additionalBurned;

  // Calculate percentages for display
  const mintedPercentage = (totalMinted / maxSupply) * 100;
  const stakingPercentage = (stakingRewards / maxSupply) * 100;
  const burnedPercentage = (additionalBurned / maxSupply) * 100;
  const totalPercentage = mintedPercentage + stakingPercentage + burnedPercentage;

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Manually refresh the total minted amount
  const manualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchTotalMinted(true);
    setIsRefreshing(false);
  };

  // Fetch the total minted points - improved to accurately count real user mints
  const fetchTotalMinted = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(forceRefresh ? true : isLoading);
      
      // Get all mint transactions
      const { data, error } = await supabase
        .from('points_history')
        .select('amount, user_id, action, reference_id')
        .eq('action', 'mint')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Raw mint transactions:', data.length);
        
        // Filter out system transactions using multiple criteria
        const filteredData = data.filter(record => {
          // Filter out extremely large amounts (likely system transactions)
          if (record.amount > 10000000) return false;
          
          // Filter out specific reference IDs that indicate system operations
          if (record.reference_id?.includes('system_') || 
              record.reference_id?.includes('init_') || 
              record.reference_id?.includes('admin_')) return false;
          
          // Keep legitimate user mint transactions
          return true;
        });
        
        console.log('Filtered mint transactions (real user mints):', filteredData.length);
        
        // Sum all minting transactions to get the true minted amount
        const total = filteredData.reduce((sum, record) => sum + (record.amount || 0), 0);
        
        // Animate when new points are minted and it's not the initial load
        if (total > totalMinted && totalMinted !== 0) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
        
        console.log('Total minted by real users:', total, 'Previous:', totalMinted);
        setTotalMinted(total);
        setLastRefreshTime(new Date());
      }
    } catch (err) {
      console.error('Error fetching total minted points:', err);
      setError('Failed to load supply data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and setup polling for regular updates
  useEffect(() => {
    fetchTotalMinted();
    
    // Poll for updates every 15 seconds to ensure fresh data
    const pollInterval = setInterval(() => {
      fetchTotalMinted();
    }, 15000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Set up real-time subscription to points_history table for live updates
  useEffect(() => {
    // Subscribe to real-time updates on points_history table
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'points_history',
        filter: 'action=eq.mint'
      }, payload => {
        // When there's any change to points_history with action=mint, refresh the total
        console.log('Real-time update detected for minting:', payload);
        fetchTotalMinted();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative z-10">
      <div className={`absolute inset-0 bg-gradient-to-r from-dream-accent1/30 to-dream-accent3/30 rounded-lg blur-xl transition-opacity duration-700 ${isAnimating ? 'opacity-80' : 'opacity-20'}`}></div>
      
      <div className="relative z-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="relative">
              <img alt="Diamond" className="mr-2 h-5 w-5 object-contain animate-pulse-subtle" style={{
              filter: 'drop-shadow(0 0 4px rgba(219, 39, 119, 0.5))'
            }} src="/lovable-uploads/c5a2b975-3b82-4cbf-94db-8cb2fe2be3a6.png" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500 font-bold">
              PXB Total Supply
            </span>
          </h2>
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-dream-accent2" />
            ) : error ? (
              <span className="text-red-400 text-sm">{error}</span>
            ) : (
              <button 
                onClick={manualRefresh} 
                className="flex items-center text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
        
        {/* Stacked progress bar showing different allocations */}
        <div className="relative transform perspective-1000 rotate-x-1 hover:rotate-x-2 transition-transform duration-300">
          {/* Background and effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/20 to-dream-accent3/20 animate-gradient-move rounded-lg blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 rounded-lg"></div>
          
          {/* Multi-segment progress bar */}
          <div className="relative z-10 mb-1 transform translate-y-px shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <div className="h-7 w-full rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 overflow-hidden relative">
              {/* Minted segment - green */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 transition-all duration-300"
                style={{ width: `${mintedPercentage}%` }}
              >
                {/* Shimmer effect for minted */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-shine"></div>
              </div>
              
              {/* Staking segment - purple */}
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                style={{ left: `${mintedPercentage}%`, width: `${stakingPercentage}%` }}
              >
                {/* Shimmer effect for staking */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-shine" style={{ animationDelay: '0.5s' }}></div>
              </div>
              
              {/* Burned segment - yellow/orange */}
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-300"
                style={{ left: `${mintedPercentage + stakingPercentage}%`, width: `${burnedPercentage}%` }}
              >
                {/* Shimmer effect for burned */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-shine" style={{ animationDelay: '1s' }}></div>
              </div>
              
              {/* Moving highlight effect */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-lg">
                <div className="absolute top-0 left-0 w-20 h-full bg-white/20 animate-scan-line"></div>
                
                {/* Pulse dots for "minting in progress" effect */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="absolute top-1/2 h-1 w-1 rounded-full bg-white/80 animate-pulse" 
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.3}s`,
                      transform: 'translateY(-50%)'
                    }} 
                  />
                ))}
              </div>
              
              {/* Progress percentage label */}
              {totalPercentage > 5 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md pointer-events-none">
                  {totalPercentage.toFixed(2)}% of 1B
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between text-sm mt-3 relative z-20">
        <div className="mb-1">
          <span className="text-dream-foreground/60">Minted: </span>
          <span className="text-[#00ff00] animate-pulse-subtle">
            {formatNumber(totalMinted)} PXB
          </span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({(mintedPercentage).toFixed(5)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Staking Rewards: </span>
          <span className="font-medium text-purple-400">{formatNumber(stakingRewards)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({stakingPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Burned: </span>
          <span className="font-medium text-yellow-400">{formatNumber(additionalBurned)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({burnedPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Remaining: </span>
          <span className="font-medium">{formatNumber(maxSupply - totalReserved - totalMinted)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">
            ({(100 - totalPercentage).toFixed(1)}%)
          </span>
        </div>
        <div className="mb-1">
          <span className="text-dream-foreground/60">Total Supply: </span>
          <span className="font-medium">{formatNumber(maxSupply)} PXB</span>
          <span className="text-dream-foreground/40 text-xs ml-1">(100%)</span>
        </div>
      </div>
      
      <div className="text-xs text-dream-foreground/50 mt-2 text-center bg-gradient-to-r from-transparent via-white/5 to-transparent p-1 rounded">
        <span className="inline-flex items-center">
          <Sparkles className="h-3 w-3 mr-1 text-dream-accent2/70" />
          Live updates: Last refreshed {lastRefreshTime.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default PXBSupplyProgress;
