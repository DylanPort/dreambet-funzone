
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingToken {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  search_count: number;
  volume_24h?: number;
  current_market_cap?: number;
}

const TrendingTokensList: React.FC = () => {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setLoading(true);
        
        // Get tokens that have been searched the most in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Query the token_searches table
        const { data, error } = await supabase
          .from('token_searches')
          .select('token_mint, token_name, token_symbol, search_count')
          .gt('last_searched_at', sevenDaysAgo.toISOString())
          .order('search_count', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error('Error fetching trending tokens:', error);
          setLoading(false);
          return;
        }
        
        setTokens(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No trending tokens found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tokens.map((token, index) => (
        <Link
          key={token.token_mint}
          to={`/token/${token.token_mint}`}
          className="flex items-center p-3 rounded-lg hover:bg-indigo-950/20 transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
            {index + 1}
          </div>
          <Avatar className="h-10 w-10 ml-3">
            <AvatarImage 
              src={`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.token_mint}/logo.png`} 
              alt={token.token_name} 
            />
            <AvatarFallback className="bg-indigo-900/50 text-indigo-200">
              {token.token_symbol.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="font-medium text-white">{token.token_name}</div>
            <div className="text-xs text-indigo-300/70">{token.token_symbol}</div>
          </div>
          <div className="ml-auto text-sm text-indigo-300">
            {token.search_count} searches
          </div>
        </Link>
      ))}
    </div>
  );
};

export default TrendingTokensList;
