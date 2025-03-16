
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PXBBet } from '@/types/pxb';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const PXBBetCreatedAlert: React.FC = () => {
  const [newBet, setNewBet] = useState<PXBBet | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleBetCreated = (event: CustomEvent) => {
      const { bet } = event.detail;
      console.log('PXBBetCreatedAlert received new bet:', bet);
      
      if (bet) {
        setNewBet(bet);
        setIsVisible(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    };

    window.addEventListener('pxbBetCreated', handleBetCreated as EventListener);
    
    return () => {
      window.removeEventListener('pxbBetCreated', handleBetCreated as EventListener);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!newBet) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="glass-panel p-4 flex items-center gap-4 max-w-md">
            <div className={`p-2 rounded-full ${
              newBet.betType === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {newBet.betType === 'up' ? (
                <ArrowUp className="h-6 w-6 text-green-400" />
              ) : (
                <ArrowDown className="h-6 w-6 text-red-400" />
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Bet Placed!</h4>
              <p className="text-sm text-dream-foreground/70">
                You bet {newBet.betAmount} PXB that {newBet.tokenSymbol} will {' '}
                <span className={newBet.betType === 'up' ? 'text-green-400' : 'text-red-400'}>
                  {newBet.betType === 'up' ? 'MOON' : 'DIE'}
                </span> by {newBet.percentageChange}%
              </p>
              <Link 
                to={`/betting/token/${newBet.tokenMint}`} 
                className="text-xs text-dream-accent2 hover:underline"
              >
                View bet details
              </Link>
            </div>
            
            <button 
              onClick={handleClose}
              className="p-1 hover:bg-dream-foreground/10 rounded-full"
            >
              <X className="h-4 w-4 text-dream-foreground/60" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PXBBetCreatedAlert;
