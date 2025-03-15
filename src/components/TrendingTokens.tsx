
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, ExternalLink, Zap, Flame } from 'lucide-react';
import TokenCard from '@/components/TokenCard';
import { fetchTrendingTokens } from '@/services/dexScreenerService';
import { useVisibilityChange } from '@/hooks/useVisibilityChange';
import { toast } from 'sonner';

const TrendingTokens: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("Fetching trending tokens data...");
      const data = await fetchTrendingTokens();
      console.log("Trending tokens data received:", data.length, "tokens");
      setTokens(data);
      setLastUpdated(new Date());
      if (data.length === 0) {
        toast.error("No trending tokens found");
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      toast.error("Error fetching trending tokens");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
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

  // Add the JSX return statement
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <div className="p-4 bg-black/30 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            <h2 className="text-xl font-bold">Trending Tokens</h2>
          </div>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                <span>Updated {formatLastUpdated()}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center p-1 rounded hover:bg-black/30 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
          </div>
        ) : tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            No trending tokens found at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingTokens;
