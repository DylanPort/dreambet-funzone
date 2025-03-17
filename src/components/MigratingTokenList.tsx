import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, ArrowUp, ArrowDown, Clock, Users, BarChart, Trophy, XCircle, Activity, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface MigratingToken {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  currentPrice: number;
  change24h: number;
  migrationTime: number;
}

const MigratingTokenList: React.FC = () => {
  const [tokens, setTokens] = useState<MigratingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'migrationTime' | 'change24h'>('migrationTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    data: migratingTokens = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['migratingTokens'],
    queryFn: async () => {
      console.log('Fetching migrating tokens from Supabase...');
      try {
        const tokens = await fetchMigratingTokens();
        console.log('MigratingTokenList - Fetched tokens:', tokens);
        return tokens;
      } catch (err) {
        console.error('Error fetching migrating tokens:', err);
        throw err;
      }
    },
    refetchInterval: 60000
  });

  useEffect(() => {
    setTokens(migratingTokens);
  }, [migratingTokens]);

  useEffect(() => {
    const sortTokens = () => {
      const sortedTokens = [...tokens];
      sortedTokens.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'migrationTime') {
          comparison = a.migrationTime - b.migrationTime;
        } else if (sortBy === 'change24h') {
          comparison = a.change24h - b.change24h;
        }
        return sortOrder === 'asc' ? comparison : comparison * -1;
      });
      setTokens(sortedTokens);
    };

    sortTokens();
  }, [sortBy, sortOrder, tokens]);

  const handleSort = (newSortBy: 'migrationTime' | 'change24h') => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (column: 'migrationTime' | 'change24h') => {
    if (column === sortBy) {
      return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
    }
    return null;
  };

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || isNaN(marketCap)) return 'N/A';
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  if (isLoading) {
    return <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-dream-accent1" />
            <span>MIGRATING TOKENS</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
              <span className="font-medium">Sort By</span>
            </div>
            
            <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
              <TrendingUp className="w-4 h-4 text-dream-accent2" />
              <span>Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-8 bg-gray-700/50 rounded"></div>
            </div>)}
        </div>
      </div>;
  }

  if (error) {
    return <div className="glass-panel p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load migrating tokens</p>
        <p className="text-dream-foreground/60 text-sm">
          There was an error fetching the migrating tokens. Please try again later.
        </p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-dream-accent1/20 border border-dream-accent1/30 text-dream-accent1 rounded-md flex items-center mx-auto">
          <Clock className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>;
  }

  return <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-dream-accent1" />
          <span>MIGRATING TOKENS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <button onClick={() => handleSort('migrationTime')} className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30 transition-colors hover:border-dream-accent1">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Migration Time</span>
            {getSortIndicator('migrationTime')}
          </button>
          
          <button onClick={() => handleSort('change24h')} className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20 transition-colors hover:border-dream-accent2">
            <TrendingUp className="w-4 h-4 text-dream-accent2" />
            <span>24h Change</span>
            {getSortIndicator('change24h')}
          </button>
        </div>
      </div>

      {tokens.length === 0 ? <div className="glass-panel p-6 text-center">
          <p className="text-dream-foreground/80 mb-2">No migrating tokens available</p>
          <p className="text-dream-foreground/60 text-sm">
            Check back later for a list of tokens migrating to our platform.
          </p>
        </div> : <div className="space-y-4">
          {tokens.map(token => <Link to={`/token/${token.id}`} key={token.id} className="block">
                <div className="glass-panel p-4 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 via-[#2a203e]/10 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:via-[#2a203e]/20 group-hover:to-dream-accent3/10 transition-all duration-500 animate-pulse-slow">
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                      <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
                  
                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                        <span className="font-display font-bold text-lg">{token.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-display font-semibold text-lg">{token.name}</h3>
                          <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
                        </div>
                        <p className="text-dream-foreground/60 text-sm">{token.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium">{token.currentPrice.toFixed(4)}</p>
                        <p className={`text-xs font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change24h >= 0 ? <ArrowUp className="w-3 h-3 inline mr-1" /> : <ArrowDown className="w-3 h-3 inline mr-1" />}
                          {token.change24h.toFixed(2)}%
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-dream-foreground/60">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDistanceToNow(token.migrationTime)} ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>)}
        </div>}
    </div>;
};

export default MigratingTokenList;
