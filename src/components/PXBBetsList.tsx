
import React, { useEffect } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Check, X, Clock, ArrowUp, ArrowDown } from 'lucide-react';

const PXBBetsList: React.FC = () => {
  const { bets, fetchUserBets, isLoading } = usePXBPoints();

  useEffect(() => {
    fetchUserBets();
  }, [fetchUserBets]);

  if (isLoading) {
    return (
      <div className="glass-panel p-4 space-y-4">
        <div className="h-6 bg-dream-foreground/10 rounded w-1/4 mb-2"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-dream-foreground/5 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-dream-foreground/10 rounded w-1/3"></div>
              <div className="h-4 bg-dream-foreground/10 rounded w-1/5"></div>
            </div>
            <div className="h-3 bg-dream-foreground/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/70 mb-2">No bets placed yet</p>
        <p className="text-sm text-dream-foreground/50">Place your first bet on a token to see it here</p>
      </div>
    );
  }

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    return `${minutes}m ${seconds}s`;
  };

  const getBetStatusIcon = (status: string) => {
    switch(status) {
      case 'won':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'lost':
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-dream-accent2" />;
    }
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="font-semibold text-lg mb-4">Your Bets</h3>
      
      <div className="space-y-3">
        {bets.map(bet => (
          <div key={bet.id} className={`p-3 rounded-lg ${
            bet.status === 'pending' ? 'bg-dream-foreground/5' : 
            bet.status === 'won' ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            <div className="flex justify-between">
              <div className="flex items-center">
                <div className="mr-2">
                  {getBetStatusIcon(bet.status)}
                </div>
                <span className="font-medium">{bet.tokenSymbol}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <span className={bet.status === 'won' ? 'text-green-400' : 
                  bet.status === 'lost' ? 'text-red-400' : 'text-dream-foreground/70'}>
                  {bet.status === 'won' ? `+${bet.pointsWon} PXB` : 
                   bet.status === 'lost' ? '-' + bet.betAmount + ' PXB' : 
                   bet.betAmount + ' PXB'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-dream-foreground/60">
              <div className="flex items-center">
                {bet.betType === 'up' ? (
                  <ArrowUp className="w-3 h-3 mr-1 text-green-400" />
                ) : (
                  <ArrowDown className="w-3 h-3 mr-1 text-red-400" />
                )}
                <span>{bet.betType === 'up' ? 'Moon' : 'Die'}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>
                  {bet.status === 'pending' ? getTimeRemaining(bet.expiresAt) : 
                   new Date(bet.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PXBBetsList;
