
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Flame, BarChart, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from './ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setIsLoading(true);
      try {
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
    
    // Auto scroll through items every 5 seconds
    const interval = setInterval(() => {
      if (trendingTokens.length > 0) {
        setCurrentIndex(prev => (prev + 1) % trendingTokens.length);
      }
    }, 5000);
    
    return () => clearInterval(interval);
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
  
  // Get heat color based on bet count
  const getHeatColor = (betCount: number) => {
    if (betCount > 10) return "from-amber-500 to-red-500";
    if (betCount > 5) return "from-orange-400 to-amber-500";
    return "from-yellow-400 to-orange-400";
  };
  
  // Get heat text based on bet count
  const getHeatText = (betCount: number) => {
    if (betCount > 10) return "Very Hot";
    if (betCount > 5) return "Hot";
    return "Warming Up";
  };
  
  return (
    <>
      {/* Scrolling Reel at top */}
      <div className="mb-4 overflow-hidden bg-gradient-to-r from-dream-accent3/20 to-dream-accent1/20 rounded-xl border border-dream-accent1/30 backdrop-blur-lg p-1">
        <div className="flex items-center gap-2 px-2">
          <div className="flex-shrink-0 px-3 py-1.5 bg-dream-accent3/40 rounded-lg flex items-center">
            <Flame className="h-4 w-4 text-dream-accent2 mr-1.5 animate-pulse" />
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-dream-accent2 to-dream-accent1">TRENDING</span>
          </div>
          
          <div className="overflow-hidden flex-1">
            <div className="flex animate-scroll items-center gap-3">
              {trendingTokens.map((token, index) => (
                <div 
                  key={`${token.token_mint}-${index}`}
                  className="flex-shrink-0 py-1.5 px-3 bg-dream-background/40 rounded-lg border border-dream-accent1/20 flex items-center gap-2 hover:bg-dream-background/60 transition-all duration-300"
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getHeatColor(token.bet_count)} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{token.token_symbol.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{token.token_symbol}</span>
                    <span className="text-[10px] text-dream-foreground/60">{token.bet_count} bets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
      {/* Main Content */}
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl text-dream-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-dream-accent2" />
            <span>Trending Tokens</span>
          </CardTitle>
        </div>

        {/* Carousel for desktop */}
        {!isMobile && (
          <Carousel className="mx-auto max-w-5xl">
            <CarouselContent>
              {visibleTokens.map((token, index) => (
                <CarouselItem key={`${token.token_mint}-${index}`} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-dream-background/70 to-dream-background/40 border border-dream-accent1/10 p-4 h-full backdrop-blur-md hover:border-dream-accent1/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getHeatColor(token.bet_count)} flex items-center justify-center`}>
                            <span className="text-sm font-bold text-white">{token.token_symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-dream-accent2 to-dream-accent1">
                              {token.token_symbol}
                            </div>
                            <div className="text-xs text-dream-foreground/60">{token.token_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-dream-accent3/20 px-2 py-1 rounded-full">
                          <BarChart className="h-3 w-3 text-dream-accent3" />
                          <span>{token.bet_count} bets</span>
                        </div>
                      </div>
                    
                      <div className="space-y-2 mt-3">
                        <div className="bg-dream-background/30 p-3 rounded-lg">
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
                        
                        <div className="flex items-center justify-between gap-2">
                          <div className="bg-dream-background/30 p-3 rounded-lg flex-1">
                            <div className="text-xs text-dream-foreground/60 mb-1">Total Bet Amount</div>
                            <div className="text-sm font-medium text-dream-accent2">
                              {token.total_amount.toFixed(2)} SOL
                            </div>
                          </div>
                        
                          <div className="bg-dream-background/30 p-3 rounded-lg flex-1">
                            <div className="text-xs text-dream-foreground/60 mb-1">Heat Level</div>
                            <div className="flex items-center gap-1.5">
                              <div className={`flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-r ${getHeatColor(token.bet_count)}`}></div>
                              <span className="text-sm font-medium">{getHeatText(token.bet_count)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-dream-background/50 hover:bg-dream-background/80 border-dream-accent1/30 text-dream-accent2" />
            <CarouselNext className="right-0 bg-dream-background/50 hover:bg-dream-background/80 border-dream-accent1/30 text-dream-accent2" />
          </Carousel>
        )}

        {/* Grid for mobile */}
        {isMobile && (
          <div className="space-y-4">
            {visibleTokens.map((token, index) => (
              <div 
                key={`${token.token_mint}-${index}`} 
                className="flex items-center justify-between gap-4 relative z-10 p-4 bg-dream-background/40 rounded-lg border border-dream-accent1/10"
              >
                <div className="flex flex-col space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold text-dream-accent2 flex items-center gap-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r ${getHeatColor(token.bet_count)}`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      {token.token_symbol || 'Unknown'}
                    </div>
                    <div className="text-sm text-dream-foreground/60">
                      {token.token_name || 'Unknown Token'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mt-2">
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
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="bg-dream-foreground/10 p-3 rounded-lg flex-1">
                        <div className="text-xs text-dream-foreground/60 mb-1">Total Bets</div>
                        <div className="flex items-center gap-1.5">
                          <BarChart className="h-3.5 w-3.5 text-dream-accent2" />
                          <span className="text-sm font-medium">{token.bet_count} bets</span>
                        </div>
                      </div>
                    
                      <div className="bg-dream-foreground/10 p-3 rounded-lg flex-1">
                        <div className="text-xs text-dream-foreground/60 mb-1">Heat Level</div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${getHeatColor(token.bet_count)}`}></div>
                          <span className="text-sm font-medium">{getHeatText(token.bet_count)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {trendingTokens.length > 5 && (
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-xs px-4 py-2 flex items-center gap-2 bg-dream-background/40 hover:bg-dream-accent1/10 transition-colors border-dream-accent1/30"
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
    </>
  );
};

export default TrendingBetsList;
