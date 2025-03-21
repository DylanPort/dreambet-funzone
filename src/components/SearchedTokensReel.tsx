
import React, { useState, useEffect } from 'react';
import { SearchIcon, TrendingUp, ExternalLink, BarChart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { formatAddress } from '@/utils/betUtils';

interface SearchedToken {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  searchCount: number;
  lastSearched: string;
}

const SearchedTokensReel: React.FC = () => {
  const [searchedTokens, setSearchedTokens] = useState<SearchedToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        // Fetch top searched tokens from Supabase
        const { data, error } = await supabase
          .from('token_searches')
          .select(`
            token_mint,
            tokens (token_name, token_symbol),
            search_count,
            last_searched_at
          `)
          .order('search_count', { ascending: false })
          .limit(15);
        
        if (error) {
          console.error('Error fetching searched tokens:', error);
          return;
        }
        
        const formattedTokens = data.map(item => ({
          tokenMint: item.token_mint,
          tokenName: item.tokens?.token_name || 'Unknown Token',
          tokenSymbol: item.tokens?.token_symbol || 'UNKNOWN',
          searchCount: item.search_count,
          lastSearched: item.last_searched_at
        }));
        
        setSearchedTokens(formattedTokens);
      } catch (error) {
        console.error('Error in fetchTokens:', error);
        toast.error('Error loading searched tokens');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();

    // Listen for new searches
    const channel = supabase.channel('public:token_searches').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'token_searches'
    }, () => {
      fetchTokens();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="searched-tokens-container mt-2 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/40 border-r border-white/10 flex items-center">
            <SearchIcon className="h-5 w-5 text-dream-accent1 mr-1.5 animate-pulse" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-500">MOST SEARCHED</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400">Loading most searched tokens...</div>
          </div>
        </div>
      </div>;
  }

  if (searchedTokens.length === 0) {
    return <div className="searched-tokens-container mt-2 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/40 border-r border-white/10 flex items-center">
            <SearchIcon className="h-5 w-5 text-dream-accent1 mr-1.5" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-500">MOST SEARCHED</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400 italic">No search data available</div>
          </div>
        </div>
      </div>;
  }

  const getPopularityColor = (searchCount: number) => {
    if (searchCount > 50) return "text-cyan-400 bg-cyan-500/20";
    if (searchCount > 20) return "text-teal-400 bg-teal-500/20";
    return "text-blue-400 bg-blue-500/20";
  };

  return <div className="searched-tokens-container mt-2 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden py-1.5">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/40 border-r border-white/10 flex items-center">
          <SearchIcon className="h-5 w-5 text-dream-accent1 mr-1.5" />
          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-500">MOST SEARCHED</span>
        </div>
        
        <div className="overflow-hidden mx-4 flex-1">
          <div className="flex gap-4 items-center animate-scroll">
            {searchedTokens.map((token, index) => (
              <Link 
                key={`${token.tokenMint}-${index}`} 
                to={`/token/${token.tokenMint}`} 
                className="flex-shrink-0 flex items-center glass-panel px-3 py-2 rounded-md border border-dream-accent1/30 bg-dream-accent1/5 transition-all duration-500 hover:bg-black/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold text-sm">{token.tokenSymbol.charAt(0)}</span>
                  </div>
                  
                  <div className="mr-3">
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-semibold">{token.tokenName}</div>
                      <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-dream-foreground/60">
                      <span>{token.tokenSymbol}</span>
                      <span className="flex items-center">
                        <span>{formatAddress(token.tokenMint)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    <div className={`flex items-center px-2 py-0.5 rounded-md text-xs ${getPopularityColor(token.searchCount)}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      <span>{token.searchCount} searches</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>;
};

export default SearchedTokensReel;
