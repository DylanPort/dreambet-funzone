
import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { fetchDexScreenerData, startDexScreenerPolling } from '@/services/dexScreenerService';

interface TokenMarketCapProps {
  tokenId: string;
}

const TokenMarketCap = ({ tokenId }: TokenMarketCapProps) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    
    const loadMarketCap = async () => {
      try {
        setIsLoading(true);
        
        // Load the data once
        const data = await fetchDexScreenerData(tokenId);
        if (data) {
          setMarketCap(data.marketCap || 0);
        }
        
        // Set up polling for updates
        cleanupFn = startDexScreenerPolling(tokenId, (data) => {
          if (data) {
            setMarketCap(data.marketCap || 0);
          }
        }, 30000); // Poll every 30 seconds
        
      } catch (error) {
        console.error('Error loading market cap:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (tokenId) {
      loadMarketCap();
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
    <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent2/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <BarChart3 size={20} className="mr-3 text-dream-accent1 animate-pulse-glow" />
        <span className="text-lg font-semibold">Market Cap</span>
      </div>
      {isLoading ? (
        <div className="text-3xl font-bold relative z-10 animate-pulse">Loading...</div>
      ) : (
        <div className="text-3xl font-bold relative z-10">{formatLargeNumber(marketCap)}</div>
      )}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent1 to-dream-accent2 animate-pulse-glow" 
           style={{ width: `${Math.min(100, ((marketCap || 0) / 10000000) * 100)}%` }}></div>
    </div>
  );
};

export default TokenMarketCap;
