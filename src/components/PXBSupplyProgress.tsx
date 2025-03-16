
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';

const PXBSupplyProgress = () => {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
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
        
        // Animate when new points are minted
        if (total > totalMinted && totalMinted !== 0) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1500);
        }
        
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
    <div className="relative z-10">
      <div className={`absolute inset-0 bg-gradient-to-r from-dream-accent1/30 to-dream-accent3/30 rounded-lg blur-xl transition-opacity duration-700 ${isAnimating ? 'opacity-80' : 'opacity-20'}`}></div>
      
      <div className="relative z-20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="relative">
              <img 
                src="/lovable-uploads/05f6e261-54bf-4bf4-ba9d-52794f1b3b3c.png" 
                alt="Diamond" 
                className="mr-2 h-5 w-5 object-contain animate-pulse-subtle"
                style={{ filter: 'drop-shadow(0 0 4px rgba(219, 39, 119, 0.5))' }}
              />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3 font-bold">
              PXB Total Supply
            </span>
          </h2>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-dream-accent2" />
          ) : error ? (
            <span className="text-red-400 text-sm">{error}</span>
          ) : null}
        </div>
        
        {/* 3D container for progress bar */}
        <div className="relative transform perspective-1000 rotate-x-1 hover:rotate-x-2 transition-transform duration-300">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/20 to-dream-accent3/20 animate-gradient-move rounded-lg blur-sm"></div>
          
          {/* Reflective surface effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 rounded-lg"></div>
          
          {/* Main progress bar with shadow for 3D effect */}
          <div className="relative z-10 mb-1 transform translate-y-px shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            <Progress 
              value={progressPercentage} 
              className={`h-7 transition-all duration-500 ${isAnimating ? 'scale-105' : 'scale-100'}`}
            />
            
            {/* Moving highlight effect */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-lg">
              <div className="absolute top-0 left-0 w-20 h-full bg-white/20 animate-scan-line"></div>
              
              {/* Pulse dots for "minting in progress" effect */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute top-1/2 h-1 w-1 rounded-full bg-white/80 animate-pulse"
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    animationDelay: `${i * 0.3}s`,
                    transform: 'translateY(-50%)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-sm mt-3 relative z-20">
        <div>
          <span className="text-dream-foreground/60">Minted: </span>
          <span className={`font-bold text-dream-accent2 transition-all duration-500 ${isAnimating ? 'text-yellow-300 scale-110' : ''}`}>
            {formatNumber(totalMinted)} PXB
          </span>
        </div>
        <div>
          <span className="text-dream-foreground/60">Remaining: </span>
          <span className="font-medium">{formatNumber(maxSupply - totalMinted)} PXB</span>
        </div>
        <div>
          <span className="text-dream-foreground/60">Progress: </span>
          <span className={`font-medium transition-all duration-500 ${isAnimating ? 'text-yellow-300' : ''}`}>
            {progressPercentage.toFixed(5)}%
          </span>
        </div>
      </div>
      
      <div className="text-xs text-dream-foreground/50 mt-2 text-center bg-gradient-to-r from-transparent via-white/5 to-transparent p-1 rounded animate-pulse-subtle">
        <span className="inline-flex items-center">
          <Sparkles className="h-3 w-3 mr-1 text-dream-accent2/70" />
          Live updates: Points are being minted in real-time
        </span>
      </div>
    </div>
  );
};

export default PXBSupplyProgress;
