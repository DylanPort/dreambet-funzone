
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink, TrendingUp, Zap, Flame, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPumpFunTokens } from '@/services/pumpPortalService';
import { formatDistanceToNow } from 'date-fns';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Define types for token data
interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastTradeTimestamp: number;
  pairAddress?: string;
}

// Betting stats interface
interface BettingStats {
  totalBets: number;
  upBets: number;
  downBets: number;
  volume: number;
}

const MigratingTokenList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof TokenData | null, direction: 'ascending' | 'descending' }>({
    key: 'volume24h',
    direction: 'descending'
  });
  const [bettingStats, setBettingStats] = useState<Record<string, BettingStats>>({});
  
  const navigate = useNavigate();
  const { userBets } = usePXBPoints();
  
  // Fetch the list of tokens from the API
  const { data: tokens, isLoading, isError, refetch } = useQuery({
    queryKey: ['pumpfun-tokens'],
    queryFn: fetchPumpFunTokens,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Calculate betting stats for each token
  useEffect(() => {
    if (userBets) {
      const stats: Record<string, BettingStats> = {};
      
      userBets.forEach(bet => {
        if (!stats[bet.tokenId]) {
          stats[bet.tokenId] = {
            totalBets: 0,
            upBets: 0,
            downBets: 0,
            volume: 0
          };
        }
        
        stats[bet.tokenId].totalBets++;
        stats[bet.tokenId].volume += bet.amount;
        
        if (bet.prediction === 'moon' || bet.prediction === 'up') {
          stats[bet.tokenId].upBets++;
        } else if (bet.prediction === 'die' || bet.prediction === 'down') {
          stats[bet.tokenId].downBets++;
        }
      });
      
      setBettingStats(stats);
    }
  }, [userBets]);
  
  // Handle requests to sort the table
  const requestSort = (key: keyof TokenData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Sort the tokens based on the current sort configuration
  const sortedTokens = React.useMemo(() => {
    if (!tokens) return [];
    
    let sortableTokens = [...tokens];
    if (sortConfig.key) {
      sortableTokens.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTokens;
  }, [tokens, sortConfig]);
  
  // Filter tokens based on search term
  const filteredTokens = React.useMemo(() => {
    if (!sortedTokens) return [];
    
    return sortedTokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedTokens, searchTerm]);
  
  // Handle navigation to token detail page
  const handleTokenClick = (tokenId: string) => {
    navigate(`/token/${tokenId}`);
  };
  
  // Format large numbers with appropriate suffixes
  const formatNumber = (num: number | undefined, prefix: string = '') => {
    if (num === undefined) return '-';
    
    if (num >= 1000000000) {
      return `${prefix}${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${prefix}${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${prefix}${(num / 1000).toFixed(2)}K`;
    } else {
      return `${prefix}${num.toFixed(2)}`;
    }
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Get the order indicator for the sorted column
  const getSortIndicator = (key: keyof TokenData) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  // Handle Moon/Die bet placement
  const handleBetAction = (e: React.MouseEvent, tokenId: string, tokenName: string, tokenSymbol: string, action: 'moon' | 'dust') => {
    e.stopPropagation(); // Prevent navigation
    
    const prediction = action === 'moon' ? 'up' : 'down';
    const selectedToken = tokens?.find(token => token.id === tokenId);
    
    if (!selectedToken) {
      toast.error("Token data not found");
      return;
    }
    
    toast.info(`Navigating to place a ${action === 'moon' ? 'MOON 🚀' : 'DUST 💀'} bet on ${tokenSymbol}`, {
      duration: 2000,
    });
    
    setTimeout(() => {
      navigate(`/token/${tokenId}?bet=${prediction}`);
    }, 300);
  };
  
  // Loading UI
  if (isLoading) {
    return (
      <div className="glass-panel p-5 rounded-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-display font-bold">Loading Tokens...</h2>
          <div className="animate-spin h-5 w-5 text-dream-accent2">
            <RefreshCw size={20} />
          </div>
        </div>
        
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error UI
  if (isError) {
    return (
      <div className="glass-panel p-5 rounded-xl bg-red-500/10 border-red-500/30">
        <div className="text-center py-8">
          <h3 className="text-xl font-display font-medium mb-2 text-red-400">Failed to load tokens</h3>
          <p className="text-dream-foreground/70 mb-4">There was an error fetching the token data</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-dream-foreground/10 hover:bg-dream-foreground/20 rounded-md transition-colors flex items-center mx-auto"
          >
            <RefreshCw size={16} className="mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Main UI
  return (
    <div className="glass-panel p-5 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center mr-3">
            <TrendingUp className="h-5 w-5 text-dream-accent2" />
          </div>
          <h2 className="text-xl font-display font-bold">Hot Migration Tokens</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 px-3 pl-8 bg-dream-foreground/5 border border-dream-foreground/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-dream-accent2/50 focus:border-dream-accent2/50 w-40 md:w-auto"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-2.5 top-2.5 text-dream-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md bg-dream-foreground/5 border border-dream-foreground/10 hover:bg-dream-foreground/10 transition-colors"
            title="Refresh tokens"
          >
            <RefreshCw size={16} className="text-dream-foreground/70" />
          </button>
        </div>
      </div>
      
      {filteredTokens.length === 0 ? (
        <div className="text-center py-10 bg-dream-foreground/5 rounded-lg">
          <p className="text-dream-foreground/50">No tokens found matching your search</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="futuristic-table">
            <thead>
              <tr>
                <th
                  className="cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  Token {getSortIndicator('name')}
                </th>
                <th
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('price')}
                >
                  Price {getSortIndicator('price')}
                </th>
                <th
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('priceChange24h')}
                >
                  24h {getSortIndicator('priceChange24h')}
                </th>
                <th
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('volume24h')}
                >
                  Volume {getSortIndicator('volume24h')}
                </th>
                <th
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('marketCap')}
                >
                  MCAP {getSortIndicator('marketCap')}
                </th>
                <th
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('lastTradeTimestamp')}
                >
                  Last Trade {getSortIndicator('lastTradeTimestamp')}
                </th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token, index) => {
                const tokenStats = bettingStats[token.id];
                const hasActiveBets = tokenStats && tokenStats.totalBets > 0;
                
                return (
                  <tr 
                    key={token.id}
                    onClick={() => handleTokenClick(token.id)}
                    className="cursor-pointer hover:bg-dream-foreground/5"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/10 to-dream-accent3/10 flex items-center justify-center">
                            <img 
                              src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
                              alt={token.name} 
                              className="w-6 h-6"
                            />
                          </div>
                          {index < 3 && (
                            <div className={cn(
                              "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                              index === 0 ? "bg-yellow-500 text-black" : 
                              index === 1 ? "bg-gray-300 text-black" :
                              "bg-amber-700 text-white"
                            )}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">{token.name}</span>
                            {hasActiveBets && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-sm bg-dream-accent2/20 text-dream-accent2 font-medium">
                                HOT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-dream-foreground/50 flex items-center">
                            <span>{token.symbol}</span>
                            <a 
                              href={`https://dexscreener.com/solana/${token.pairAddress || token.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="ml-1.5 text-dream-foreground/30 hover:text-dream-foreground/70"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono">${token.price.toFixed(token.price < 0.01 ? 6 : 4)}</span>
                      {hasActiveBets && (
                        <div className="mt-1 text-[10px] leading-tight bg-dream-foreground/5 rounded p-1 flex flex-col">
                          <div className="flex justify-between items-center">
                            <span>Bets:</span>
                            <span className="font-medium">{tokenStats.totalBets}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <ArrowUp size={8} className="text-green-400 mr-0.5" />
                              <span className="text-green-400">{tokenStats.upBets}</span>
                            </div>
                            <div className="flex items-center">
                              <ArrowDown size={8} className="text-red-400 mr-0.5" />
                              <span className="text-red-400">{tokenStats.downBets}</span>
                            </div>
                          </div>
                          <div className="text-right text-dream-accent2">
                            {formatNumber(tokenStats.volume)} PXB
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={cn(
                      "py-3 px-4 text-right",
                      token.priceChange24h > 0 ? "text-green-400" : "text-red-400"
                    )}>
                      <div className="flex items-center justify-end">
                        {token.priceChange24h > 0 ? (
                          <ArrowUp size={14} className="mr-1" />
                        ) : (
                          <ArrowDown size={14} className="mr-1" />
                        )}
                        {Math.abs(token.priceChange24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(token.volume24h, '$')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatNumber(token.marketCap, '$')}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-dream-foreground/70">
                      {formatTimeAgo(token.lastTradeTimestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn-moon px-2.5 py-1.5 text-xs"
                          onClick={(e) => handleBetAction(e, token.id, token.name, token.symbol, 'moon')}
                        >
                          <img 
                            src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" 
                            alt="Moon" 
                            className="h-3.5 w-3.5 inline-block mr-1" 
                          />
                          <span>MOON</span>
                        </button>
                        <button 
                          className="btn-die px-2.5 py-1.5 text-xs"
                          onClick={(e) => handleBetAction(e, token.id, token.name, token.symbol, 'dust')}
                        >
                          <img 
                            src="/lovable-uploads/d4517df7-78f7-4229-a4d5-0e4cba7bdbf1.png" 
                            alt="Dust" 
                            className="h-3.5 w-3.5 inline-block mr-1" 
                          />
                          <span>DUST</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-xs text-dream-foreground/50 flex justify-between items-center border-t border-dream-foreground/10 pt-4">
        <div>
          Showing {filteredTokens.length} of {tokens?.length || 0} tokens
        </div>
        <div className="flex items-center">
          <Zap size={12} className="text-dream-accent2 mr-1" />
          Auto-refreshes every minute
        </div>
      </div>
    </div>
  );
};

export default MigratingTokenList;
