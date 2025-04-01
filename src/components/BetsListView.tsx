
import React from 'react';
import BetCard from './BetCard';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import PXBTokenCard from './PXBTokenCard';

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
      <div className="backdrop-blur-lg bg-black/20 border border-white/10 rounded-xl p-6 text-center">
        <p className="text-dream-foreground/70">No bets available in this category.</p>
        <p className="text-sm mt-2">Check back soon or create your own bet on a Pump Fun token!</p>
      </div>
    );
  }

  console.log('Rendering BetsListView with bets:', validBets);

  // Safely limit to top 10 bets
  const topBets = validBets.slice(0, Math.min(10, validBets.length));
  
  return (
    <div className="space-y-5">
      <AnimatePresence>
        {topBets.map((bet, index) => {
          // Generate a unique key combining multiple identifiers
          const uniqueKey = `${bet.id || 'unknown'}-${bet.onChainBetId || 'nochain'}-${
            bet.transactionSignature ? bet.transactionSignature.substring(0, 8) : ''
          }-${index}`;
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
            >
              <BetCard
                bet={bet}
                connected={connected}
                publicKeyString={publicKeyString}
                onAcceptBet={onAcceptBet}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {validBets.length > 10 && (
        <div className="text-center mt-4 text-sm text-dream-foreground/70">
          Showing top 10 of {validBets.length} bets
        </div>
      )}
    </div>
  );
};

export default BetsListView;
