
import React, { useState, useEffect } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { subscribeToMarketCap } from '@/services/dexScreenerService';
import { useToast } from '@/hooks/use-toast';

interface TokenMarketCapProps {
  tokenId: string;
}

const LOCAL_STORAGE_KEY = "marketcap_";

const TokenMarketCap: React.FC<TokenMarketCapProps> = ({ tokenId }) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!tokenId) return;
    
    // Immediately try to load from localStorage for instant display
    try {
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY + tokenId);
      if (cachedData) {
        const { value, timestamp } = JSON.parse(cachedData);
        // Only use if less than 15 minutes old
        if (Date.now() - timestamp < 15 * 60 * 1000) {
          setMarketCap(value);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Error loading cached market cap:", e);
    }
    
    // Only use DexScreener as data source
    const cleanupDexScreener = subscribeToMarketCap(tokenId, (newMarketCap) => {
      setMarketCap(newMarketCap);
      setLastUpdated(new Date());
      setLoading(false);
      
      // Cache in localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY + tokenId, JSON.stringify({
          value: newMarketCap,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("Error caching market cap:", e);
      }
    });
    
    // Shorter timeout for toast (5 seconds instead of 10)
    const timeoutId = setTimeout(() => {
      if (loading && !marketCap) {
        toast({
          title: "Still loading data",
          description: "Market cap data is taking longer than expected",
          variant: "default",
        });
      }
    }, 5000);
    
    return () => {
      cleanupDexScreener();
      clearTimeout(timeoutId);
    };
  }, [tokenId, loading, toast, marketCap]);

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

  // Format timestamp to show how recently the data was updated
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 10) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent2/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <BarChart3 size={20} className="mr-3 text-dream-accent1 animate-pulse-glow" />
        <span className="text-lg font-semibold">Market Cap</span>
        {lastUpdated && (
          <span className="ml-auto text-xs text-dream-foreground/50">
            {getLastUpdatedText()}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold relative z-10 flex items-center">
        {loading && !marketCap ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            <span className="mr-2">{formatLargeNumber(marketCap)}</span>
            <div className="flex items-center h-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
            </div>
          </>
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

export default React.memo(TokenMarketCap);
