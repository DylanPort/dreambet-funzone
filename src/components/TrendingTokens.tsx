
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, ExternalLink, Zap, Flame } from 'lucide-react';
import TokenCard from '@/components/TokenCard';
import { fetchTrendingTokens } from '@/services/dexScreenerService';
import { useVisibilityChange } from '@/hooks/useVisibilityChange';
import { useToast } from "@/hooks/use-toast";

const TrendingTokens: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("Fetching trending tokens data...");
      const data = await fetchTrendingTokens();
      console.log("Trending tokens data received:", data.length, "tokens");
      setTokens(data);
      setLastUpdated(new Date());
      if (data.length === 0) {
        toast({
          title: "No trending tokens found",
          description: "We couldn't find any trending tokens right now",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      toast({
        title: "Error fetching data",
        description: "We couldn't fetch the latest trending tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useVisibilityChange(() => {
    console.log("Tab became visible, refreshing trending tokens data");
    fetchData();
  });

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchData();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const formatNumber = (num: number, prefix = "") => {
    if (num >= 1000000000) {
      return `${prefix}${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${prefix}${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${prefix}${(num / 1000).toFixed(2)}K`;
    }
    return `${prefix}${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-dream-accent1" />
          <span>TRENDING NOW</span>
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center text-dream-foreground/70 hover:text-dream-foreground transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center text-dream-foreground/60">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span>Updated {formatLastUpdated()}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={`skeleton-${index}`} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <div className="glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300 animate-pulse">
                <div className="h-10 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="h-6 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="h-20 bg-dream-foreground/5 rounded mb-3"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-dream-foreground/5 rounded"></div>
                  <div className="h-10 bg-dream-foreground/5 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dream-foreground/60">No trending tokens found. Try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token, index) => (
            <div key={`${token.id}-${index}`} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <TokenCard
                id={token.id}
                name={token.name}
                symbol={token.symbol}
                price={token.price}
                priceChange={token.priceChange}
                timeRemaining={0}
                liquidity={token.liquidity}
                marketCap={token.marketCap}
                volume24h={token.volume24h}
                index={index}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingTokens;
