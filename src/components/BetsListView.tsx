
import React from 'react';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

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
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/token/${bet.tokenId}`} className="block w-full">
                <div className="bg-dream-foreground/5 rounded-md p-4 border border-dream-foreground/10 hover:bg-dream-foreground/10 transition-colors">
                  <div className="flex items-center gap-4 justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center">
                        {bet.tokenSymbol.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium text-white">
                            {bet.tokenName} <ExternalLink className="w-3.5 h-3.5 inline text-gray-400" />
                          </h3>
                        </div>
                        <p className="text-dream-foreground/60">{bet.tokenSymbol}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {bet.prediction === 'migrate' ? (
                        <div className="bg-green-700 text-white rounded-md px-3 py-1.5 text-sm">
                          <ArrowUp className="w-3.5 h-3.5 inline mr-1" /> Moon
                        </div>
                      ) : (
                        <div className="bg-cyan-700 text-white rounded-md px-3 py-1.5 text-sm">
                          <ArrowDown className="w-3.5 h-3.5 inline mr-1" /> Die
                        </div>
                      )}
                      
                      {connected && publicKeyString !== bet.initiator && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            onAcceptBet(bet);
                          }}
                          className="bg-dream-accent1/80 hover:bg-dream-accent1 text-white rounded-md px-3 py-1.5 text-sm transition-colors"
                        >
                          Accept Bet
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-2 mt-2">
                    <p>Betting {bet.amount} SOL that this token will {bet.prediction === 'migrate' ? 'migrate' : 'fail'}</p>
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
