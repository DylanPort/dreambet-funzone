
import React from 'react';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import BetStatsCard from './BetStatsCard';

interface BetCountStats {
  moon: number;
  dust: number;
  moonPercentage: number;
  dustPercentage: number;
  moonWins: number;
  dustWins: number;
  moonLosses: number;
  dustLosses: number;
  averageMoonMarketCap: number;
  averageDustMarketCap: number;
  totalVolume: number;
}

interface DesktopBetsListProps {
  bets: Bet[];
  betCountsByToken: Record<string, BetCountStats>;
}

const DesktopBetsList: React.FC<DesktopBetsListProps> = ({ bets, betCountsByToken }) => {
  return (
    <AnimatePresence>
      {bets.map(bet => (
        <motion.div 
          key={bet.id} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <BetStatsCard 
            bet={bet} 
            betStats={betCountsByToken[bet.tokenId] || {
              moon: 0,
              dust: 0,
              moonPercentage: 0,
              dustPercentage: 0,
              moonWins: 0,
              dustWins: 0,
              moonLosses: 0,
              dustLosses: 0,
              averageMoonMarketCap: 0,
              averageDustMarketCap: 0,
              totalVolume: 0
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default DesktopBetsList;
