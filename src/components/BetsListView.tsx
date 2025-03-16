
import React from 'react';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { formatTimeRemaining } from '@/utils/betUtils';

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
    <div className="space-y-2">
      <AnimatePresence>
        {topBets.map((bet, index) => {
          // Generate a unique key combining multiple identifiers
          const uniqueKey = `${bet.id || 'unknown'}-${bet.onChainBetId || 'nochain'}-${
            bet.transactionSignature ? bet.transactionSignature.substring(0, 8) : ''
          }-${index}`;
          
          // Mock market cap data for display
          const startMcap = 1000;
          const currentMcap = bet.prediction === 'migrate' ? 3640 : 400;
          const targetMcap = bet.prediction === 'migrate' ? 1100 : 500;
          const progressPercentage = bet.prediction === 'migrate' ? 100 : 75;
          const currentChange = bet.prediction === 'migrate' ? 264 : -60;
          const targetChange = bet.prediction === 'migrate' ? 10 : -50;
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/token/${bet.tokenId}`} className="block w-full">
                <div className="bg-black/80 rounded-md p-4 border border-dream-foreground/10 hover:bg-black/70 transition-colors">
                  {/* Header section with token and amount */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/50 to-dream-accent2/50 flex items-center justify-center">
                        <ArrowUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">{bet.tokenSymbol}</div>
                        <div className="text-xs text-dream-foreground/60">{bet.tokenName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-white font-semibold">{bet.amount} SOL</div>
                      <div className="text-xs text-dream-foreground/60">
                        Prediction: {bet.prediction === 'migrate' ? 'MOON' : 'DIE'} by {targetChange}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Cap Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                      <div className="text-xs text-dream-foreground/50 mb-1">Start MCAP</div>
                      <div className="text-sm font-medium text-white">${startMcap.toFixed(2)}K</div>
                    </div>
                    <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                      <div className="text-xs text-dream-foreground/50 mb-1">Current MCAP</div>
                      <div className="text-sm font-medium text-white">${(currentMcap/1000).toFixed(2)}K</div>
                    </div>
                    <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
                      <div className="text-xs text-dream-foreground/50 mb-1">Target MCAP</div>
                      <div className="text-sm font-medium text-white">${(targetMcap/1000).toFixed(2)}K</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-dream-foreground/60">Progress towards target</span>
                      <span className={bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}>
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-dream-foreground/60 mt-1">
                      Current change: {currentChange.toFixed(2)}% / Target: {bet.prediction === 'migrate' ? '+' : ''}{targetChange}%
                    </div>
                  </div>
                  
                  {/* Status and info section */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center text-yellow-400">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Active</span>
                      <span className="ml-2 text-dream-foreground/60">
                        Ends in {Math.floor(Math.random() * 30) + 1} minutes
                      </span>
                    </div>
                    
                    {connected && publicKeyString !== bet.initiator && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          onAcceptBet(bet);
                        }}
                        className="bg-dream-accent1/80 hover:bg-dream-accent1 text-white rounded-md px-3 py-1 text-sm transition-colors"
                      >
                        Accept Bet
                      </button>
                    )}
                  </div>
                  
                  {/* House betting explanation */}
                  <div className="mt-2 text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-2">
                    <p>Betting against the house: If you win, you'll earn {bet.amount} SOL from the supply.</p>
                  </div>
                </div>
              </Link>
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
