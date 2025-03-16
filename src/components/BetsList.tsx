
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BetsListProps {
  bets: any[];
  isLoadingBets?: boolean;
  refreshBets?: () => void;
}

const BetsList: React.FC<BetsListProps> = ({ 
  bets, 
  isLoadingBets = false, 
  refreshBets 
}) => {
  if (isLoadingBets) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-dream-accent1 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-dream-foreground/70 mb-4">No active bets for this token yet</p>
        <p className="text-dream-foreground/50 text-sm">Be the first to create a bet!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshBets}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <div className="space-y-4">
        {bets.map((bet) => (
          <div key={bet.id} className="bg-dream-foreground/5 rounded-md p-4 border border-dream-foreground/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">
                  {bet.predictionType === 'up' ? 'Price Up' : 'Price Down'} {bet.percentage}%
                </p>
                <p className="text-dream-foreground/60 text-sm">
                  {bet.bettor} wagered {bet.amount} SOL
                </p>
              </div>
              <div className="text-right">
                <p className="text-dream-accent1 font-semibold">Active</p>
                <p className="text-dream-foreground/60 text-xs">
                  Ends in {bet.timeLeft}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BetsList;
