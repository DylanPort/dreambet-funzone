import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { Token } from '@/types/token';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetReelProps {
  tokens: Token[];
}

const BetReel: React.FC<BetReelProps> = ({ tokens }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Generate random bets
  useEffect(() => {
    if (tokens.length === 0) return;

    const generateRandomBet = () => {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const predictionType = Math.random() > 0.5 ? 'up' : 'down' as BetPrediction;
      const randomAmount = Math.floor(Math.random() * 1000) + 100;
      const duration = [300, 600, 900, 1800, 3600][Math.floor(Math.random() * 5)];
      const status = Math.random() > 0.7 ? 'active' : 'pending';

      return {
        id: crypto.randomUUID(),
        tokenId: token.id,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        initiator: "0xRandomAddress",
        amount: randomAmount,
        prediction: predictionType,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration * 1000,
        status: status as BetStatus,
        duration: duration,
        onChainBetId: "mocked-id",
        transactionSignature: "mocked-signature",
        tokenMint: token.id,
      };
    };

    // Initial bets
    const initialBets = Array(10)
      .fill(null)
      .map(() => generateRandomBet());
    
    setBets(initialBets);

    // Add new bet every 3-7 seconds
    const interval = setInterval(() => {
      if (!isPaused) {
        setBets(prevBets => {
          const newBets = [...prevBets, generateRandomBet()];
          if (newBets.length > 20) {
            return newBets.slice(1);
          }
          return newBets;
        });
      }
    }, Math.random() * 4000 + 3000);

    return () => clearInterval(interval);
  }, [tokens, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className="w-full overflow-hidden glass-panel p-4 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-dream-background/80 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-dream-background/80 to-transparent z-10"></div>
      </div>
      
      <h3 className="text-xl font-bold mb-4 text-gradient">Live Bets Feed</h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-dream-accent3/30 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {bets.map((bet, index) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "glass-panel p-3 flex items-center justify-between gap-3 border",
                bet.prediction === 'up' 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-red-500/30 bg-red-500/5",
                bet.status === 'active' && "animate-pulse-slow"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  bet.prediction === 'up' ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                  {bet.prediction === 'up' 
                    ? <ArrowUpCircle className="text-green-500" /> 
                    : <ArrowDownCircle className="text-red-500" />}
                </div>
                
                <div>
                  <div className="font-medium">{bet.tokenName} ({bet.tokenSymbol})</div>
                  <div className="text-sm text-dream-foreground/60 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(bet.expiresAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={cn(
                  "font-bold",
                  bet.prediction === 'up' ? "text-green-400" : "text-red-400"
                )}>
                  {bet.amount.toLocaleString()} PXB
                </div>
                <div className="text-xs text-dream-foreground/60">
                  {bet.status === 'active' ? 'Active' : 'Pending'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BetReel;
