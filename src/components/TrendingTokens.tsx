
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import TokenCard from '@/components/TokenCard';
import { fetchTrendingTokens } from '@/services/dexScreenerService';
import { useVisibilityChange } from '@/hooks/useVisibilityChange';

const TrendingTokens: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const data = await fetchTrendingTokens();
      setTokens(data);
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
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

  return (
    <div className="glass-panel p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-dream-accent1" />
          <h2 className="text-xl font-display font-semibold">Trending Solana Tokens</h2>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-dream-accent2/20 hover:bg-dream-accent2/30 rounded-full transition-colors duration-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dream-accent1"></div>
        </div>
      ) : (
        <div className="space-y-5">
          {tokens.length === 0 ? (
            <div className="text-center py-10 text-dream-foreground/60">
              No trending tokens found
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
