
import React from 'react';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from './ui/progress';
import { Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  
  // Helper function to format market cap values
  const formatMarketCap = (value: number | undefined) => {
    if (!value) return 'N/A';
    return `$${(value / 1000).toFixed(2)}K`;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {topBets.map((bet, index) => {
          // Generate a unique key combining multiple identifiers
          const uniqueKey = `${bet.id || 'unknown'}-${bet.onChainBetId || 'nochain'}-${
            bet.transactionSignature ? bet.transactionSignature.substring(0, 8) : ''
          }-${index}`;
          
          // Calculate progress percentages
          const progress = bet.initialMarketCap && bet.currentMarketCap 
            ? Math.min(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100, 100)
            : 0;
            
          // Format change percentage
          const changePercentage = bet.initialMarketCap && bet.currentMarketCap
            ? ((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100
            : 0;
            
          // Calculate target market cap
          const targetMcap = bet.initialMarketCap 
            ? bet.initialMarketCap * (bet.prediction === 'migrate' ? 1.1 : 0.9)
            : 0;
            
          // Format time remaining
          const expiryDate = new Date(bet.expiresAt);
          const timeLeft = formatDistanceToNow(expiryDate, { addSuffix: false });
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-lg overflow-hidden bg-black/80 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              
              <div className="p-4 relative z-10">
                {/* Header: Token Name and Prediction */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                      {bet.prediction === 'migrate' 
                        ? <ArrowUp className="h-4 w-4 text-green-400" />
                        : <ArrowDown className="h-4 w-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <div className="text-white font-semibold">{bet.tokenName || bet.tokenSymbol}</div>
                      <div className="text-xs text-white/60">{bet.tokenSymbol}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold">{bet.amount} SOL</div>
                    <div className="text-sm text-white/60">
                      Prediction: MOON by 10%
                    </div>
                  </div>
                </div>
                
                {/* Market Cap Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-black/40 p-2 rounded">
                    <div className="text-xs text-white/60 mb-1">Start MCAP</div>
                    <div className="font-medium">
                      {formatMarketCap(bet.initialMarketCap)}
                    </div>
                  </div>
                  <div className="bg-black/40 p-2 rounded">
                    <div className="text-xs text-white/60 mb-1">Current MCAP</div>
                    <div className="font-medium">
                      {formatMarketCap(bet.currentMarketCap)}
                    </div>
                  </div>
                  <div className="bg-black/40 p-2 rounded">
                    <div className="text-xs text-white/60 mb-1">Target MCAP</div>
                    <div className="font-medium">
                      {formatMarketCap(targetMcap)}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="text-white/60">Progress towards target</div>
                    <div className="text-green-400">
                      {progress.toFixed(1)}%
                    </div>
                  </div>
                  
                  <Progress value={progress} className="h-2 bg-black/30" />
                  
                  <div className="text-xs text-white/60 mt-1">
                    Current change: {changePercentage.toFixed(2)}% / Target: +10%
                  </div>
                </div>
                
                {/* Status and Timer */}
                <div className="flex items-center text-sm mt-3">
                  <div className="flex items-center text-yellow-400">
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center mr-2">
                      <span className="text-xs">!</span>
                    </div>
                    <span>Active</span>
                  </div>
                  
                  <div className="ml-2 text-white/60 flex items-center">
                    <span className="mr-1">Ends in</span>
                    <span>{timeLeft}</span>
                  </div>
                </div>
                
                {/* Betting Info */}
                <div className="mt-2 text-sm text-white/60">
                  Betting against the house: If you win, you'll earn 10 PXB from the supply.
                </div>
              </div>
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
