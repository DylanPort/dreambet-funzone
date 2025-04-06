
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ExternalLink, DollarSign, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTokenImage } from '@/services/moralisService';
import { motion } from 'framer-motion';

interface TrendingToken {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  tradeCount: number;
  totalAmount: number;
  imageUrl?: string | null;
  imageLoading?: boolean;
}

const TrendingTokensList = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trending tokens based on trades
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('token_transactions')
          .select('tokenid, tokenname, tokensymbol, count(*), sum(pxbamount)')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .group('tokenid, tokenname, tokensymbol')
          .order('count', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching trending tokens:', error);
          setLoading(false);
          return;
        }

        const tokens: TrendingToken[] = data.map(item => ({
          tokenMint: item.tokenid,
          tokenName: item.tokenname,
          tokenSymbol: item.tokensymbol,
          tradeCount: parseInt(item.count),
          totalAmount: parseFloat(item.sum),
          imageLoading: true
        }));

        setTrendingTokens(tokens);

        // Fetch token images
        tokens.forEach(async (token, index) => {
          try {
            const imageUrl = await fetchTokenImage(token.tokenMint, token.tokenSymbol);
            
            setTrendingTokens(current => {
              const updated = [...current];
              updated[index] = {
                ...updated[index],
                imageUrl,
                imageLoading: false
              };
              return updated;
            });
          } catch (err) {
            setTrendingTokens(current => {
              const updated = [...current];
              updated[index] = {
                ...updated[index],
                imageLoading: false
              };
              return updated;
            });
          }
        });
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();

    // Set up realtime subscription
    const channel = supabase
      .channel('token-trades')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'token_transactions' },
        () => {
          fetchTrendingTokens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateColorFromSymbol = (symbol: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-dream-accent1" />
            <span>Trending Tokens</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-dream-accent1" />
          <span>Trending Tokens</span>
        </h2>
      </div>

      {trendingTokens.length === 0 ? (
        <div className="text-center py-6 text-dream-foreground/70">
          <p>No trading activity in the last 24 hours</p>
          <p className="text-sm mt-2">Be the first to trade tokens with PXB Points!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingTokens.map((token, index) => {
            const colorGradient = generateColorFromSymbol(token.tokenSymbol);
            
            return (
              <motion.div
                key={token.tokenMint}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  to={`/token/${token.tokenMint}`}
                  className="block bg-black/20 border border-white/10 rounded-lg p-4 hover:bg-black/30 transition-colors hover:border-dream-accent1/30"
                >
                  <div className="flex items-center gap-3">
                    {token.imageLoading ? (
                      <Skeleton className="w-10 h-10 rounded-full" />
                    ) : token.imageUrl ? (
                      <Avatar className="w-10 h-10 border border-white/10">
                        <AvatarImage src={token.imageUrl} alt={token.tokenSymbol} />
                        <AvatarFallback className={`bg-gradient-to-br ${colorGradient}`}>
                          {token.tokenSymbol.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white font-bold`}>
                        {token.tokenSymbol.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold">{token.tokenName}</span>
                        <ExternalLink className="h-3 w-3 ml-1 text-dream-foreground/40" />
                      </div>
                      <div className="text-sm text-dream-foreground/60">{token.tokenSymbol}</div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-xs bg-dream-accent2/10 px-2 py-1 rounded text-dream-accent2">
                        <Activity className="h-3 w-3 mr-1" />
                        <span>{token.tradeCount} trades</span>
                      </div>
                      <div className="text-xs text-dream-foreground/60 mt-1">
                        {token.totalAmount.toLocaleString()} PXB
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrendingTokensList;
