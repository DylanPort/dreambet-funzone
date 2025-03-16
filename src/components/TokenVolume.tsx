
import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { subscribeToVolume } from '@/services/dexScreenerService';

interface TokenVolumeProps {
  tokenId: string;
}

const TokenVolume: React.FC<TokenVolumeProps> = ({ tokenId }) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) return;
    
    setLoading(true);
    
    // Immediately check cache
    const cachedData = localStorage.getItem(`volume_${tokenId}`);
    if (cachedData) {
      try {
        const { value, timestamp } = JSON.parse(cachedData);
        // Use cache if less than 2 minutes old
        if (Date.now() - timestamp < 120000) {
          setVolume(value);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing cached volume data:", e);
      }
    }
    
    const cleanup = subscribeToVolume(tokenId, (newVolume) => {
      setVolume(newVolume);
      setLoading(false);
      
      // Cache the result
      localStorage.setItem(`volume_${tokenId}`, JSON.stringify({
        value: newVolume,
        timestamp: Date.now()
      }));
    });
    
    return () => {
      cleanup();
    };
  }, [tokenId]);

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

export default TokenVolume;
