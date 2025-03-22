
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

const PXBBetsList = () => {
  const { bets, fetchUserBets } = usePXBPoints();
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, { initialMarketCap: number | null, currentMarketCap: number | null }>>({});
  const [showAllBets, setShowAllBets] = useState(false);

  useEffect(() => {
    fetchUserBets();
  }, [fetchUserBets]);

  useEffect(() => {
    const fetchMarketCapData = async () => {
      if (!bets || bets.length === 0) return;

      for (const bet of bets) {
        if (!bet.tokenMint) continue;
        
        if (marketCapData[bet.id]?.currentMarketCap) continue;
        
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
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };

    fetchMarketCapData();
    
    const interval = setInterval(() => {
      const pendingBets = bets.filter(bet => bet.status === 'pending');
      if (pendingBets.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [bets, marketCapData]);

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

  const calculateProgress = (bet) => {
    if (bet.status !== 'pending' && bet.status !== 'open') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      const actualChange = ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
      const targetChange = bet.percentageChange;
      
      if (bet.betType === 'up') {
        if (actualChange < 0) return 0;
        return Math.min(100, (actualChange / targetChange) * 100);
      } else {
        if (actualChange > 0) return 0;
        return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
      }
    }
    
    return 0;
  };

  const calculateTargetMarketCap = (bet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };

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

  const calculateMarketCapChange = (bet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      return ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
    }
    return null;
  };

  // Helper function to check if a bet is active (pending or open and not expired)
  const isBetActive = (bet) => {
    const now = new Date();
    const expiryDate = new Date(bet.expiresAt);
    return (bet.status === 'pending' || bet.status === 'open') && now < expiryDate;
  };

  const displayedBets = showAllBets ? bets : bets.slice(0, 2);

  return (
    <div className="glass-panel p-6">
      <h2 className="font-semibold text-lg mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
        Your PXB Bets
      </h2>
      
      <div className="space-y-3">
        {displayedBets.map((bet) => {
          const isActive = isBetActive(bet);
          const expiryDate = new Date(bet.expiresAt);
          const timeLeft = isActive ? formatDistanceToNow(expiryDate, { addSuffix: true }) : '';
          
          let statusIcon;
          let statusClass;
          
          if (isActive) {
            statusIcon = <HelpCircle className="h-4 w-4 text-yellow-400" />;
            statusClass = 'text-yellow-400';
          } else if (bet.status === 'won') {
            statusIcon = <CheckCircle className="h-4 w-4 text-green-400" />;
            statusClass = 'text-green-400';
          } else {
            statusIcon = <XCircle className="h-4 w-4 text-red-400" />;
            statusClass = 'text-red-400';
          }
          
          const progressPercentage = calculateProgress(bet);
          
          const marketCapChangePercentage = calculateMarketCapChange(bet);
          
          const targetMarketCap = calculateTargetMarketCap(bet);
          
          const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
          const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
          const isLoading = loadingMarketCaps[bet.id];
          
          return (
            <Link 
              key={bet.id} 
              to={`/token/${bet.tokenMint}`} 
              className="block"
            >
              <div 
                className={`bg-dream-foreground/5 rounded-md p-4 border transition-all cursor-pointer hover:bg-dream-foreground/10 ${
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
                      {isActive ? 'Active' : bet.status === 'won' ? 'Won' : 'Lost'}
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
                
                <div className="mt-2 text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-2">
                  {isActive ? (
                    <p>Betting against the house: If you win, you'll earn {bet.betAmount} PXB from the supply.</p>
                  ) : bet.status === 'won' ? (
                    <p>You won {bet.pointsWon} PXB from the house supply!</p>
                  ) : (
                    <p>Your {bet.betAmount} PXB has returned to the house supply.</p>
                  )}
                </div>
                
                <div className="mt-2 text-xs text-dream-foreground/60 flex items-center">
                  <span className="mr-1">Click to view token details</span>
                  <span className="text-dream-accent1">&rarr;</span>
                </div>
              </div>
            </Link>
          );
        })}
        
        {bets.length > 2 && !showAllBets && (
          <Button 
            variant="outline" 
            className="w-full mt-3 flex justify-center items-center"
            onClick={() => setShowAllBets(true)}
          >
            View All Bets <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PXBBetsList;
