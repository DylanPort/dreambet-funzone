
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

const PXBBetsList = () => {
  const { bets, fetchUserBets } = usePXBPoints();

  useEffect(() => {
    fetchUserBets();
  }, [fetchUserBets]);

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
    
    // Get current market cap change percentage if available
    if (bet.currentMarketCap && bet.initialMarketCap) {
      const actualChange = ((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
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
          
          // Determine progress bar color based on bet type
          const progressColor = bet.betType === 'up' ? 'bg-green-500' : 'bg-red-500';
          
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
                  {bet.currentMarketCap && bet.initialMarketCap && (
                    <div className="text-xs text-dream-foreground/60 mt-1">
                      Market cap change: {(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100).toFixed(2)}%
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
                
                {!isActive && bet.currentMarketCap && bet.initialMarketCap && (
                  <span className="text-dream-foreground/60">
                    Final market cap change: {(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100).toFixed(2)}%
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
