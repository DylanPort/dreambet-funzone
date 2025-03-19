import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress, formatNumberWithCommas } from '@/utils/betUtils';
import { ExternalLink, Clock, Flame, Filter, ArrowUpDown, ChevronDown, Target, Trophy, Zap, Coins, TrendingUp, BarChart2, Users, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { fetchOpenBets } from '@/services/supabaseService';
import { toast } from "sonner";
import { Bet, BetStatus } from '@/types/bet';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const MigratingTokenList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalBets, setTotalBets] = useState<number>(0);
  const [upVotes, setUpVotes] = useState<number>(0);
  const [downVotes, setDownVotes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'all' | 'highValue'>('all');
  const isMobile = useIsMobile();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Address copied to clipboard");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy address");
    });
  };
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const fetchedBets = await fetchOpenBets();
        setBets(fetchedBets);
        const betTotal = fetchedBets.length;
        const valueTotal = fetchedBets.reduce((sum, bet) => sum + bet.amount, 0);
        const upPredictions = fetchedBets.filter(bet => bet.prediction === 'migrate' || bet.prediction === 'up').length;
        const downPredictions = fetchedBets.filter(bet => bet.prediction === 'die' || bet.prediction === 'down').length;
        setTotalBets(betTotal);
        setTotalValue(valueTotal);
        setUpVotes(upPredictions);
        setDownVotes(downPredictions);
        const {
          data: tokensData,
          error: tokensError
        } = await supabase.from('tokens').select('*').order('last_updated_time', {
          ascending: false
        });
        if (tokensError) {
          console.error('Error fetching tokens:', tokensError);
        } else {
          setTokens(tokensData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load betting data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, []);
  const highValueBets = bets.filter(bet => bet.amount >= 1);
  const displayBets = viewMode === 'all' ? bets : highValueBets;
  const formatTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true
    });
  };
  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const timeRemaining = expiresAt - now;
    if (timeRemaining <= 0) {
      return 'Expired';
    }
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor(timeRemaining % (1000 * 60 * 60) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };
  const getPredictionDetails = (prediction: string) => {
    switch (prediction) {
      case 'migrate':
      case 'up':
      case 'moon':
        return {
          color: 'text-green-400',
          text: 'MOON',
          bgColor: 'bg-green-400/10'
        };
      case 'die':
      case 'down':
        return {
          color: 'text-red-400',
          text: 'DIE',
          bgColor: 'bg-red-400/10'
        };
      default:
        return {
          color: 'text-yellow-400',
          text: prediction.toUpperCase(),
          bgColor: 'bg-yellow-400/10'
        };
    }
  };
  const getTokenDetails = (tokenMint: string) => {
    return tokens.find(token => token.token_mint === tokenMint) || null;
  };
  const sortBets = (betsToSort: Bet[]) => {
    const bets = [...betsToSort];
    switch (sortBy) {
      case 'newest':
        return bets.sort((a, b) => b.timestamp - a.timestamp);
      case 'oldest':
        return bets.sort((a, b) => a.timestamp - b.timestamp);
      case 'amount-high':
        return bets.sort((a, b) => b.amount - a.amount);
      case 'amount-low':
        return bets.sort((a, b) => a.amount - b.amount);
      case 'expiring-soon':
        return bets.sort((a, b) => a.expiresAt - b.expiresAt);
      default:
        return bets;
    }
  };
  if (loading) {
    return <div className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Flame className="h-8 w-8 text-dream-accent1 mb-2" />
            <p className="text-dream-foreground/60">Loading active bets...</p>
          </div>
        </div>
      </div>;
  }
  const renderStats = () => {
    const totalVotes = upVotes + downVotes;
    const upPercentage = totalVotes > 0 ? Math.round(upVotes / totalVotes * 100) : 50;
    const downPercentage = totalVotes > 0 ? 100 - upPercentage : 50;
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:bg-dream-accent1/5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-dream-foreground/60">Total Bets</h3>
              <p className="text-2xl font-bold">{totalBets}</p>
            </div>
            <Zap className="h-8 w-8 text-dream-accent1/60" />
          </div>
        </div>
        
        <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:bg-dream-accent1/5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-dream-foreground/60">Total Value</h3>
              <p className="text-2xl font-bold">{formatNumberWithCommas(totalValue)} PXB</p>
            </div>
            <Coins className="h-8 w-8 text-dream-accent2/60" />
          </div>
        </div>
        
        <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:bg-dream-accent1/5 transition-colors col-span-1 sm:col-span-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-dream-foreground/60">Prediction Distribution</h3>
              <BarChart2 className="h-5 w-5 text-dream-foreground/40" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={upPercentage} className="h-2 bg-dream-background/40" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-dream-foreground/70">{upPercentage}%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1">
                <Progress value={downPercentage} className="h-2 bg-dream-background/40" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium text-dream-foreground/70">{downPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  const renderMobileBetCards = () => {
    return <Carousel opts={{
      align: "start",
      loop: false
    }} className="w-full">
        <CarouselContent className="-ml-2 md:ml-0">
          {sortBets(displayBets).map(bet => {
          const tokenDetails = getTokenDetails(bet.tokenMint);
          const {
            color,
            text,
            bgColor
          } = getPredictionDetails(bet.prediction);
          return <CarouselItem key={bet.id} className="pl-2 md:pl-0 basis-[85%] sm:basis-[60%] md:basis-full">
                <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 h-full hover:bg-dream-accent1/5 transition-colors">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 mr-3 flex items-center justify-center">
                      <img src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" alt="Token" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-dream-foreground flex items-center gap-1">
                        <span className="truncate max-w-[150px]">{bet.tokenName || 'Unknown'}</span>
                        <ExternalLink className="w-3 h-3 text-dream-foreground/40 flex-shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs text-dream-foreground/60">{bet.tokenSymbol || '???'}</div>
                        <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                          <span className="truncate mr-1">{formatAddress(bet.tokenMint)}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => copyToClipboard(bet.tokenMint)} className="hover:text-dream-accent1 transition-colors">
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
                    <Badge className={`${bgColor} ${color} border-none`}>
                      {text}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-sm text-dream-foreground/60">Bet Amount</div>
                      <div className="font-medium">{bet.amount} PXB</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-dream-foreground/60">Status</div>
                      <Badge variant="outline" className="border-dream-accent1/30">
                        {bet.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="text-xs text-dream-foreground/60 mb-1">Initiated by</div>
                      <div className="text-sm font-medium overflow-hidden text-ellipsis">
                        {formatAddress(bet.initiator)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-dream-foreground/60 mb-1">Time Remaining</div>
                      <div className="text-sm font-medium flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-dream-foreground/60" />
                        <span>{formatTimeRemaining(bet.expiresAt)}</span>
                      </div>
                    </div>
                    
                    {tokenDetails && <div>
                        <div className="text-xs text-dream-foreground/60 mb-1">Market Cap</div>
                        <div className="text-sm font-medium flex items-center">
                          <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-dream-foreground/60" />
                          <span>${formatNumberWithCommas(tokenDetails.current_market_cap)}</span>
                        </div>
                      </div>}
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <button className="btn-accept py-1.5 px-3 text-sm flex items-center gap-1 bg-gradient-to-r from-dream-accent2/20 to-dream-accent2/10 rounded-lg hover:from-dream-accent2/30 hover:to-dream-accent2/20 transition-all">
                      <Trophy className="w-3 h-3" />
                      <span className="text-dream-accent2 font-bold">CHALLENGE</span>
                    </button>
                  </div>
                </div>
              </CarouselItem>;
        })}
        </CarouselContent>
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative inset-auto h-8 w-8" />
            <div className="text-xs text-dream-foreground/60">Swipe for more</div>
            <CarouselNext className="relative inset-auto h-8 w-8" />
          </div>
        </div>
      </Carousel>;
  };
  if (!displayBets || displayBets.length === 0) {
    return <div className="space-y-5">
        {renderStats()}
        <div className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
          <div className="text-center py-8">
            <Target className="mx-auto h-10 w-10 text-dream-accent2 mb-2" />
            <p className="text-dream-foreground/60">
              {viewMode === 'all' ? "No active bets found" : "No bets above 1 PXB found"}
            </p>
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-5">
      {renderStats()}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-dream-accent1" />
          <span>ACTIVE BETS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={value => setViewMode(value as 'all' | 'highValue')} className="w-auto">
            
          </Tabs>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sort: {sortBy.replace('-', ' ')}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md">
                <DropdownMenuItem className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'newest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'oldest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'amount-high' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy('amount-high')}>
                  Amount: High to Low
                </DropdownMenuItem>
                <DropdownMenuItem className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'amount-low' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy('amount-low')}>
                  Amount: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'expiring-soon' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy('expiring-soon')}>
                  Expiring Soon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {isMobile ? renderMobileBetCards() : <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
          <Table>
            <TableHeader className="bg-dream-background/50 backdrop-blur-sm">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Amount</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Prediction</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Status</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Initiator</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Time Remaining</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-dream-accent1/10">
              {sortBets(displayBets).map(bet => {
            const tokenDetails = getTokenDetails(bet.tokenMint);
            const {
              color,
              text,
              bgColor
            } = getPredictionDetails(bet.prediction);
            return <TableRow key={bet.id} className="hover:bg-dream-accent1/5 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 flex items-center justify-center">
                          <img src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" alt="Token" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="font-medium text-dream-foreground flex items-center gap-1 cursor-pointer">
                                <span className="truncate max-w-[150px]">{bet.tokenName || 'Unknown'}</span>
                                <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 backdrop-blur-md">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{bet.tokenName}</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-dream-foreground/60">Symbol</p>
                                    <p className="font-medium">{bet.tokenSymbol}</p>
                                  </div>
                                  {tokenDetails && <div>
                                      <p className="text-dream-foreground/60">Market Cap</p>
                                      <p className="font-medium">${formatNumberWithCommas(tokenDetails.current_market_cap)}</p>
                                    </div>}
                                  {tokenDetails && <div>
                                      <p className="text-dream-foreground/60">Supply</p>
                                      <p className="font-medium">{formatNumberWithCommas(tokenDetails.total_supply)}</p>
                                    </div>}
                                  <div>
                                    <p className="text-dream-foreground/60">Created On</p>
                                    <p className="font-medium">{tokenDetails?.created_on || 'pump.fun'}</p>
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          <div className="flex flex-col">
                            <div className="text-xs text-dream-foreground/60">{bet.tokenSymbol || '???'}</div>
                            <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                              <span className="truncate mr-1">{formatAddress(bet.tokenMint)}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => copyToClipboard(bet.tokenMint)} className="hover:text-dream-accent1 transition-colors">
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
                      {bet.amount} PXB
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <Badge className={`${bgColor} ${color} border-none`}>
                        {text}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <Badge variant="outline" className="border-dream-accent1/30">
                        {bet.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-xs">
                      {formatAddress(bet.initiator)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-xs">
                      {formatTimeRemaining(bet.expiresAt)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex justify-center">
                        <button className="btn-accept py-1 px-2 text-xs flex items-center gap-1 bg-gradient-to-r from-dream-accent2/20 to-dream-accent2/10 rounded-lg hover:from-dream-accent2/30 hover:to-dream-accent2/20 transition-all">
                          <Trophy className="w-3 h-3" />
                          <span>Challenge</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>;
          })}
            </TableBody>
          </Table>
        </div>}
      
      {viewMode === 'highValue' && highValueBets.length > 0 && <div className="mt-4 text-xs text-dream-foreground/60 flex items-center">
          <Flame className="h-3.5 w-3.5 mr-1.5 text-dream-accent1" />
          <span>Showing {highValueBets.length} bets with 1+ PXB value</span>
        </div>}
    </div>;
};
export default MigratingTokenList;