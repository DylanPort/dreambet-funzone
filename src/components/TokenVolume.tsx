
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchDexScreenerData, startDexScreenerPolling } from '@/services/dexScreenerService';

interface TokenVolumeProps {
  tokenId: string;
}

const TokenVolume = ({ tokenId }: TokenVolumeProps) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    
    const loadVolume = async () => {
      try {
        setIsLoading(true);
        
        // Load the data once
        const data = await fetchDexScreenerData(tokenId);
        if (data) {
          setVolume(data.volume24h || 0);
        }
        
        // Set up polling for updates
        cleanupFn = startDexScreenerPolling(tokenId, (data) => {
          if (data) {
            setVolume(data.volume24h || 0);
          }
        }, 30000); // Poll every 30 seconds
        
      } catch (error) {
        console.error('Error loading volume:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (tokenId) {
      loadVolume();
    }
    
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [tokenId]);

  const formatLargeNumber = (num: number | null) => {
    if (num === null) return "Loading...";
    if (num === 0) return "$0";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <RefreshCw size={20} className="mr-3 text-dream-accent2 animate-spin-slow" />
        <span className="text-lg font-semibold">24h Volume</span>
      </div>
      {isLoading ? (
        <div className="text-3xl font-bold relative z-10 animate-pulse">Loading...</div>
      ) : (
        <div className="text-3xl font-bold relative z-10">{formatLargeNumber(volume)}</div>
      )}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent2 to-dream-accent3 animate-pulse-glow" 
           style={{ width: `${Math.min(100, ((volume || 0) / 1000000) * 100)}%` }}></div>
    </div>
  );
};

export default TokenVolume;
