
import React from 'react';
import BetCard from './BetCard';
import { Bet } from '@/types/bet';

interface BetsListViewProps {
  bets: Bet[];
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
}

const BetsListView: React.FC<BetsListViewProps> = ({ 
  bets, 
  connected, 
  publicKeyString, 
  onAcceptBet 
}) => {
  // Ensure bets is always an array
  const validBets = Array.isArray(bets) ? bets : [];
  
  if (validBets.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/70">No bets available in this category.</p>
        <p className="text-sm mt-2">Check back soon or create your own bet on a Pump Fun token!</p>
      </div>
    );
  }

  console.log('Rendering BetsListView with bets:', validBets);

  // Limit to top 10 bets
  const topBets = validBets.slice(0, 10);
  
  return (
    <div className="space-y-4">
      {topBets.map((bet, index) => (
        <BetCard
          key={`${bet.id || bet.onChainBetId || index}-${index}`}
          bet={bet}
          connected={connected}
          publicKeyString={publicKeyString}
          onAcceptBet={onAcceptBet}
        />
      ))}
      
      {validBets.length > 10 && (
        <div className="text-center mt-4 text-sm text-dream-foreground/70">
          Showing top 10 of {validBets.length} bets
        </div>
      )}
    </div>
  );
};

export default BetsListView;
