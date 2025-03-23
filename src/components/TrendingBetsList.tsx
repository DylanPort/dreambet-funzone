
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, BarChart, ChevronDown, ChevronUp, Zap, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from './ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { fetchTokenImage } from '@/services/moralisService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingToken {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  bet_count: number;
  total_amount: number;
  moon_bets: number;
  die_bets: number;
  image_url?: string;
}

const TrendingBetsList = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tokenImages, setTokenImages] = useState<Record<string, string | null>>({});
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setIsLoading(true);
      try {
        const {
          data,
          error
        } = await supabase.from('bets').select('token_mint, token_name, token_symbol, sol_amount, prediction_bettor1').order('created_at', {
          ascending: false
        });
        if (error) {
          console.error('Error fetching trending tokens:', error);
          toast.error('Failed to load trending tokens');
          setIsLoading(false);
          return;
        }
        const tokenMap = new Map<string, {
          token_mint: string;
          token_name: string;
          token_symbol: string;
          bet_count: number;
          total_amount: number;
          moon_bets: number;
          die_bets: number;
        }>();
        data.forEach(bet => {
          if (!bet.token_mint) return;
          const existing = tokenMap.get(bet.token_mint);
          if (existing) {
            existing.bet_count += 1;
            existing.total_amount += Number(bet.sol_amount) || 0;
            if (bet.prediction_bettor1 === 'up') {
              existing.moon_bets += 1;
            } else if (bet.prediction_bettor1 === 'down') {
              existing.die_bets += 1;
            }
          } else {
            let moonBets = 0;
            let dieBets = 0;
            if (bet.prediction_bettor1 === 'up') {
              moonBets = 1;
            } else if (bet.prediction_bettor1 === 'down') {
              dieBets = 1;
            }
            tokenMap.set(bet.token_mint, {
              token_mint: bet.token_mint,
              token_name: bet.token_name || 'Unknown Token',
              token_symbol: bet.token_symbol || 'UNKNOWN',
              bet_count: 1,
              total_amount: Number(bet.sol_amount) || 0,
              moon_bets: moonBets,
              die_bets: dieBets
            });
          }
        });
        const sortedTokens = Array.from(tokenMap.values()).sort((a, b) => b.bet_count - a.bet_count);
        setTrendingTokens(sortedTokens);
        
        // Initialize loading state for all tokens
        const newImagesLoading: Record<string, boolean> = {};
        sortedTokens.forEach(token => {
          newImagesLoading[token.token_mint] = true;
        });
        setImagesLoading(newImagesLoading);
        
        // Fetch token images
        sortedTokens.forEach(token => {
          fetchTokenImage(token.token_mint, token.token_symbol)
            .then(imageUrl => {
              setTokenImages(prev => ({
                ...prev,
                [token.token_mint]: imageUrl
              }));
              setImagesLoading(prev => ({
                ...prev,
                [token.token_mint]: false
              }));
            })
            .catch(() => {
              setImagesLoading(prev => ({
                ...prev,
                [token.token_mint]: false
              }));
            });
        });
      } catch (err) {
        console.error('Exception in fetchTrendingTokens:', err);
        toast.error('Failed to load trending tokens');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrendingTokens();
    const interval = setInterval(() => {
      if (trendingTokens.length > 0) {
        setCurrentIndex(prev => (prev + 1) % trendingTokens.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const visibleTokens = isExpanded ? trendingTokens : trendingTokens.slice(0, 5);
  
  const renderTokenAvatar = (token: TrendingToken) => {
    const imageUrl = tokenImages[token.token_mint];
    const isLoading = imagesLoading[token.token_mint];
    
    if (isLoading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    
    if (imageUrl) {
      return (
        <Avatar className="h-8 w-8 border border-dream-accent1/30">
          <AvatarImage src={imageUrl} alt={token.token_symbol} />
          <AvatarFallback className={`bg-gradient-to-br ${getHeatColor(token.bet_count)}`}>
            {token.token_symbol.charAt(0)}
          </AvatarFallback>
        </Avatar>
      );
    }
    
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getHeatColor(token.bet_count)} flex items-center justify-center`}>
        <span className="text-sm font-bold text-white">{token.token_symbol.charAt(0)}</span>
      </div>
    );
  };

  if (isLoading) {
    return <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin mr-2">
            <Zap className="h-5 w-5 text-dream-accent2" />
          </div>
          <p className="text-dream-foreground/60">Loading trending tokens...</p>
        </div>
      </Card>;
  }

  if (trendingTokens.length === 0) {
    return <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">
          No bet data available yet
        </p>
      </Card>;
  }

  const getHeatColor = (betCount: number) => {
    if (betCount > 10) return "from-amber-500 to-red-500";
    if (betCount > 5) return "from-orange-400 to-amber-500";
    return "from-yellow-400 to-orange-400";
  };

  const getHeatText = (betCount: number) => {
    if (betCount > 10) return "Very Hot";
    if (betCount > 5) return "Hot";
    return "Warming Up";
  };

  return <>
      <div className="mb-2 overflow-hidden bg-gradient-to-r from-dream-accent3/20 to-dream-accent1/20 rounded-lg border border-dream-accent1/30 backdrop-blur-lg">
        <div className="flex items-center gap-1 px-1">
          <div className="flex-shrink-0 py-1 px-2 bg-dream-accent3/40 rounded-lg flex items-center">
            <img src="/lovable-uploads/7367ad18-8501-4cb1-9eb2-79a2aa97c082.png" alt="Fire" className="h-10 w-10 mr-1 animate-pulse" />
            <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500">TRENDING</span>
          </div>
          
          <div className="overflow-hidden flex-1">
            <div className="flex animate-scroll items-center gap-2">
              {trendingTokens.map((token, index) => <div key={`${token.token_mint}-${index}`} className="flex-shrink-0 py-1 px-2 bg-dream-background/40 rounded-lg border border-dream-accent1/20 flex items-center gap-1 hover:bg-dream-background/60 transition-all duration-300">
                  {renderTokenAvatar(token)}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{token.token_symbol}</span>
                    <span className="text-[10px] text-dream-foreground/60">{token.bet_count} bets</span>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl text-dream-foreground flex items-center gap-2">
            <span>TRENDING BETS</span>
          </CardTitle>
          
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs bg-dream-background/40 border-dream-accent1/20 hover:bg-dream-background/60 hover:border-dream-accent1/40">
            {isExpanded ? <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Show Less</> : <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Show All</>}
          </Button>
        </div>

        {!isMobile && <Carousel className="mx-auto max-w-5xl">
            <CarouselContent>
              {visibleTokens.map((token, index) => <CarouselItem key={`${token.token_mint}-${index}`} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Link to={`/token/${token.token_mint}`} className="block">
                      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-dream-background/70 to-dream-background/40 border border-dream-accent1/10 p-4 h-full backdrop-blur-md hover:border-dream-accent1/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {renderTokenAvatar(token)}
                            <div>
                              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500">
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
                              <a href={`https://solscan.io/token/${token.token_mint}`} target="_blank" rel="noopener noreferrer" className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0 ml-1">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                                <span className="text-dream-foreground/60">Total Volume</span>
                                <span className="font-medium text-[#59ef02]">{token.total_amount.toFixed(2)} PXB</span>
                              </div>
                              <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <ArrowUp className="h-3 w-3 text-green-400" />
                                  <span className="text-dream-foreground/60">Moon</span>
                                </div>
                                <span className="font-medium text-green-400">{token.moon_bets}</span>
                              </div>
                              <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <ArrowDown className="h-3 w-3 text-red-400" />
                                  <span className="text-dream-foreground/60">Die</span>
                                </div>
                                <span className="font-medium text-red-400">{token.die_bets}</span>
                              </div>
                            </div>
                          </div>
                        
                          <div className="flex items-center justify-between gap-2">
                            <div className="bg-dream-background/30 p-3 rounded-lg flex-1">
                              <div className="text-xs text-dream-foreground/60 mb-1">Total Bet Amount</div>
                              <div className="text-sm font-medium text-dream-accent2 bg-[#022202]">
                                {token.total_amount.toFixed(2)} PXB
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
                    </Link>
                  </div>
                </CarouselItem>)}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-dream-background/50 hover:bg-dream-background/80 border-dream-accent1/30 text-dream-accent2" />
            <CarouselNext className="right-0 bg-dream-background/50 hover:bg-dream-background/80 border-dream-accent1/30 text-dream-accent2" />
          </Carousel>}

        {isMobile && <div className="relative">
            <button onClick={scrollLeft} className="scroll-button scroll-button-left z-10 absolute top-1/2 -translate-y-1/2 left-0 h-8 w-8 flex items-center justify-center bg-dream-background/50 hover:bg-dream-background/70 border border-dream-accent1/20 rounded-full" aria-label="Scroll left" type="button">
              <ChevronLeft className="h-4 w-4 text-dream-accent2" />
            </button>
            <button onClick={scrollRight} className="scroll-button scroll-button-right z-10 absolute top-1/2 -translate-y-1/2 right-0 h-8 w-8 flex items-center justify-center bg-dream-background/50 hover:bg-dream-background/70 border border-dream-accent1/20 rounded-full" aria-label="Scroll right" type="button">
              <ChevronRight className="h-4 w-4 text-dream-accent2" />
            </button>
            
            <div className="overflow-x-auto px-2 pb-4 scrollbar-hide" ref={scrollRef}>
              <div className="flex space-x-4 pb-2">
                {visibleTokens.map((token, index) => <Link key={`${token.token_mint}-${index}`} to={`/token/${token.token_mint}`} className="flex-shrink-0 w-[280px]">
                    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-dream-background/70 to-dream-background/40 border border-dream-accent1/10 p-4 h-full backdrop-blur-md hover:border-dream-accent1/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {renderTokenAvatar(token)}
                          <div>
                            <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500">
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
                            <a href={`https://solscan.io/token/${token.token_mint}`} target="_blank" rel="noopener noreferrer" className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0 ml-1">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                              <span className="text-dream-foreground/60">Total Volume</span>
                              <span className="font-medium text-dream-accent2">{token.total_amount.toFixed(2)} PXB</span>
                            </div>
                            <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <ArrowUp className="h-3 w-3 text-green-400" />
                                <span className="text-dream-foreground/60">Moon</span>
                              </div>
                              <span className="font-medium text-green-400">{token.moon_bets}</span>
                            </div>
                            <div className="bg-dream-background/20 p-2 rounded-lg flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <ArrowDown className="h-3 w-3 text-red-400" />
                                <span className="text-dream-foreground/60">Die</span>
                              </div>
                              <span className="font-medium text-red-400">{token.die_bets}</span>
                            </div>
                          </div>
                        </div>
                      
                        <div className="flex items-center justify-between gap-2">
                          <div className="bg-dream-background/30 p-3 rounded-lg flex-1">
                            <div className="text-xs text-dream-foreground/60 mb-1">Total Bet Amount</div>
                            <div className="text-sm font-medium text-dream-accent2">
                              {token.total_amount.toFixed(2)} PXB
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
                  </Link>)}
              </div>
            </div>
          </div>}
        
        {isMobile && trendingTokens.length > 5 && <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs bg-dream-background/40 border-dream-accent1/20 hover:bg-dream-background/60 hover:border-dream-accent1/40">
              {isExpanded ? <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Show Less</> : <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Show All</>}
            </Button>
          </div>}
      </Card>
    </>;
};
export default TrendingBetsList;
