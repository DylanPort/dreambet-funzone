
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <TrendingUp className="text-dream-accent2" />
          Trending Tokens
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="flex items-center text-sm text-dream-foreground/60">
              <Clock className="w-4 h-4 mr-1" />
              <span>Updated {formatLastUpdated()}</span>
            </div>
          )}
          <button
            className="btn-secondary p-2 rounded-full"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-20 bg-dream-foreground/10 rounded mb-4" />
              <div className="h-6 bg-dream-foreground/10 rounded mb-2 w-2/3" />
              <div className="h-4 bg-dream-foreground/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token, index) => (
            <TokenCard
              key={`${token.pairAddress}-${index}`}
              id={token.pairAddress}
              name={token.name}
              symbol={token.symbol}
              price={token.price}
              priceChange={token.priceChange24h}
              timeRemaining={token.age || 0}
              index={index}
              liquidity={token.liquidity}
              marketCap={token.marketCap}
              volume24h={token.volume24h}
              pairAddress={token.pairAddress}
              priceChange1h={token.priceChange1h}
              priceChange6h={token.priceChange6h}
              transactions={token.transactions}
              age={token.age}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-6 text-center">
          <div className="mb-4 text-5xl opacity-30">🔍</div>
          <h3 className="text-xl font-medium mb-2">No Trending Tokens Found</h3>
          <p className="text-dream-foreground/60 mb-4">
            We couldn't find any trending tokens right now.
          </p>
          <button
            className="btn-primary px-4 py-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Try Again"}
          </button>
        </div>
      )}
    </section>
  );
};

export default TrendingTokens;
