import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bet } from '@/types/bet';
import { fetchOpenBets, fetchTrendingTokens, fetchTopSearchedTokens, fetchRecentlySearchedTokens } from '@/services/supabaseService';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchedToken } from '@/types/token-search';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrendingToken {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betCount: number;
  totalAmount: number;
}

interface TrendingBetsListProps {
  className?: string;
}

export const TrendingBetsList: React.FC<TrendingBetsListProps> = ({ className }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [topSearchedTokens, setTopSearchedTokens] = useState<SearchedToken[]>([]);
  const [recentlySearchedTokens, setRecentlySearchedTokens] = useState<SearchedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const topSearchedRef = useRef<HTMLDivElement>(null);
  const recentSearchedRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();

  const itemsPerSlide = isMobile ? 1 : 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const openBets = await fetchOpenBets();
        setBets(openBets);
        
        const trending = await fetchTrendingTokens(10);
        setTrendingTokens(trending);
        
        const topSearched = await fetchTopSearchedTokens(10);
        setTopSearchedTokens(topSearched);
        
        const recentlySearched = await fetchRecentlySearchedTokens(10);
        setRecentlySearchedTokens(recentlySearched);
      } catch (error) {
        console.error('Error fetching trending data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const scrollCarousel = (direction: 'next' | 'prev', ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const container = ref.current;
    const scrollAmount = direction === 'next' ? container.clientWidth : -container.clientWidth;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  const formatNumber = (num: number): string => {
    if (num % 1 === 0) return num.toString();
    return num.toFixed(2);
  };

  const getBetsForToken = (tokenMint: string): Bet[] => {
    return bets.filter(bet => bet.tokenMint === tokenMint);
  };

  return (
    <Card className={`w-full h-auto overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle>Trending on BetReel</CardTitle>
        <CardDescription>Track the most active tokens and betting activity</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center px-6">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="trending">Top Bets</TabsTrigger>
            <TabsTrigger value="most-searched">Most Searched</TabsTrigger>
            <TabsTrigger value="recently-searched">Recently Searched</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-2 px-2">
          <TabsContent value="trending" className="mt-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : trendingTokens.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {trendingTokens.map((token, index) => (
                  <Link
                    key={token.tokenMint}
                    to={`/token/${token.tokenMint}`}
                    className="block"
                  >
                    <div className="bg-background/50 rounded-lg p-4 hover:bg-muted/50 transition-colors border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold mr-2">{token.tokenSymbol}</span>
                          <Badge variant="outline" className="text-xs">
                            Rank #{index + 1}
                          </Badge>
                        </div>
                        <span className="text-sm opacity-70">{token.betCount} bets</span>
                      </div>
                      <p className="text-sm truncate mb-1" title={token.tokenName}>
                        {token.tokenName}
                      </p>
                      <div className="text-xs opacity-70">
                        {formatNumber(token.totalAmount)} SOL in active bets
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trending tokens found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="most-searched" className="mt-0 relative">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : topSearchedTokens.length > 0 ? (
              <>
                <div 
                  ref={topSearchedRef}
                  className="flex overflow-x-auto gap-3 pt-2 pb-4 px-2 no-scrollbar snap-x"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {topSearchedTokens.map((token, index) => (
                    <Link
                      key={token.token_mint}
                      to={`/token/${token.token_mint}`}
                      className="block min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start"
                    >
                      <div className="bg-background/50 rounded-lg p-4 hover:bg-muted/50 transition-colors border border-border h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg font-semibold mr-2">{token.token_symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              Rank #{index + 1}
                            </Badge>
                          </div>
                          <span className="text-sm opacity-70">{token.search_count} searches</span>
                        </div>
                        <p className="text-sm truncate mb-1" title={token.token_name}>
                          {token.token_name}
                        </p>
                        <div className="text-xs opacity-70">
                          Last searched {new Date(token.last_searched_at || '').toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-end mt-2 px-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => scrollCarousel('prev', topSearchedRef)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => scrollCarousel('next', topSearchedRef)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No search data available yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recently-searched" className="mt-0 relative">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : recentlySearchedTokens.length > 0 ? (
              <>
                <div 
                  ref={recentSearchedRef}
                  className="flex overflow-x-auto gap-3 pt-2 pb-4 px-2 no-scrollbar snap-x"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {recentlySearchedTokens.map((token) => (
                    <Link
                      key={token.token_mint}
                      to={`/token/${token.token_mint}`}
                      className="block min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start"
                    >
                      <div className="bg-background/50 rounded-lg p-4 hover:bg-muted/50 transition-colors border border-border h-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-semibold">{token.token_symbol}</span>
                          <span className="text-sm opacity-70">{token.search_count} searches</span>
                        </div>
                        <p className="text-sm truncate mb-1" title={token.token_name}>
                          {token.token_name}
                        </p>
                        <div className="text-xs opacity-70">
                          Searched {new Date(token.last_searched_at || '').toLocaleString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex justify-end mt-2 px-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => scrollCarousel('prev', recentSearchedRef)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => scrollCarousel('next', recentSearchedRef)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent searches found</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default TrendingBetsList;
