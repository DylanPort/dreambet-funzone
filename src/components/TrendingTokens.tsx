
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Clock, ExternalLink, Zap } from 'lucide-react';
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
    
    // Set up a more frequent refresh interval (every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Refresh data when tab becomes visible again
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

  // Format large numbers for display
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
    <div className="glass-panel p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-dream-accent1" />
          <h2 className="text-xl font-display font-semibold">Trending Solana Tokens</h2>
          <div className="bg-dream-accent1/20 text-dream-accent1 text-xs px-2 py-0.5 rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Real-time Trending
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
              No trending tokens found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-dream-foreground/10">
                    <th className="text-left py-3 px-2 text-xs text-dream-foreground/60 font-medium">#</th>
                    <th className="text-left py-3 px-2 text-xs text-dream-foreground/60 font-medium">TOKEN</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">PRICE</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">AGE</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">TXNS</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">VOLUME</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">1H</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">6H</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">24H</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">LIQUIDITY</th>
                    <th className="text-right py-3 px-2 text-xs text-dream-foreground/60 font-medium">MCAP</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => (
                    <tr 
                      key={`${token.id}-${index}`} 
                      className="border-b border-dream-foreground/5 hover:bg-dream-accent1/5 transition-colors duration-200"
                    >
                      <td className="py-3 px-2 text-sm">#{index + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 relative">
                            {token.imageUrl ? (
                              <img 
                                src={token.imageUrl} 
                                alt={token.name} 
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  const imgElement = e.target as HTMLImageElement;
                                  imgElement.style.display = 'none';
                                  const nextElement = imgElement.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 ${token.imageUrl ? 'hidden' : ''}`}
                            >
                              <span className="font-display font-bold text-sm">{token.symbol.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">{token.name}</span>
                              <a 
                                href={`https://dexscreener.com/solana/${token.pairAddress}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-dream-foreground/40 hover:text-dream-accent1"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-xs text-dream-foreground/60">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">${token.price < 1 ? token.price.toFixed(8) : token.price.toFixed(4)}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm">{token.age}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm">{token.transactions.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">{formatNumber(token.volume24h, "$")}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-sm ${token.priceChange1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.priceChange1h > 0 ? '+' : ''}{token.priceChange1h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-sm ${token.priceChange6h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.priceChange6h > 0 ? '+' : ''}{token.priceChange6h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-sm ${token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.priceChange > 0 ? '+' : ''}{token.priceChange.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">{formatNumber(token.liquidity, "$")}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-medium">{formatNumber(token.marketCap, "$")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendingTokens;
