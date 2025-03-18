
import React, { useRef } from 'react';
import { Bet } from '@/types/bet';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface MobileBetScrollerProps {
  bets: Bet[];
  betCountsByToken: Record<string, BetCountStats>;
}

const MobileBetScroller: React.FC<MobileBetScrollerProps> = ({ bets, betCountsByToken }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <button 
          onClick={scrollLeft} 
          className="p-2 rounded-full bg-dream-background/40 backdrop-blur-sm text-dream-foreground hover:bg-dream-background/60 transition-colors border border-dream-accent1/20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-sm text-dream-foreground/60">Scroll to view more</div>
        <button 
          onClick={scrollRight} 
          className="p-2 rounded-full bg-dream-background/40 backdrop-blur-sm text-dream-foreground hover:bg-dream-background/60 transition-colors border border-dream-accent2/20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={scrollContainerRef} 
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence>
          {bets.map((bet, index) => (
            <motion.div 
              key={bet.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-w-[350px] w-[350px] snap-center"
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
                isMobile={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MobileBetScroller;
