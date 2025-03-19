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

const ActiveBetsList = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'highValue'>('all');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bets')
          .select(`
            bet_id,
            token_mint,
            tokens (token_name, token_symbol),
            creator,
            prediction_bettor1,
            sol_amount,
            duration,
            status,
            created_at
          `)
          .or('status.eq.open,status.eq.matched,status.eq.pending')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching bets:', error);
          toast.error('Failed to load active bets. Please try again.');
          return;
        }
        
        if (!data || data.length === 0) {
          setBets([]);
          setLoading(false);
          return;
        }
        
        const transformedBets: Bet[] = data.map(bet => {
          let predictionValue: any;
          if (bet.prediction_bettor1 === 'up') {
            predictionValue = 'migrate';
          } else if (bet.prediction_bettor1 === 'down') {
            predictionValue = 'die';
          } else {
            predictionValue = bet.prediction_bettor1;
          }
          
          const validStatus: BetStatus = ['open', 'matched', 'completed', 'expired', 'closed'].includes(bet.status as string) 
            ? (bet.status as BetStatus) 
            : 'open';
          
          return {
            id: bet.bet_id,
            tokenId: bet.token_mint,
            tokenMint: bet.token_mint,
            tokenName: bet.tokens?.token_name || 'Unknown Token',
            tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
            initiator: bet.creator || 'Unknown',
            amount: bet.sol_amount,
            prediction: predictionValue,
            timestamp: new Date(bet.created_at).getTime(),
            expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
            status: validStatus,
            duration: Math.floor(bet.duration / 60),
            onChainBetId: '',
            transactionSignature: ''
          };
        });
        
        setBets(transformedBets);
      } catch (error) {
        console.error('Error in fetchBets:', error);
        toast.error('Failed to load active bets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBets();
    
    const interval = setInterval(fetchBets, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const highValueBets = bets.filter(bet => bet.amount >= 1);
  
  const displayBets = viewMode === 'all' ? bets : highValueBets;
  
  const formatTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const timeRemaining = expiresAt - now;
    
    if (timeRemaining <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
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
        return { color: 'text-green-400', text: 'MOON' };
      case 'die':
      case 'down':
        return { color: 'text-red-400', text: 'DIE' };
      default:
        return { color: 'text-yellow-400', text: prediction.toUpperCase() };
    }
  };

  const sortBets = (betsToSort: Bet[]) => {
    const bets = [...betsToSort];
    
    switch(sortBy) {
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

  const toggleSortMenu = () => {
    setSortMenuOpen(!sortMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (sortMenuOpen) {
        setSortMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen]);
  
  if (loading) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <Flame className="h-8 w-8 text-dream-accent1 mb-2" />
            <p className="text-dream-foreground/60">Loading active bets...</p>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!displayBets || displayBets.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <div className="text-center py-8">
          <Target className="mx-auto h-10 w-10 text-dream-accent2 mb-2" />
          <p className="text-dream-foreground/60">
            {viewMode === 'all' 
              ? "No active bets found" 
              : "No bets above 1 SOL found"}
          </p>
        </div>
      </Card>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Address copied to clipboard");
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy address");
    });
  };

  const renderMobileBetCards = () => {
    return (
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:ml-0">
          {sortBets(displayBets).map((bet) => (
            <CarouselItem key={bet.id} className="pl-2 md:pl-0 basis-[85%] sm:basis-[60%] md:basis-full">
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
                              <button
                                onClick={() => copyToClipboard(bet.tokenMint)}
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
                    <div className="text-sm text-dream-foreground/60">Bet Amount</div>
                    <div className="font-medium">{bet.amount} SOL</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-dream-foreground/60">Prediction</div>
                    <span className={getPredictionDetails(bet.prediction).color}>
                      {getPredictionDetails(bet.prediction).text}
                    </span>
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
                </div>
                
                <div className="flex justify-center gap-2">
                  <button className="btn-accept py-1.5 px-3 text-sm flex items-center gap-1 bg-gradient-to-r from-dream-accent2/20 to-dream-accent2/10 rounded-lg hover:from-dream-accent2/30 hover:to-dream-accent2/20 transition-all">
                    <Trophy className="w-3 h-3" />
                    <span className="text-dream-accent2 font-bold">CHALLENGE</span>
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
          <span>ACTIVE BETS</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'highValue')} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="all" className="text-xs">All Bets</TabsTrigger>
              <TabsTrigger value="highValue" className="text-xs">1+ SOL</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1.5 h-9"
              onClick={toggleSortMenu}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sort: {sortBy.replace('-', ' ')}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md shadow-lg z-20 overflow-hidden">
                <div className="py-1">
                  {[
                    {value: 'newest', label: 'Newest First'},
                    {value: 'oldest', label: 'Oldest First'},
                    {value: 'amount-high', label: 'Amount: High to Low'},
                    {value: 'amount-low', label: 'Amount: Low to High'},
                    {value: 'expiring-soon', label: 'Expiring Soon'},
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-dream-accent1/10 transition-colors ${sortBy === option.value ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                      onClick={() => {
                        setSortBy(option.value);
                        setSortMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isMobile ? (
        renderMobileBetCards()
      ) : (
        <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
          <Table>
            <TableHeader className="bg-dream-background/50 backdrop-blur-sm">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Amount</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Prediction</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Initiator</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Time Remaining</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-dream-accent1/10">
              {sortBets(displayBets).map((bet) => (
                <TableRow 
                  key={bet.id} 
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
                          <span className="truncate max-w-[150px]">{bet.tokenName || 'Unknown'}</span>
                          <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-xs text-dream-foreground/60">{bet.tokenSymbol || '???'}</div>
                          <div className="text-xs text-dream-foreground/40 mt-0.5 flex items-center">
                            <span className="truncate mr-1">{formatAddress(bet.tokenMint)}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => copyToClipboard(bet.tokenMint)}
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
                    {bet.amount} SOL
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPredictionDetails(bet.prediction).color} bg-dream-background/40`}>
                      {getPredictionDetails(bet.prediction).text}
                    </span>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {viewMode === 'highValue' && highValueBets.length > 0 && (
        <div className="mt-4 text-xs text-dream-foreground/60 flex items-center">
          <Flame className="h-3.5 w-3.5 mr-1.5 text-dream-accent1" />
          <span>Showing {highValueBets.length} bets with 1+ SOL value</span>
        </div>
      )}
    </div>
  );
};

export default ActiveBetsList;
