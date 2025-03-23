import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, User, Users, Layers, DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RawTokenTradeEvent } from '@/services/pumpPortalWebSocketService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BetPrediction, BetStatus } from '@/types/bet';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
const RecentTokenTrades: React.FC = () => {
  const {
    isConnected
  } = usePumpPortal();
  const [displayLimit, setDisplayLimit] = useState(5);
  const isMobile = useIsMobile();
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const navigate = useNavigate();
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});
  const [loadingProgress, setLoadingProgress] = useState<Record<string, boolean>>({});
  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true
      });
    } catch (e) {
      return 'recently';
    }
  };
  const fetchRecentBets = async (pageNum = 0, append = false) => {
    const loadingState = append ? setIsLoadingMore : setIsLoading;
    loadingState(true);
    try {
      const {
        data,
        error
      } = await supabase.from('bets').select(`
          bet_id,
          token_mint,
          tokens (token_name, token_symbol),
          creator,
          prediction_bettor1,
          sol_amount,
          status,
          created_at,
          percentage_change,
          initial_market_cap
        `).order('created_at', {
        ascending: false
      }).range(pageNum * pageSize, pageNum * pageSize + pageSize - 1);
      if (error) {
        console.error('Error fetching recent bets:', error);
        return;
      }
      if (data.length < pageSize) {
        setHasMore(false);
      }
      const formattedBets = data.map(bet => {
        let predictionDisplay: string;
        if (bet.prediction_bettor1 === 'up') {
          predictionDisplay = 'MOON';
        } else if (bet.prediction_bettor1 === 'down') {
          predictionDisplay = 'DIE';
        } else {
          predictionDisplay = bet.prediction_bettor1.toUpperCase();
        }
        return {
          id: bet.bet_id,
          tokenMint: bet.token_mint,
          tokenName: bet.tokens?.token_name || 'Unknown Token',
          tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
          creator: bet.creator || 'Unknown',
          amount: bet.sol_amount,
          prediction: bet.prediction_bettor1,
          predictionDisplay,
          percentageChange: bet.percentage_change || 0,
          timestamp: bet.created_at,
          status: bet.status,
          initialMarketCap: bet.initial_market_cap
        };
      });
      if (append) {
        setRecentBets(prev => [...prev, ...formattedBets]);
      } else {
        setRecentBets(formattedBets);
      }
      formattedBets.forEach(bet => {
        fetchBetMarketCapData(bet);
      });
    } catch (error) {
      console.error('Error in fetchRecentBets:', error);
    } finally {
      loadingState(false);
    }
  };
  const fetchBetMarketCapData = async (bet: any) => {
    if (!bet.tokenMint || marketCapData[bet.id]?.currentMarketCap) return;
    setLoadingProgress(prev => ({
      ...prev,
      [bet.id]: true
    }));
    try {
      const metrics = await fetchTokenMetrics(bet.tokenMint);
      if (metrics && metrics.marketCap !== null) {
        setMarketCapData(prev => ({
          ...prev,
          [bet.id]: {
            initialMarketCap: bet.initialMarketCap || metrics.marketCap,
            currentMarketCap: metrics.marketCap
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching market cap data for token ${bet.tokenSymbol}:`, error);
    } finally {
      setLoadingProgress(prev => ({
        ...prev,
        [bet.id]: false
      }));
    }
  };
  const calculateProgress = (bet: any) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap;
    if (!initialMarketCap || !currentMarketCap) {
      return 0;
    }
    if (bet.status !== 'open') {
      return bet.status === 'won' ? 100 : 0;
    }
    const percentageChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    const targetChange = bet.percentageChange || 30; // Default to 30% if not specified

    if (bet.prediction === 'up') {
      if (percentageChange < 0) return 0;
      return Math.min(100, percentageChange / targetChange * 100);
    } else {
      if (percentageChange > 0) return 0;
      return Math.min(100, Math.abs(percentageChange) / targetChange * 100);
    }
  };
  useEffect(() => {
    if (isConnected) {
      fetchRecentBets();
      const interval = setInterval(() => fetchRecentBets(), 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);
  const handleShowMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchRecentBets(nextPage, true);
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };
  const handleNavigateToBetting = () => {
    navigate('/betting');
  };
  const formatMarketCap = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };
  const calculateTargetMarketCap = (bet: any) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    const percentageChange = bet.percentageChange || 30; // Default to 30% if not specified

    if (bet.prediction === 'up') {
      return initialMarketCap * (1 + percentageChange / 100);
    } else {
      return initialMarketCap * (1 - percentageChange / 100);
    }
  };
  if (isLoading) {
    return <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Loading recent bets...</p>
        </div>
      </div>;
  }
  if (!isConnected) {
    return <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Connecting to Pump Portal...</p>
        </div>
      </div>;
  }
  if (recentBets.length === 0) {
    return <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
        <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg">
            New Bets
          </h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-dream-foreground/60">No recent bets found</p>
        </div>
      </div>;
  }
  return <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
      <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">
          New Bets
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-xs flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Live from PumpXBounty
          </span>
        </div>
      </div>
      
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-dream-accent1/10">
          {recentBets.map((bet, index) => <Link key={`bet-${bet.id}`} to={`/token/${bet.tokenMint}`} className="block">
              <div className="p-4 hover:bg-dream-accent1/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-green-300 to-emerald-500">{bet.tokenName}</span>
                      <span className="text-xs text-dream-foreground/60">{bet.tokenSymbol}</span>
                    </div>
                    <div className="text-xs text-dream-foreground/60 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(bet.timestamp)}
                      </span>
                      {bet.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-dream-accent1/10 text-dream-accent1 text-xs px-2 py-1 rounded">
                    <span className="font-mono font-medium">{bet.amount} PXB</span>
                  </div>
                </div>
                
                <div className="mb-3 mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dream-foreground/60">Progress</span>
                    <div className="flex space-x-2">
                      <span className="text-dream-foreground/60">
                        Initial: {formatMarketCap(bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap)}
                      </span>
                      <span className="text-dream-foreground/60">→</span>
                      
                    </div>
                  </div>
                  
                  {loadingProgress[bet.id] ? <div className="h-2 bg-black/30 backdrop-blur-sm rounded-full animate-pulse"></div> : <Progress value={calculateProgress(bet)} className="h-2 bg-black/30 backdrop-blur-sm" />}
                  
                  <div className="flex justify-between text-xs mt-1">
                    
                    <span className={`${bet.prediction === 'up' ? 'text-green-400' : 'text-red-400'} font-medium`}>
                      {calculateProgress(bet).toFixed(1)}% complete
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                    <span className="text-dream-foreground/60 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Bettor
                    </span>
                    <span className="font-medium truncate max-w-[100px]" title={bet.creator}>
                      {bet.creator.substring(0, 6)}...{bet.creator.substring(bet.creator.length - 4)}
                    </span>
                  </div>
                  
                  <div className={`bg-dream-foreground/5 p-2 rounded flex items-center justify-between ${bet.prediction === 'up' ? 'border-l-2 border-green-400' : 'border-l-2 border-red-400'}`}>
                    <span className="text-dream-foreground/60 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Prediction
                    </span>
                    <span className={`font-medium ${bet.prediction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.predictionDisplay}
                    </span>
                  </div>
                  
                  {bet.percentageChange > 0 && <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                      <span className="text-dream-foreground/60 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Target
                      </span>
                      <span className="font-medium">
                        {bet.percentageChange}%
                      </span>
                    </div>}
                </div>
                
                <div className="mt-2 text-xs">
                  <div className="truncate text-dream-foreground/40">
                    {bet.tokenMint}
                  </div>
                </div>
              </div>
            </Link>)}
        </div>
      </ScrollArea>
      
      <div className="p-3 text-center border-t border-dream-accent1/20">
        <button onClick={handleNavigateToBetting} className="text-dream-accent1 text-sm hover:underline flex items-center justify-center gap-2 w-full">
          View all bets
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>;
};
export default RecentTokenTrades;