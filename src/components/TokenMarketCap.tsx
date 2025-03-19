
import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, ExternalLink, RefreshCcw } from 'lucide-react';
import { subscribeToMarketCap } from '@/services/dexScreenerService';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortal } from '@/hooks/usePumpPortal';

interface TokenMarketCapProps {
  tokenId: string;
}

const LOCAL_STORAGE_KEY = "marketcap_";

const TokenMarketCap: React.FC<TokenMarketCapProps> = ({ tokenId }) => {
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Use PumpPortal hook to get SOL market cap data
  const { tokenMetrics, subscribeToToken, fetchTokenMetrics } = usePumpPortal(tokenId);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Set up interval to refresh data every second
  useEffect(() => {
    if (!tokenId) return;
    
    const intervalId = setInterval(() => {
      if (isMounted.current) {
        fetchTokenMetrics(tokenId);
        setRefreshing(true);
        setTimeout(() => {
          if (isMounted.current) {
            setRefreshing(false);
          }
        }, 300);
      }
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [tokenId, fetchTokenMetrics]);
  
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    return () => {
      // Clear mounted flag on unmount
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!tokenId) return;
    
    // Subscribe to token updates from PumpPortal
    subscribeToToken(tokenId);
    
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
    
    // Still use DexScreener as fallback data source
    const cleanupDexScreener = subscribeToMarketCap(tokenId, (newMarketCap) => {
      // Convert USD market cap to estimated SOL value (simplified conversion)
      // This is a fallback if PumpPortal doesn't provide data
      const estimatedSolValue = newMarketCap / 150; // Rough USD/SOL conversion
      
      if (!tokenMetrics?.market_cap && isMounted.current) { // Only use if PumpPortal doesn't have data
        setMarketCap(estimatedSolValue);
        setLastUpdated(new Date());
        setLoading(false);
        // Trigger pulse animation
        setPulseEffect(true);
        setTimeout(() => setPulseEffect(false), 1000);
        
        // Cache in localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY + tokenId, JSON.stringify({
            value: estimatedSolValue,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error caching market cap:", e);
        }
      }
    });
    
    // Shorter timeout for toast (5 seconds instead of 10)
    const timeoutId = setTimeout(() => {
      if (loading && !marketCap && isMounted.current) {
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
  }, [tokenId, loading, toast, marketCap, subscribeToToken]);

  // Update when PumpPortal data changes
  useEffect(() => {
    if (tokenMetrics && tokenMetrics.market_cap && isMounted.current) {
      setMarketCap(tokenMetrics.market_cap);
      setLastUpdated(new Date());
      setLoading(false);
      
      // Trigger pulse animation on update
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
      
      // Cache in localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY + tokenId, JSON.stringify({
          value: tokenMetrics.market_cap,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("Error caching market cap:", e);
      }
    }
  }, [tokenMetrics, tokenId]);

  const formatLargeNumber = (num: number | null) => {
    if (num === null) return "Loading...";
    
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B SOL`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M SOL`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K SOL`;
    }
    return `${num.toFixed(4)} SOL`;
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
        <span className="text-lg font-semibold">Market Cap (SOL)</span>
        {lastUpdated && (
          <span className="ml-auto text-xs text-dream-foreground/50">
            {getLastUpdatedText()}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold relative z-10 flex items-center ${pulseEffect ? 'text-dream-accent1 transition-colors duration-500' : ''}`}>
        {loading && !marketCap ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            <span className="mr-2">{formatLargeNumber(marketCap)}</span>
            <div className="flex items-center h-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></div>
              <span className="text-xs text-green-400 font-semibold animate-pulse-slow">LIVE</span>
            </div>
          </>
        )}
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <RefreshCcw 
          className={`w-4 h-4 text-dream-accent2/70 ${refreshing ? 'animate-spin' : ''}`} 
          title="Updates every second"
        />
        <a 
          href={`https://pumpfun.io/token/${tokenId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
          title="View on PumpFun"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      {/* Add constant shimmering effect to bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-1">
        <div 
          className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent1 animate-pulse-glow" 
        ></div>
        <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-white/30 backdrop-blur-sm transform -skew-x-45 animate-shine"></div>
      </div>
    </div>
  );
};

export default React.memo(TokenMarketCap);
