import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Clock, Flame, Filter, ArrowUpDown, ChevronDown, Target, Trophy, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Bet, BetStatus } from '@/types/bet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'all' | 'verified'>('all');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('migrating_tokens')
          .select(`
            id,
            token_mint,
            token_name,
            token_symbol,
            creator,
            holders,
            verified,
            created_at,
            status
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching tokens:', error);
          toast.error('Failed to load migrating tokens. Please try again.');
          return;
        }
        
        if (!data || data.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }
        
        const transformedTokens = data.map(token => ({
          id: token.id,
          tokenMint: token.token_mint,
          tokenName: token.token_name || 'Unknown Token',
          tokenSymbol: token.token_symbol || 'UNKNOWN',
          creator: token.creator || 'Unknown',
          holders: token.holders || 0,
          verified: token.verified || false,
          timestamp: new Date(token.created_at).getTime(),
          status: token.status || 'pending'
        }));
        
        setTokens(transformedTokens);
      } catch (error) {
        console.error('Error in fetchTokens:', error);
        toast.error('Failed to load migrating tokens. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
    
    const interval = setInterval(fetchTokens, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const verifiedTokens = tokens.filter(token => token.verified);
  
  const displayTokens = viewMode === 'all' ? tokens : verifiedTokens;
  
  const formatTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-400', text: 'COMPLETED' };
      case 'in_progress':
        return { color: 'text-yellow-400', text: 'IN PROGRESS' };
      case 'pending':
      default:
        return { color: 'text-blue-400', text: 'PENDING' };
    }
  };

  const sortTokens = (tokensToSort: any[]) => {
    const sortedTokens = [...tokensToSort];
    
    switch(sortBy) {
      case 'newest':
        return sortedTokens.sort((a, b) => b.timestamp - a.timestamp);
      case 'oldest':
        return sortedTokens.sort((a, b) => a.timestamp - b.timestamp);
      case 'name-asc':
        return sortedTokens.sort((a, b) => a.tokenName.localeCompare(b.tokenName));
      case 'name-desc':
        return sortedTokens.sort((a, b) => b.tokenName.localeCompare(a.tokenName));
      case 'holders':
        return sortedTokens.sort((a, b) => b.holders - a.holders);
      default:
        return sortedTokens;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Address copied to clipboard");
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy address");
    });
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Flame className="h-8 w-8 text-dream-accent1 mb-2" />
            <p className="text-dream-foreground/60">Loading migrating tokens...</p>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!displayTokens || displayTokens.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="text-center py-8">
          <Target className="mx-auto h-10 w-10 text-dream-accent2 mb-2" />
          <p className="text-dream-foreground/60">
            {viewMode === 'all' 
              ? "No migrating tokens found" 
              : "No verified migrating tokens found"}
          </p>
        </div>
      </Card>
    );
  }

  const renderMobileTokenCards = () => {
    return (
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:ml-0">
          {sortTokens(displayTokens).map((token) => (
            <CarouselItem key={token.id} className="pl-2 md:pl-0 basis-[85%] sm:basis-[60%] md:basis-full">
              <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 h-full hover:bg-dream-accent1/5 transition-colors">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 mr-3 flex items-center justify-center">
                    <img 
                      src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" 
                      alt="Token"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="truncate max-w-[150px]">{token.tokenName || 'Unknown'}</span>
                      <ExternalLink className="w-3 h-3 text-dream-foreground/40 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs text-dream-foreground/60">{token.tokenSymbol || '???'}</div>
                      <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                        <span className="truncate mr-1">{formatAddress(token.tokenMint)}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(token.tokenMint)}
                                className="hover:text-dream-accent1 transition-colors"
                              >
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
                
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm text-dream-foreground/60">Holders</div>
                    <div className="font-medium">{token.holders.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-dream-foreground/60">Status</div>
                    <span className={getStatusDetails(token.status).color}>
                      {getStatusDetails(token.status).text}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="text-xs text-dream-foreground/60 mb-1">Created by</div>
                    <div className="text-sm font-medium overflow-hidden text-ellipsis">
                      {formatAddress(token.creator)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-dream-foreground/60 mb-1">Added</div>
                    <div className="text-sm font-medium flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-dream-foreground/60" />
                      <span>{formatTimeAgo(token.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <button className="btn-accept py-1.5 px-3 text-sm flex items-center gap-1 bg-gradient-to-r from-dream-accent2/20 to-dream-accent2/10 rounded-lg hover:from-dream-accent2/30 hover:to-dream-accent2/20 transition-all">
                    <Trophy className="w-3 h-3" />
                    <span className="text-dream-accent2 font-bold">VIEW DETAILS</span>
                  </button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative inset-auto h-8 w-8" />
            <div className="text-xs text-dream-foreground/60">Swipe for more</div>
            <CarouselNext className="relative inset-auto h-8 w-8" />
          </div>
        </div>
      </Carousel>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-dream-accent1" />
          <span>MIGRATING TOKENS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'verified')} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="all" className="text-xs">All Tokens</TabsTrigger>
              <TabsTrigger value="verified" className="text-xs">Verified Only</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs gap-1.5 h-9"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sort: {sortBy.replace('-', ' ')}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md">
                <DropdownMenuItem 
                  onClick={() => setSortBy('newest')}
                  className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'newest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('oldest')}
                  className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'oldest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                >
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('name-asc')}
                  className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'name-asc' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                >
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('name-desc')}
                  className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'name-desc' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                >
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('holders')}
                  className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'holders' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                >
                  Most Holders
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {isMobile ? (
        renderMobileTokenCards()
      ) : (
        <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
          <Table>
            <TableHeader className="bg-dream-background/50 backdrop-blur-sm">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Holders</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Status</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Creator</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Added</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-dream-accent1/10">
              {sortTokens(displayTokens).map((token) => (
                <TableRow 
                  key={token.id} 
                  className="hover:bg-dream-accent1/5 transition-colors"
                >
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-3 flex items-center justify-center">
                        <img 
                          src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" 
                          alt="Token"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-dream-foreground flex items-center gap-1">
                          <span className="truncate max-w-[150px]">{token.tokenName || 'Unknown'}</span>
                          <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-xs text-dream-foreground/60">{token.tokenSymbol || '???'}</div>
                          <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                            <span className="truncate mr-1">{formatAddress(token.tokenMint)}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => copyToClipboard(token.tokenMint)}
                                    className="hover:text-dream-accent1 transition-colors"
                                  >
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
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-medium">
                    {token.holders.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusDetails(token.status).color} bg-dream-background/40`}>
                      {getStatusDetails(token.status).text}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-xs">
                    {formatAddress(token.creator)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-xs">
                    {formatTimeAgo(token.timestamp)}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex justify-center">
                      <button className="btn-accept py-1 px-2 text-xs flex items-center gap-1 bg-gradient-to-r from-dream-accent2/20 to-dream-accent2/10 rounded-lg hover:from-dream-accent2/30 hover:to-dream-accent2/20 transition-all">
                        <Trophy className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {viewMode === 'verified' && verifiedTokens.length > 0 && (
        <div className="mt-4 text-xs text-dream-foreground/60 flex items-center">
          <Flame className="h-3.5 w-3.5 mr-1.5 text-dream-accent1" />
          <span>Showing {verifiedTokens.length} verified tokens</span>
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
