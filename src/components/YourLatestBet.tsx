
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { PXBBet } from '@/types/pxb';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface YourLatestBetProps {
  tokenId: string;
  tokenSymbol: string;
}

const YourLatestBet: React.FC<YourLatestBetProps> = ({ tokenId, tokenSymbol }) => {
  const { bets, fetchUserBets, isLoading } = usePXBPoints();
  const [tokenBet, setTokenBet] = useState<PXBBet | null>(null);

  useEffect(() => {
    console.log('YourLatestBet - Checking bets for token:', tokenId);
    fetchUserBets();
  }, [tokenId, fetchUserBets]);

  useEffect(() => {
    // Find the latest bet for this token
    if (bets && bets.length > 0) {
      console.log('YourLatestBet - Filtering bets for token:', tokenId);
      const tokenBets = bets.filter(bet => bet.tokenMint === tokenId);
      
      if (tokenBets.length > 0) {
        // Sort by creation date, newest first
        const sortedBets = [...tokenBets].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTokenBet(sortedBets[0]);
        console.log('YourLatestBet - Found latest bet for token:', sortedBets[0]);
      } else {
        console.log('YourLatestBet - No bets found for this token');
        setTokenBet(null);
      }
    } else {
      console.log('YourLatestBet - No bets available at all');
      setTokenBet(null);
    }
  }, [bets, tokenId]);

  const handleRefresh = () => {
    console.log('YourLatestBet - Manual refresh triggered');
    toast.loading("Refreshing your bets...");
    fetchUserBets().then(() => {
      toast.success("Bets refreshed successfully");
    }).catch((error) => {
      console.error('Error refreshing bets:', error);
      toast.error("Failed to refresh bets");
    });
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-display font-semibold mb-4">Your Latest Bet on {tokenSymbol}</h2>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-dream-accent1 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!tokenBet) {
    return (
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">Your Latest Bet on {tokenSymbol}</h2>
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
          <p className="text-dream-foreground/70 mb-4">You haven't placed any bets on this token yet</p>
          <Button>Place Your First Bet</Button>
        </div>
      </div>
    );
  }

  const expiryDate = new Date(tokenBet.expiresAt);
  const isActive = tokenBet.status === 'pending';
  const timeLeft = isActive ? formatDistanceToNow(expiryDate, { addSuffix: true }) : '';

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-semibold">Your Latest Bet on {tokenSymbol}</h2>
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
      
      <div className={`bg-dream-foreground/5 rounded-md p-4 border transition-all ${
        isActive 
          ? 'border-yellow-400/30 animate-pulse-slow' 
          : tokenBet.status === 'won' 
            ? 'border-green-400/30' 
            : 'border-red-400/30'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-lg font-semibold">
              {tokenBet.betType === 'up' ? 'MOON 🚀' : 'DIE 💀'} by {tokenBet.percentageChange}%
            </p>
            <p className="text-dream-foreground/60">
              {tokenBet.betAmount} PXB Points
            </p>
          </div>
          
          <div className="text-right">
            <p className={`font-semibold ${
              isActive 
                ? 'text-yellow-400' 
                : tokenBet.status === 'won' 
                  ? 'text-green-400' 
                  : 'text-red-400'
            }`}>
              {isActive ? 'ACTIVE' : tokenBet.status === 'won' ? 'WON' : 'LOST'}
            </p>
            {isActive && (
              <p className="text-dream-foreground/60 text-sm">
                Ends {timeLeft}
              </p>
            )}
            {tokenBet.status === 'won' && (
              <p className="text-green-400">
                +{tokenBet.pointsWon} PXB
              </p>
            )}
          </div>
        </div>
        
        {isActive && tokenBet.initialMarketCap && (
          <div className="mt-2 p-2 bg-dream-foreground/10 rounded-md">
            <p className="text-sm">
              Initial Market Cap: ${tokenBet.initialMarketCap.toLocaleString()}
            </p>
            <p className="text-sm">
              Target: {tokenBet.betType === 'up' ? '>' : '<'} ${((tokenBet.initialMarketCap * (1 + (tokenBet.betType === 'up' ? tokenBet.percentageChange : -tokenBet.percentageChange) / 100))).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourLatestBet;
