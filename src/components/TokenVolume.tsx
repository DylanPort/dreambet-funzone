
import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { subscribeToGMGNTokenData } from '@/services/gmgnService';
import { subscribeToTokenMetric } from '@/services/tokenDataCache';
import { useToast } from '@/hooks/use-toast';

interface TokenVolumeProps {
  tokenId: string;
}

const TokenVolume: React.FC<TokenVolumeProps> = ({ tokenId }) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!tokenId) return;
    
    setLoading(true);
    
    // First try to get data from GMGN API (faster)
    const cleanupGMGN = subscribeToGMGNTokenData(tokenId, (data) => {
      if (data.volume24h) {
        setVolume(data.volume24h);
        setLoading(false);
      }
    });
    
    // Fallback to existing service if GMGN doesn't provide the data
    const cleanupFallback = subscribeToTokenMetric(tokenId, 'volume24h', (newVolume) => {
      if (volume === null) { // Only update if we don't have data from GMGN
        setVolume(newVolume);
        setLoading(false);
      }
    });
    
    // If we still don't have data after 10 seconds, show a toast
    const timeoutId = setTimeout(() => {
      if (loading) {
        toast({
          title: "Data loading slowly",
          description: "Volume data is taking longer than expected to load",
          variant: "default",
        });
      }
    }, 10000);
    
    return () => {
      cleanupGMGN();
      cleanupFallback();
      clearTimeout(timeoutId);
    };
  }, [tokenId, volume, loading, toast]);

  const formatLargeNumber = (num: number | null) => {
    if (num === null) return "Loading...";
    
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
      <div className="text-3xl font-bold relative z-10">
        {loading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          formatLargeNumber(volume)
        )}
      </div>
      <div className="absolute top-2 right-2 flex items-center">
        <a 
          href={`https://dexscreener.com/solana/${tokenId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
          title="View on DexScreener"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      {volume !== null && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent2 to-dream-accent3 animate-pulse-glow" 
          style={{ width: `${Math.min(100, (volume / 1000000) * 100)}%` }}
        ></div>
      )}
    </div>
  );
};

export default React.memo(TokenVolume);
