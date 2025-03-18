
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, User, Users, Layers, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RawTokenTradeEvent } from '@/services/pumpPortalWebSocketService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BetPrediction, BetStatus } from '@/types/bet';
import { formatDistanceToNow } from 'date-fns';

const RecentTokenTrades: React.FC = () => {
  const { isConnected } = usePumpPortal();
  const [displayLimit, setDisplayLimit] = useState(5);
  const isMobile = useIsMobile();
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  // Show more bets
  const handleShowMore = () => {
    setDisplayLimit(prev => prev + 5);
  };

  // Fetch recent bets
  useEffect(() => {
    const fetchRecentBets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('bets')
          .select(`
            bet_id,
            token_mint,
            tokens (token_name, token_symbol),
            creator,
            prediction_bettor1,
            sol_amount,
            status,
            created_at,
            percentage_change
          `)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) {
          console.error('Error fetching recent bets:', error);
          return;
        }
        
        // Transform the data for display
        const formattedBets = data.map(bet => {
          // Map prediction values for display
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
            status: bet.status
          };
        });
        
        setRecentBets(formattedBets);
      } catch (error) {
        console.error('Error in fetchRecentBets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      fetchRecentBets();
      
      // Set up polling for live updates
      const interval = setInterval(fetchRecentBets, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Format large numbers
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

  if (isLoading) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Loading recent bets...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Connecting to Pump Portal...</p>
        </div>
      </div>
    );
  }

  if (recentBets.length === 0) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
        <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg">
            New Bets
          </h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-dream-foreground/60">No recent bets found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
      <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">
          New Bets
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-xs flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            Live from PumpPortal
          </span>
        </div>
      </div>
      
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-dream-accent1/10">
          {recentBets.slice(0, displayLimit).map((bet, index) => (
            <Link 
              key={`bet-${index}`} 
              to={`/betting/token/${bet.tokenMint}`}
              className="block"
            >
              <div className="p-4 hover:bg-dream-accent1/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="text-dream-accent2">{bet.tokenName}</span>
                      <span className="text-xs text-dream-foreground/60">{bet.tokenSymbol}</span>
                    </div>
                    <div className="text-xs text-dream-foreground/60 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(bet.timestamp)}
                      </span>
                      {bet.status && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          bet.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                          bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-dream-foreground/20 text-dream-foreground/60'
                        }`}>
                          {bet.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-dream-accent1/10 text-dream-accent1 text-xs px-2 py-1 rounded">
                    <span className="font-mono font-medium">{bet.amount} PXB</span>
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
                  
                  <div className={`bg-dream-foreground/5 p-2 rounded flex items-center justify-between ${
                    bet.prediction === 'up' ? 'border-l-2 border-green-400' : 'border-l-2 border-red-400'
                  }`}>
                    <span className="text-dream-foreground/60 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Prediction
                    </span>
                    <span className={`font-medium ${
                      bet.prediction === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {bet.predictionDisplay}
                    </span>
                  </div>
                  
                  {bet.percentageChange > 0 && (
                    <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                      <span className="text-dream-foreground/60 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Target
                      </span>
                      <span className="font-medium">
                        {bet.percentageChange}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs">
                  <div className="truncate text-dream-foreground/40">
                    {bet.tokenMint}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
      
      {recentBets.length > displayLimit && (
        <div className="p-3 text-center border-t border-dream-accent1/20">
          <button 
            onClick={handleShowMore}
            className="text-dream-accent1 text-sm hover:underline"
          >
            Show more bets
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTokenTrades;
