
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Clock } from 'lucide-react';
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

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const data = await fetchTrendingTokens();
      setTokens(data);
      setLastUpdated(new Date());
      
      if (data.length === 0) {
        toast({
          title: "No trending tokens found",
          description: "We couldn't find any tokens with recent activity",
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
  };

  useEffect(() => {
    fetchData();
    // Set up a refresh interval for every 2 minutes
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Refresh data when tab becomes visible again
  useVisibilityChange(() => {
    fetchData();
  });

  const handleRefresh = () => {
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

  return (
    <div className="glass-panel p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-dream-accent1" />
          <h2 className="text-xl font-display font-semibold">Trending Solana Tokens</h2>
          <div className="bg-dream-accent1/20 text-dream-accent1 text-xs px-2 py-0.5 rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Last Hour
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-dream-foreground/50">
              Updated {formatLastUpdated()}
            </span>
          )}
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-dream-accent2/20 hover:bg-dream-accent2/30 rounded-full transition-colors duration-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dream-accent1"></div>
        </div>
      ) : (
        <div className="space-y-5">
          {tokens.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No trending tokens found in the last hour
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tokens.map((token, index) => (
                <TokenCard
                  key={`${token.id}-${index}`}
                  id={token.id}
                  name={token.name}
                  symbol={token.symbol}
                  price={token.marketCap}
                  priceChange={token.priceChange}
                  timeRemaining={token.timeRemaining}
                  imageUrl={token.imageUrl}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendingTokens;
