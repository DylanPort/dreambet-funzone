
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from 'sonner';

const PXBBetsList = () => {
  const { bets, fetchUserBets } = usePXBPoints();
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, { initialMarketCap: number | null, currentMarketCap: number | null }>>({});

  useEffect(() => {
    fetchUserBets();
  }, [fetchUserBets]);

  // Fetch real market cap data
  useEffect(() => {
    const fetchMarketCapData = async () => {
      if (!bets || bets.length === 0) return;

      // Process bets in small batches to avoid rate limits
      for (const bet of bets) {
        if (!bet.tokenMint) continue;
        
        // Skip if we already have data for this token
        if (marketCapData[bet.id]?.currentMarketCap) continue;
        
        // Mark as loading
        setLoadingMarketCaps(prev => ({ ...prev, [bet.id]: true }));
        
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
          console.error(`Error fetching data for token ${bet.tokenSymbol}:`, error);
        } finally {
          setLoadingMarketCaps(prev => ({ ...prev, [bet.id]: false }));
        }
        
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };

    fetchMarketCapData();
    
    // Set up polling for active bets
    const interval = setInterval(() => {
      const pendingBets = bets.filter(bet => bet.status === 'pending');
      if (pendingBets.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [bets]);

  if (!bets || bets.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
          Your PXB Bets
        </h2>
        <div className="text-center py-6">
          <p className="text-dream-foreground/70 mb-4">You haven't placed any PXB bets yet</p>
          <Button asChild>
            <Link to="/betting">Place Your First Bet</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress percentage for active bets
  const calculateProgress = (bet) => {
    if (bet.status !== 'pending') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    // Get current market cap from our fetched data or fallback to bet data
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      const actualChange = ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
      const targetChange = bet.percentageChange;
      
      // For "up" bets, progress is the percentage of target achieved
      if (bet.betType === 'up') {
        if (actualChange < 0) return 0; // If price is going down, progress is 0
        return Math.min(100, (actualChange / targetChange) * 100);
      } 
      // For "down" bets, progress is the percentage of target achieved (negative change)
      else {
        if (actualChange > 0) return 0; // If price is going up, progress is 0
        return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
      }
    }
    
    // Default to 0 if we don't have the data
    return 0;
  };

  // Calculate the target market cap for a bet
  const calculateTargetMarketCap = (bet) => {
    // Use our fetched initial market cap or fallback to bet data
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      // For UP bets, target is initial + percentage increase
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      // For DOWN bets, target is initial - percentage decrease
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };

  // Format large numbers with appropriate units (K, M, B)
  const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return "N/A";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  // Calculate market cap change percentage
  const calculateMarketCapChange = (bet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      return ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
    }
    return null;
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
        Your PXB Bets
      </h2>
      
      <div className="space-y-3">
        {bets.map((bet) => {
          const isActive = bet.status === 'pending';
          const expiryDate = new Date(bet.expiresAt);
          const timeLeft = isActive ? formatDistanceToNow(expiryDate, { addSuffix: true }) : '';
          
          let statusIcon;
          let statusClass;
          
          if (bet.status === 'pending') {
            statusIcon = <HelpCircle className="h-4 w-4 text-yellow-400" />;
            statusClass = 'text-yellow-400';
          } else if (bet.status === 'won') {
            statusIcon = <CheckCircle className="h-4 w-4 text-green-400" />;
            statusClass = 'text-green-400';
          } else {
            statusIcon = <XCircle className="h-4 w-4 text-red-400" />;
            statusClass = 'text-red-400';
          }
          
          // Calculate progress percentage
          const progressPercentage = calculateProgress(bet);
          
          // Calculate market cap change percentage if data is available
          const marketCapChangePercentage = calculateMarketCapChange(bet);
          
          // Calculate target market cap
          const targetMarketCap = calculateTargetMarketCap(bet);
          
          // Use fetched market cap data or fallback to bet data
          const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
          const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
          const isLoading = loadingMarketCaps[bet.id];
          
          return (
            <div 
              key={bet.id} 
              className={`bg-dream-foreground/5 rounded-md p-4 border transition-all ${
                isActive 
                  ? 'border-yellow-400/30 animate-pulse-slow' 
                  : bet.status === 'won' 
                    ? 'border-green-400/30' 
                    : 'border-red-400/30'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center mr-2">
                    {bet.betType === 'up' 
                      ? <ArrowUp className="h-4 w-4 text-green-400" />
                      : <ArrowDown className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold">{bet.tokenSymbol}</p>
                    <p className="text-xs text-dream-foreground/60">{bet.tokenName}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">{bet.betAmount} PXB</p>
                  <p className="text-xs text-dream-foreground/60">
                    Prediction: {bet.betType === 'up' ? 'MOON' : 'DIE'} by {bet.percentageChange}%
                  </p>
                </div>
              </div>
              
              {/* Market Cap Details */}
              <div className="grid grid-cols-3 gap-2 mb-3 mt-2 text-xs">
                <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                  <div className="text-dream-foreground/50 mb-1">Start MCAP</div>
                  <div className="font-medium">
                    {isLoading && !initialMarketCap 
                      ? <span className="animate-pulse">Loading...</span>
                      : formatLargeNumber(initialMarketCap)
                    }
                  </div>
                </div>
                <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                  <div className="text-dream-foreground/50 mb-1">Current MCAP</div>
                  <div className="font-medium">
                    {isLoading && !currentMarketCap 
                      ? <span className="animate-pulse">Loading...</span>
                      : formatLargeNumber(currentMarketCap)
                    }
                  </div>
                </div>
                <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                  <div className="text-dream-foreground/50 mb-1">Target MCAP</div>
                  <div className="font-medium">
                    {isLoading && !targetMarketCap 
                      ? <span className="animate-pulse">Loading...</span>
                      : formatLargeNumber(targetMarketCap)
                    }
                  </div>
                </div>
              </div>
              
              {/* Progress Indicator */}
              {isActive && (
                <div className="mb-3 mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dream-foreground/60">Progress towards target</span>
                    <span className={bet.betType === 'up' ? 'text-green-400' : 'text-red-400'}>
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {marketCapChangePercentage !== null && (
                    <div className="text-xs text-dream-foreground/60 mt-1">
                      Current change: {marketCapChangePercentage.toFixed(2)}%
                      {bet.betType === 'up'
                        ? ` / Target: +${bet.percentageChange}%`
                        : ` / Target: -${bet.percentageChange}%`
                      }
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center">
                  {statusIcon}
                  <span className={`ml-1 ${statusClass}`}>
                    {bet.status === 'pending' ? 'Active' : bet.status === 'won' ? 'Won' : 'Lost'}
                  </span>
                  {isActive && (
                    <span className="ml-2 text-dream-foreground/60">
                      Ends {timeLeft}
                    </span>
                  )}
                </div>
                
                {bet.status === 'won' && (
                  <span className="text-green-400 font-semibold">
                    +{bet.pointsWon} PXB
                  </span>
                )}
                
                {!isActive && marketCapChangePercentage !== null && (
                  <span className="text-dream-foreground/60">
                    Final market cap change: {marketCapChangePercentage.toFixed(2)}%
                  </span>
                )}
              </div>
              
              {/* House betting explanation */}
              <div className="mt-2 text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-2">
                {bet.status === 'pending' ? (
                  <p>Betting against the house: If you win, you'll earn {bet.betAmount} PXB from the supply.</p>
                ) : bet.status === 'won' ? (
                  <p>You won {bet.pointsWon} PXB from the house supply!</p>
                ) : (
                  <p>Your {bet.betAmount} PXB has returned to the house supply.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PXBBetsList;
