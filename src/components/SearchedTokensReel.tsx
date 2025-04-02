import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ArrowRight, Zap, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchTopSearchedTokens, fetchRecentlySearchedTokens, SearchedToken } from '@/services/supabaseService';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Define the interface for SearchedToken with market cap data
interface ExtendedSearchedToken extends SearchedToken {
  currentMarketCap?: number;
  priceChange?: number;
  logo?: string;
}

const SearchedTokensReel = () => {
  const [topTokens, setTopTokens] = useState<ExtendedSearchedToken[]>([]);
  const [recentTokens, setRecentTokens] = useState<ExtendedSearchedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const top = await fetchTopSearchedTokens();
        const recent = await fetchRecentlySearchedTokens();

        // Mock market cap and price change data
        const mockTopTokens = top.map(token => ({
          ...token,
          currentMarketCap: Math.floor(Math.random() * 1000000),
          priceChange: Math.random() * 10 - 5,
          logo: '/placeholder-icon.png'
        }));

        const mockRecentTokens = recent.map(token => ({
          ...token,
          currentMarketCap: Math.floor(Math.random() * 1000000),
          priceChange: Math.random() * 10 - 5,
          logo: '/placeholder-icon.png'
        }));

        setTopTokens(mockTopTokens);
        setRecentTokens(mockRecentTokens);
      } catch (error) {
        console.error("Failed to fetch searched tokens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap) return 'N/A';
    return `$${(marketCap / 1000000).toFixed(2)}M`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Address copied to clipboard");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy address");
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground">
          TRENDING TOKENS
        </h2>
        <Button variant="secondary" size="sm" onClick={() => navigate('/search')}>
          <Search className="w-4 h-4 mr-2" />
          Search Tokens
        </Button>
      </div>

      <Tabs defaultValue="top" className="w-full">
        <TabsList className="bg-dream-background/50 backdrop-blur-sm border border-dream-accent1/20 rounded-md w-full flex justify-between">
          <TabsTrigger value="top" className="data-[state=active]:bg-dream-accent1/20 data-[state=active]:text-dream-accent1 w-full rounded-l-md">
            Top Searched
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-dream-accent1/20 data-[state=active]:text-dream-accent1 w-full rounded-r-md">
            Recently Searched
          </TabsTrigger>
        </TabsList>
        <TabsContent value="top" className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-dream-foreground/60">Loading top tokens...</div>
          ) : topTokens.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topTokens.map((token) => (
                <div key={token.token_mint} className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:bg-dream-accent1/5 transition-colors cursor-pointer" onClick={() => navigate(`/token/${token.token_mint}`)}>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img src={token.logo} alt={token.token_name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-dream-foreground flex items-center gap-1">
                        <span className="truncate">{token.token_name}</span>
                        <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-dream-foreground/60">{token.token_symbol || '???'}</div>
                        <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                          <span className="truncate mr-1">{token.token_mint}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(token.token_mint);
                                }} className="hover:text-dream-accent1 transition-colors">
                                  <Copy size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Copy address</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-dream-foreground/60">
                    <div>
                      <Clock className="w-3 h-3 inline-block mr-1" />
                      {formatDistanceToNow(new Date(token.last_searched_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-dream-accent2" />
                      {token.search_count} Searches
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-dream-foreground/60">No top tokens found.</div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-2">
          {loading ? (
            <div className="text-center py-4 text-dream-foreground/60">Loading recent tokens...</div>
          ) : recentTokens.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentTokens.map((token) => (
                <div key={token.token_mint} className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:bg-dream-accent1/5 transition-colors cursor-pointer" onClick={() => navigate(`/token/${token.token_mint}`)}>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img src={token.logo} alt={token.token_name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-dream-foreground flex items-center gap-1">
                        <span className="truncate">{token.token_name}</span>
                        <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-dream-foreground/60">{token.token_symbol || '???'}</div>
                        <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                          <span className="truncate mr-1">{token.token_mint}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(token.token_mint);
                                }} className="hover:text-dream-accent1 transition-colors">
                                  <Copy size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Copy address</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-dream-foreground/60">
                    <div>
                      <Clock className="w-3 h-3 inline-block mr-1" />
                      {formatDistanceToNow(new Date(token.last_searched_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center">
                      <Zap className="w-3 h-3 mr-1 text-dream-accent2" />
                      {token.search_count} Searches
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-dream-foreground/60">No recently searched tokens.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchedTokensReel;
