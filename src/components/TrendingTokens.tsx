
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
    <div className="trending-tokens">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-dream-accent1" />
          <h2 className="text-lg font-bold">Trending Tokens</h2>
        </div>

        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <div className="text-xs text-dream-foreground/60 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatLastUpdated()}
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1 px-2 py-1 text-xs rounded-md bg-dream-background/40 hover:bg-dream-background/60 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-dream-background/40 rounded-lg p-4 animate-pulse h-44"></div>
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token, index) => (
            <TokenCard 
              key={token.baseToken?.address || index}
              id={token.baseToken?.address || `trending-${index}`}
              name={token.baseToken?.name || 'Unknown Token'}
              symbol={token.baseToken?.symbol || '???'}
              price={token.priceUsd || 0}
              priceChange={token.priceChange?.h24 || 0}
              timeRemaining={0} // Added required prop
              imageUrl={token.baseToken?.logoURI || ''}
              liquidity={token.liquidity?.usd || 0}
              marketCap={token.marketCap || 0}
              volume24h={token.volume?.h24 || 0}
              pairAddress={token.pairAddress || ''}
              priceChange1h={token.priceChange?.h1 || 0}
              priceChange6h={token.priceChange?.h6 || 0}
              transactions={token.txns?.h24?.buys || 0 + token.txns?.h24?.sells || 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-dream-foreground/60">
          <Flame className="mx-auto h-12 w-12 mb-4 text-dream-accent3/50" />
          <p>No trending tokens found at the moment.</p>
          <p className="text-sm mt-2">Check back later or refresh!</p>
        </div>
      )}
    </div>
  );
};

export default TrendingTokens;
