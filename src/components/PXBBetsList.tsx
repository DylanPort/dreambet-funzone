
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const PXBBetsList = () => {
  const { bets, fetchUserBets, isLoading } = usePXBPoints();

  useEffect(() => {
    console.log('PXBBetsList - Fetching user bets on mount');
    fetchUserBets();
  }, [fetchUserBets]);

  const handleRefresh = () => {
    console.log('PXBBetsList - Manual refresh triggered');
    toast.loading("Refreshing your bets...");
    fetchUserBets().then(() => {
      toast.success("Bets refreshed successfully");
    }).catch((error) => {
      console.error('Error refreshing bets:', error);
      toast.error("Failed to refresh bets");
    });
  };

  console.log('PXBBetsList - Current bets:', bets);

  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
          Your PXB Bets
        </h2>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-dream-accent1 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
            Your PXB Bets
          </h2>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
        <div className="text-center py-6">
          <p className="text-dream-foreground/70 mb-4">You haven't placed any PXB bets yet</p>
          <Button asChild>
            <Link to="/betting">Place Your First Bet</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center">
          <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
          Your PXB Bets ({bets.length})
        </h2>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>
      
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
                    <p className="font-semibold">{bet.tokenSymbol || 'Token'}</p>
                    <p className="text-xs text-dream-foreground/60">{bet.tokenName || 'Unknown Token'}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold">{bet.betAmount} PXB</p>
                  <p className="text-xs text-dream-foreground/60">
                    Prediction: {bet.betType === 'up' ? 'MOON' : 'DIE'} by {bet.percentageChange}%
                  </p>
                </div>
              </div>
              
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
                    Market cap change: {(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100).toFixed(2)}%
                  </span>
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
