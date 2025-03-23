
import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, ExternalLink, RefreshCcw } from 'lucide-react';
import { subscribeToVolume } from '@/services/dexScreenerService';
import { useToast } from '@/hooks/use-toast';

interface TokenVolumeProps {
  tokenId: string;
}

const LOCAL_STORAGE_KEY = "volume_";

const TokenVolume: React.FC<TokenVolumeProps> = ({ tokenId }) => {
  const [volume, setVolume] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Set up interval to refresh data every 10 seconds
  useEffect(() => {
    if (!tokenId) return;
    
    const intervalId = setInterval(() => {
      if (isMounted.current) {
        setRefreshing(true);
        setTimeout(() => {
          if (isMounted.current) {
            setRefreshing(false);
          }
        }, 300);
      }
    }, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [tokenId]);
  
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
    
    // Immediately try to load from localStorage for instant display
    try {
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY + tokenId);
      if (cachedData) {
        const { value, timestamp } = JSON.parse(cachedData);
        // Only use if less than 2 minutes old
        if (Date.now() - timestamp < 2 * 60 * 1000) {
          setVolume(value);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Error loading cached volume:", e);
    }
    
    // Use DexScreener as the primary data source
    const cleanupDexScreener = subscribeToVolume(tokenId, (newVolume) => {
      if (isMounted.current) {
        setVolume(newVolume);
        setLastUpdated(new Date());
        setLoading(false);
        
        // Trigger pulse animation
        setPulseEffect(true);
        setTimeout(() => {
          if (isMounted.current) {
            setPulseEffect(false);
          }
        }, 1000);
        
        // Cache in localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY + tokenId, JSON.stringify({
            value: newVolume,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error caching volume:", e);
        }
      }
    }, 10000); // 10 seconds refresh interval
    
    return () => {
      cleanupDexScreener();
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
      <div className="absolute inset-0 bg-gradient-to-r from-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
      <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
        <BarChart2 size={20} className="mr-3 text-dream-accent2 animate-pulse-glow" />
        <span className="text-lg font-semibold">24h Volume</span>
        {lastUpdated && (
          <span className="ml-auto text-xs text-dream-foreground/50">
            {getLastUpdatedText()}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold relative z-10 flex items-center ${pulseEffect ? 'text-dream-accent2 transition-colors duration-500' : ''}`}>
        {loading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <>
            <span className="mr-2">{formatLargeNumber(volume)}</span>
            <div className="flex items-center h-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></div>
              <span className="text-xs text-green-400 font-semibold animate-pulse-slow">LIVE</span>
            </div>
          </>
        )}
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div className="relative group">
          <RefreshCcw 
            className={`w-4 h-4 text-dream-accent2/70 ${refreshing ? 'animate-spin' : ''}`} 
            aria-label="Updates every 10 seconds"
          />
          <span className="absolute -top-8 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Updates every 10 seconds
          </span>
        </div>
        <a 
          href={`https://dexscreener.com/solana/${tokenId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
          aria-label="View on DexScreener"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      {/* Add constant shimmering effect to bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden h-1">
        <div 
          className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dream-accent2 via-dream-accent3 to-dream-accent2 animate-pulse-glow" 
        ></div>
        <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-white/30 backdrop-blur-sm transform -skew-x-45 animate-shine"></div>
      </div>
    </div>
  );
};

export default React.memo(TokenVolume);
