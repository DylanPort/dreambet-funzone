import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';
import {
  ArrowUp,
  ArrowDown,
  Flame,
  ExternalLink,
  Copy,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  Percent,
  LucideIcon,
  Target,
  BarChart,
  Rocket,
  TrendingDown as TrendingDownIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useIsMobile } from '@/hooks/use-mobile';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { PXBBet } from '@/types/pxb';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import TokenTrading from '@/components/TokenTrading';

interface BetDetailsProps {
  // Define any props if needed
}

const BetDetails: React.FC<BetDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, placeBet, isLoading, userBets } = usePXBPoints();
  const [token, setToken] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState<'up' | 'down'>('up');
  const [timeframe, setTimeframe] = useState(30);
  const [percentageChange, setPercentageChange] = useState(10);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [isPositive, setIsPositive] = useState(true);
  const [isBetting, setIsBetting] = useState(false);
  const isMobile = useIsMobile();
  const [activeBets, setActiveBets] = useState<PXBBet[]>([]);
  const [pastBets, setPastBets] = useState<PXBBet[]>([]);
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});

  const { tokenMetrics, subscribeToToken } = usePumpPortal(id || '');

  useEffect(() => {
    if (id) {
      subscribeToToken(id);
    }
  }, [id, subscribeToToken]);

  useEffect(() => {
    if (tokenMetrics && tokenMetrics.market_cap) {
      setMarketCap(tokenMetrics.market_cap);
    }
  }, [tokenMetrics]);

  useEffect(() => {
    if (userBets) {
      setActiveBets(userBets.filter(bet => bet.tokenMint === id && bet.status === 'pending'));
      setPastBets(userBets.filter(bet => bet.tokenMint === id && bet.status !== 'pending'));
    }
  }, [userBets, id]);

  useEffect(() => {
    const fetchMarketCapData = async () => {
      if (!userBets) return;
      
      const betsForThisToken = userBets.filter(bet => bet.tokenMint === id);
      if (betsForThisToken.length === 0) return;
      
      for (const bet of betsForThisToken) {
        if (loadingMarketCaps[bet.id]) continue;
        
        setLoadingMarketCaps(prev => ({
          ...prev,
          [bet.id]: true
        }));
        
        try {
          const data = await fetchDexScreenerData(bet.tokenMint);
          if (data) {
            setMarketCapData(prev => ({
              ...prev,
              [bet.id]: {
                initialMarketCap: bet.initialMarketCap || data.marketCap,
                currentMarketCap: data.marketCap
              }
            }));
          }
        } catch (error) {
          console.error(`Error fetching market cap data for bet ${bet.id}:`, error);
        } finally {
          setLoadingMarketCaps(prev => ({
            ...prev,
            [bet.id]: false
          }));
        }
      }
    };
    
    fetchMarketCapData();
    
    const intervalId = setInterval(() => {
      const activeBetsForToken = userBets?.filter(bet => 
        bet.tokenMint === id && bet.status === 'pending'
      ) || [];
      
      if (activeBetsForToken.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [id, userBets, loadingMarketCaps]);

  const calculateProgress = (bet: PXBBet) => {
    if (bet.status !== 'pending') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) return 0;
    
    const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    const targetChange = bet.percentageChange;
    
    if (bet.betType === 'up') {
      if (actualChange < 0) return 0;
      return Math.min(100, (actualChange / targetChange) * 100);
    } else {
      if (actualChange > 0) return 0;
      return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
    }
  };

  const calculateTargetMarketCap = (bet: PXBBet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };

  const calculateMarketCapChange = (bet: PXBBet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) return null;
    
    return ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
  };

  useEffect(() => {
    const mockToken = {
      id: id || 'unknown',
      name: 'Mock Token',
      symbol: 'MOCK',
      price: 0.000123,
      priceChange: 5.23,
      imageUrl: '/placeholder-image.png',
      liquidity: 123456,
      volume24h: 789012,
      marketCap: 123456789,
    };

    setToken(mockToken);
  }, [id]);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "0.00";
    
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatLargeNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "N/A";

    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const copyToClipboard = () => {
    if (token && token.id) {
      navigator.clipboard.writeText(token.id).then(() => {
        setIsCopied(true);
        toast.success('Contract address copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        toast.error('Failed to copy address');
        console.error('Could not copy text: ', err);
      });
    }
  };

  const handlePlaceBet = async () => {
    if (!userProfile) {
      toast.error('You must be logged in to place a bet');
      return;
    }

    if (userProfile.pxbPoints < betAmount) {
      toast.error('Insufficient PXB Points. ');
      return;
    }

    if (!marketCap) {
      toast.error('Market cap data is not available for this token');
      return;
    }

    try {
      setIsBetting(true);
      toast.success(`Placing ${betType === 'up' ? 'MOON' : 'DIE'} bet on ${token?.symbol}`, {
        description: `Starting MCAP: ${formatLargeNumber(marketCap)}
        Target: ${betType === 'up' ? formatLargeNumber(marketCap * (1 + percentageChange / 100)) : formatLargeNumber(marketCap * (1 - percentageChange / 100))}`
      });

      await placeBet(token.id, token.name, token.symbol, betAmount, betType, percentageChange, timeframe);
      setShowCreateBet(false);
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
    } finally {
      setIsBetting(false);
    }
  };

  const BetSchema = z.object({
    amount: z.number().min(10, {
      message: "Amount must be at least 10 PXB.",
    }).max(userProfile?.pxbPoints || 10, {
      message: "Amount must be less than your balance.",
    }),
    direction: z.enum(["up", "down"]),
    timeframe: z.number(),
    percentageChange: z.number(),
  })

  const form = useForm<z.infer<typeof BetSchema>>({
    resolver: zodResolver(BetSchema),
    defaultValues: {
      amount: 10,
      direction: "up",
      timeframe: 30,
      percentageChange: 10,
    },
  })

  function onSubmit(values: z.infer<typeof BetSchema>) {
    if (!userProfile) {
      toast.error('You must be logged in to place a bet');
      return;
    }

    if (userProfile.pxbPoints < values.amount) {
      toast.error('Insufficient PXB Points. ');
      return;
    }

    if (!marketCap) {
      toast.error('Market cap data is not available for this token');
      return;
    }

    try {
      setIsBetting(true);
      toast.success(`Placing ${values.direction === 'up' ? 'MOON' : 'DIE'} bet on ${token?.symbol}`, {
        description: `Starting MCAP: ${formatLargeNumber(marketCap)}
        Target: ${values.direction === 'up' ? formatLargeNumber(marketCap * (1 + values.percentageChange / 100)) : formatLargeNumber(marketCap * (1 - values.percentageChange / 100))}`
      });

      placeBet(token.id, token.name, token.symbol, values.amount, values.direction, values.percentageChange, values.timeframe).then(() => {
        setShowCreateBet(false);
        form.reset();
      });
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
    } finally {
      setIsBetting(false);
    }
  }

  const renderBetStatus = (bet: PXBBet) => {
    switch (bet.status) {
      case 'pending':
        return <span className="text-yellow-500">Pending</span>;
      case 'won':
        return <span className="text-green-500">Won</span>;
      case 'lost':
        return <span className="text-red-500">Lost</span>;
      case 'expired':
        return <span className="text-gray-500">Expired</span>;
      case 'open':
        return <span className="text-blue-500">Open</span>;
      default:
        return <span className="text-gray-500">Unknown</span>;
    }
  };

  const renderBetTrend = (bet: PXBBet) => {
    if (bet.betType === 'up') {
      return <TrendingUp className="text-green-500 w-4 h-4" />;
    } else if (bet.betType === 'down') {
      return <TrendingDown className="text-red-500 w-4 h-4" />;
    } else {
      return null;
    }
  };

  const calculatePayout = (bet: PXBBet) => {
    if (bet.status === 'won') {
      return bet.pointsWon || bet.betAmount * (bet.percentageChange / 100);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-dream-background overflow-hidden">
      <div className="relative glass-panel p-4 md:p-8 max-w-4xl mx-auto mt-10 md:mt-20 mb-10 md:mb-20 border border-white/10 group-hover:border-white/20 transition-all duration-300">
        <Button variant="ghost" size="sm" className="absolute top-2 left-2 md:top-4 md:left-4" onClick={() => navigate(-1)}>
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png"
                alt={token?.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-2xl">{token?.name}</h3>
                <a
                  href={`https://dexscreener.com/solana/${token?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-dream-foreground/40"
                >
                  <ExternalLink className="w-4 h-4 text-dream-foreground/40" />
                </a>
              </div>
              <p className="text-dream-foreground/60 text-sm">{token?.symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
              <Flame className="w-3 h-3" />
              <span>#{1}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(token?.priceChange || 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-dream-foreground/40 border border-dream-foreground/10 px-1.5 py-0.5 rounded">
              {isPositive ? '+' : '-'}{Math.abs(token?.priceChange || 0).toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium flex items-center">
              <span className="mr-1 text-dream-foreground/60">Price</span>
              <span className="text-dream-foreground/90">${formatPrice(token?.price)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">Volume</div>
            <div className="font-medium">{formatLargeNumber(token?.volume24h)}</div>
          </div>
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">Liquidity</div>
            <div className="font-medium">{formatLargeNumber(token?.liquidity)}</div>
          </div>
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">MCAP</div>
            <div className="font-medium">{formatLargeNumber(token?.marketCap)}</div>
          </div>
        </div>

        <div className="flex items-center mb-3 bg-black/30 rounded-lg p-2 text-xs">
          <div className="truncate mr-2 text-white/70 flex-1">
            {token?.id || 'Unknown Address'}
          </div>
          <button onClick={copyToClipboard} className="text-cyan-400 hover:text-cyan-300 transition-colors">
            {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3">Place a Bet</h4>
          {showCreateBet ? (
            <TokenTrading 
              tokenId={token?.id || ''}
              tokenName={token?.name || ''}
              tokenSymbol={token?.symbol || ''}
              marketCap={marketCap}
              onCancel={() => setShowCreateBet(false)}
              onSuccess={() => setShowCreateBet(false)}
            />
          ) : (
            <Button className="w-full" variant="default" onClick={() => setShowCreateBet(true)}>
              Place a Bet
            </Button>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-3">Active Bets</h4>
          {activeBets.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto px-1">
              {activeBets.map((bet) => (
                <Card key={bet.id} className="border border-dream-foreground/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bet.betType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {bet.betType === 'up' ? <Rocket size={16} /> : <TrendingDownIcon size={16} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{bet.betAmount} PXB {bet.betType === 'up' ? 'Moon Bet' : 'Die Bet'}</h4>
                          <p className="text-xs text-dream-foreground/60">
                            Created {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${bet.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : bet.status === 'won' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {bet.status === 'pending' ? 'Active' : bet.status === 'won' ? 'Won' : 'Lost'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm text-dream-foreground/70 mb-3">
                      Prediction: {bet.betType === 'up' ? 'Price will increase' : 'Price will decrease'} by at least {bet.percentageChange}% within {bet.timeframe || 30} minutes
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-3 mb-3">
                      <div className="flex justify-between text-xs text-dream-foreground/70 mb-2">
                        <div className="flex items-center">
                          <BarChart className="w-3 h-3 mr-1" />
                          <span>Entry MCAP: {formatLargeNumber(bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap)}</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          <span className={bet.betType === 'up' ? 'text-green-400' : 'text-red-400'}>
                            Target MCAP: {formatLargeNumber(calculateTargetMarketCap(bet))}
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative pt-1">
                        <Progress value={calculateProgress(bet)} className="h-2" />
                        <div className="mt-1 flex justify-between text-xs">
                          <div>0%</div>
                          <div>{calculateProgress(bet).toFixed(1)}% complete</div>
                          <div>100%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-dream-foreground/60" />
                        <span>
                          {new Date(bet.expiresAt) > new Date() 
                            ? `Expires in ${formatDistanceToNow(new Date(bet.expiresAt))}`
                            : 'Expired'}
                        </span>
                      </div>
                      
                      {marketCapData[bet.id]?.currentMarketCap && (
                        <div className="flex items-center">
                          <span className={calculateMarketCapChange(bet) && calculateMarketCapChange(bet)! > 0 ? 'text-green-400' : 'text-red-400'}>
                            Current change: {calculateMarketCapChange(bet)?.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-sm text-dream-foreground/60">No active bets for this token.</div>
          )}
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-3">Past Bets</h4>
          {pastBets.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto px-1">
              {pastBets.map((bet) => (
                <Card key={bet.id} className="border border-dream-foreground/10 bg-black/20 backdrop-blur-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bet.betType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {bet.betType === 'up' ? <Rocket size={16} /> : <TrendingDownIcon size={16} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{bet.betAmount} PXB {bet.betType === 'up' ? 'Moon Bet' : 'Die Bet'}</h4>
                          <p className="text-xs text-dream-foreground/60">
                            Created {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${bet.status === 'won' ? 'bg-green-500/20 text-green-400' : bet.status === 'lost' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : 'Expired'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm text-dream-foreground/70 mb-3">
                      Prediction: {bet.betType === 'up' ? 'Price will increase' : 'Price will decrease'} by at least {bet.percentageChange}% within {bet.timeframe || 30} minutes
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-3 mb-3">
                      <div className="flex justify-between text-xs text-dream-foreground/70">
                        <div>
                          Entry MCAP: {formatLargeNumber(bet.initialMarketCap)}
                        </div>
                        <div>
                          Target MCAP: {formatLargeNumber(calculateTargetMarketCap(bet))}
                        </div>
                        {bet.status === 'won' && (
                          <div className="text-green-400">
                            Payout: {bet.pointsWon || calculatePayout(bet)} PXB
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {bet.resolvedAt && (
                      <div className="text-xs text-dream-foreground/60">
                        Resolved {formatDistanceToNow(new Date(bet.resolvedAt), { addSuffix: true })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-sm text-dream-foreground/60">No past bets for this token.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetDetails;
