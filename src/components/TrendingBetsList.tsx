
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Flame, BarChart, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface TrendingToken {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  bet_count: number;
  total_amount: number;
}

const TrendingBetsList = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch tokens with the most bets from Supabase
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setIsLoading(true);
      try {
        // Query to get tokens with the most bets
        const { data, error } = await supabase
          .from('bets')
          .select('token_mint, token_name, token_symbol, sol_amount')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching trending tokens:', error);
          toast.error('Failed to load trending tokens');
          setIsLoading(false);
          return;
        }
        
        // Process the data to count bets per token and calculate total bet amount
        const tokenMap = new Map<string, { 
          token_mint: string; 
          token_name: string; 
          token_symbol: string; 
          bet_count: number;
          total_amount: number;
        }>();
        
        data.forEach(bet => {
          if (!bet.token_mint) return;
          
          const existing = tokenMap.get(bet.token_mint);
          if (existing) {
            existing.bet_count += 1;
            existing.total_amount += Number(bet.sol_amount) || 0;
          } else {
            tokenMap.set(bet.token_mint, {
              token_mint: bet.token_mint,
              token_name: bet.token_name || 'Unknown Token',
              token_symbol: bet.token_symbol || 'UNKNOWN',
              bet_count: 1,
              total_amount: Number(bet.sol_amount) || 0
            });
          }
        });
        
        // Convert map to array and sort by bet count (descending)
        const sortedTokens = Array.from(tokenMap.values())
          .sort((a, b) => b.bet_count - a.bet_count);
        
        setTrendingTokens(sortedTokens);
      } catch (err) {
        console.error('Exception in fetchTrendingTokens:', err);
        toast.error('Failed to load trending tokens');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendingTokens();
  }, []);
  
  // Only show the first 5 tokens when not expanded
  const visibleTokens = isExpanded ? trendingTokens : trendingTokens.slice(0, 5);
  
  if (isLoading) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin mr-2">
            <Zap className="h-5 w-5 text-dream-accent2" />
          </div>
          <p className="text-dream-foreground/60">Loading trending tokens...</p>
        </div>
      </Card>
    );
  }
  
  if (trendingTokens.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">
          No bet data available yet
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-xl text-dream-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-dream-accent2" />
          <span>Trending Bets</span>
        </CardTitle>
      </div>

      <div className="space-y-4">
        {visibleTokens.map((token, index) => (
          <div 
            key={`${token.token_mint}-${index}`} 
            className="flex items-center justify-between gap-4 relative z-10 p-4 bg-dream-background/40 rounded-lg border border-dream-accent1/10"
          >
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-dream-accent2 flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-dream-accent2/10 rounded-full text-xs font-bold text-dream-accent2">
                    {index + 1}
                  </div>
                  {token.token_symbol || 'Unknown'}
                </div>
                <div className="text-sm text-dream-foreground/60">
                  {token.token_name || 'Unknown Token'}
                </div>
              </div>
              
              <div className={`grid grid-cols-1 ${isMobile ? "gap-2" : "md:grid-cols-2 gap-3"} mt-2`}>
                <div className="bg-dream-foreground/10 p-3 rounded-lg">
                  <div className="text-xs text-dream-foreground/60 mb-1">Token Contract</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium overflow-hidden text-ellipsis">
                      {formatAddress(token.token_mint)}
                    </div>
                    <a 
                      href={`https://solscan.io/token/${token.token_mint}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0 ml-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                
                <div className="bg-dream-foreground/10 p-3 rounded-lg">
                  <div className="text-xs text-dream-foreground/60 mb-1">Total Bets</div>
                  <div className="flex items-center gap-1.5">
                    <BarChart className="h-3.5 w-3.5 text-dream-accent2" />
                    <span className="text-sm font-medium">{token.bet_count} bets</span>
                  </div>
                </div>
                
                <div className="bg-dream-foreground/10 p-3 rounded-lg">
                  <div className="text-xs text-dream-foreground/60 mb-1">Total Bet Amount</div>
                  <div className="text-sm font-medium">
                    {token.total_amount.toFixed(2)} SOL
                  </div>
                </div>
                
                <div className="bg-dream-foreground/10 p-3 rounded-lg">
                  <div className="text-xs text-dream-foreground/60 mb-1">Heat Score</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${
                      token.bet_count > 10 ? 'bg-red-500' : 
                      token.bet_count > 5 ? 'bg-orange-500' : 
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {token.bet_count > 10 ? 'Very Hot' : 
                       token.bet_count > 5 ? 'Hot' : 
                       'Warming Up'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {trendingTokens.length > 5 && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-xs px-4 py-2 flex items-center gap-2 bg-dream-background/40 hover:bg-dream-accent1/10 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Show All ({trendingTokens.length} Tokens)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default TrendingBetsList;
