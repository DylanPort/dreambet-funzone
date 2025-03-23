
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
    // Mock token data (replace with actual data fetching)
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

  // Update the formatPrice function to safely handle undefined values
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return "0.00";
    
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "-";

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
    console.log(values)
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
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="absolute top-2 left-2 md:top-4 md:left-4" onClick={() => navigate(-1)}>
          Back
        </Button>

        {/* Token Info */}
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

        {/* Price and Change */}
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

        {/* Market Stats */}
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

        {/* Contract Address */}
        <div className="flex items-center mb-3 bg-black/30 rounded-lg p-2 text-xs">
          <div className="truncate mr-2 text-white/70 flex-1">
            {token?.id || 'Unknown Address'}
          </div>
          <button onClick={copyToClipboard} className="text-cyan-400 hover:text-cyan-300 transition-colors">
            {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Create Bet Section */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3">Place a Bet</h4>
          {showCreateBet ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Bet</CardTitle>
                <CardDescription>
                  Enter the details for your bet.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (PXB)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Direction</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={betType === 'up' ? 'default' : 'outline'}
                      onClick={() => setBetType('up')}
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Up
                    </Button>
                    <Button
                      variant={betType === 'down' ? 'default' : 'outline'}
                      onClick={() => setBetType('down')}
                    >
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Down
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timeframe">Timeframe (minutes)</Label>
                  <Input
                    id="timeframe"
                    type="number"
                    min="1"
                    max="60"
                    value={timeframe}
                    onChange={(e) => setTimeframe(Number(e.target.value))}
                    placeholder="Enter timeframe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="percentageChange">Target Change (%)</Label>
                  <Input
                    id="percentageChange"
                    type="number"
                    min="1"
                    max="50"
                    value={percentageChange}
                    onChange={(e) => setPercentageChange(Number(e.target.value))}
                    placeholder="Enter percentage"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setShowCreateBet(false)}>
                  Cancel
                </Button>
                <Button disabled={isBetting} onClick={handlePlaceBet}>
                  {isBetting ? (
                    <>
                      Placing Bet...
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    'Place Bet'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            
            <Button className="w-full" variant="default" onClick={() => setShowCreateBet(true)}>
              Place a Bet
            </Button>
          )}
        </div>

        {/* Active Bets */}
        <div>
          <h4 className="font-semibold text-lg mb-3">Active Bets</h4>
          {activeBets.length > 0 ? (
            <ScrollArea className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="[&_th]:px-4 [&_th]:py-2 [&_th]:[border-bottom:1px_solid_hsl(var(--border))]">
                  <tr>
                    <th>Direction</th>
                    <th>Amount</th>
                    <th>Target</th>
                    <th>Timeframe</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="[&_td]:p-4 [&_tr:last-child_td]:border-0">
                  {activeBets.map((bet) => (
                    <tr key={bet.id}>
                      <td>
                        <div className="flex items-center">
                          {renderBetTrend(bet)}
                          {bet.betType === 'up' ? 'Moon' : 'Die'}
                        </div>
                      </td>
                      <td>{bet.betAmount} PXB</td>
                      <td>{bet.percentageChange}%</td>
                      <td>{bet.timeframe || 30} min</td>
                      <td>{renderBetStatus(bet)}</td>
                      <td>
                        <Clock className="mr-2 h-4 w-4" />
                        {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          ) : (
            <div className="text-sm text-dream-foreground/60">No active bets for this token.</div>
          )}
        </div>

        {/* Past Bets */}
        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-3">Past Bets</h4>
          {pastBets.length > 0 ? (
            <ScrollArea className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="[&_th]:px-4 [&_th]:py-2 [&_th]:[border-bottom:1px_solid_hsl(var(--border))]">
                  <tr>
                    <th>Direction</th>
                    <th>Amount</th>
                    <th>Target</th>
                    <th>Timeframe</th>
                    <th>Status</th>
                    <th>Payout</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="[&_td]:p-4 [&_tr:last-child_td]:border-0">
                  {pastBets.map((bet) => (
                    <tr key={bet.id}>
                      <td>
                        <div className="flex items-center">
                          {renderBetTrend(bet)}
                          {bet.betType === 'up' ? 'Moon' : 'Die'}
                        </div>
                      </td>
                      <td>{bet.betAmount} PXB</td>
                      <td>{bet.percentageChange}%</td>
                      <td>{bet.timeframe || 30} min</td>
                      <td>{renderBetStatus(bet)}</td>
                      <td>{calculatePayout(bet)} PXB</td>
                      <td>
                        {bet.resolvedAt && (
                          <>
                            <Clock className="mr-2 h-4 w-4" />
                            {formatDistanceToNow(new Date(bet.resolvedAt), { addSuffix: true })}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          ) : (
            <div className="text-sm text-dream-foreground/60">No past bets for this token.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BetDetails;
