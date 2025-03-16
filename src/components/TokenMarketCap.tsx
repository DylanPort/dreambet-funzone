
import React, { useState, useEffect } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { subscribeToMarketCap } from '@/services/dexScreenerService';

interface TokenMarketCapProps {
  tokenId: string;
}

const TokenMarketCap: React.FC<TokenMarketCapProps> = ({ tokenId }) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId) return;
    
    setLoading(true);
    
    // Immediately check cache
    const cachedData = localStorage.getItem(`marketcap_${tokenId}`);
    if (cachedData) {
      try {
        const { value, timestamp } = JSON.parse(cachedData);
        // Use cache if less than 2 minutes old
        if (Date.now() - timestamp < 120000) {
          setMarketCap(value);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing cached market cap data:", e);
      }
    }
    
    const cleanup = subscribeToMarketCap(tokenId, (newMarketCap) => {
      setMarketCap(newMarketCap);
      setLoading(false);
      
      // Cache the result
      localStorage.setItem(`marketcap_${tokenId}`, JSON.stringify({
        value: newMarketCap,
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
    <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent2/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <BarChart3 size={20} className="mr-3 text-dream-accent1 animate-pulse-glow" />
        <span className="text-lg font-semibold">Market Cap</span>
      </div>
      <div className="text-3xl font-bold relative z-10">
        {loading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          formatLargeNumber(marketCap)
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
      {marketCap !== null && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent1 to-dream-accent2 animate-pulse-glow" 
          style={{ width: `${Math.min(100, (marketCap / 10000000) * 100)}%` }}
        ></div>
      )}
    </div>
  );
};

export default TokenMarketCap;
