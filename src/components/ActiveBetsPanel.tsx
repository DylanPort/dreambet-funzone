
import React from 'react';
import { Bet } from '@/types/bet';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BetCard from '@/components/BetCard';

interface ActiveBetsPanelProps {
  bets: Bet[];
  loading: boolean;
  refreshData: () => void;
  handleAcceptBet: (bet: Bet) => Promise<void>;
}

const ActiveBetsPanel: React.FC<ActiveBetsPanelProps> = ({
  bets,
  loading,
  refreshData,
  handleAcceptBet
}) => {
  const activeBets = bets.filter(bet => bet.status === 'open' || bet.status === 'matched');
  
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-bold">Active Bets</h2>
        <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {activeBets.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-dream-foreground/10 rounded-lg">
          <p className="text-dream-foreground/50 mb-3">No active bets for this token</p>
          <Button 
            variant="outline" 
            onClick={() => refreshData('up')}
          >
            Be the first to bet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeBets
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((bet) => (
              <BetCard 
                key={bet.id} 
                bet={bet}
                connected={true}
                publicKeyString={""}
                onAcceptBet={() => handleAcceptBet(bet)}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};

export default ActiveBetsPanel;
