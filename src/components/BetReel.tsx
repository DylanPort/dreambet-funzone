import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { fetchLatestBets } from '@/services/supabaseService';

const BetReel = () => {
  const [bets, setBets] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of latest bets
    const loadBets = async () => {
      try {
        const latestBets = await fetchLatestBets();
        setBets(latestBets);
      } catch (error) {
        console.error('Error loading bets for reel:', error);
      }
    };
    
    loadBets();
    
    // Set up subscription for new bets
    const subscription = supabase
      .channel('public:bets')
      .on('INSERT', (payload) => {
        // Add the new bet to the list
        setBets(prevBets => {
          // Add the new bet to the beginning
          const newBet = payload.new;
          
          // Show notification for newly created bet
          toast.success(
            <div className="flex items-center">
              <span className="mr-2">New bet created for {newBet.tokens?.token_symbol || 'token'}</span>
              <span className={`flex items-center text-sm px-2 py-0.5 rounded ${
                newBet.prediction_bettor1 === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {newBet.prediction_bettor1 === 'migrate' ? 
                  <><ArrowUp className="w-3 h-3 mr-1" /> Moon</> : 
                  <><ArrowDown className="w-3 h-3 mr-1" /> Die</>
                }
              </span>
            </div>,
            {
              description: `${newBet.sol_amount} SOL - Expires in ${
                Math.floor((new Date(newBet.expires_at).getTime() - new Date(newBet.created_at).getTime()) / (1000 * 60))
              } minutes`,
              action: {
                label: "View",
                onClick: () => window.location.href = `/betting/token/${newBet.token_mint}`
              }
            }
          );
          
          // Only keep the most recent 20 bets
          const updatedBets = [
            {
              id: newBet.bet_id,
              tokenId: newBet.token_mint,
              tokenName: newBet.tokens?.token_name || 'Unknown Token',
              tokenSymbol: newBet.tokens?.token_symbol || '???',
              initiator: newBet.creator,
              amount: newBet.sol_amount,
              pointsAmount: newBet.points_amount || 0,
              prediction: newBet.prediction_bettor1,
              timestamp: new Date(newBet.created_at).getTime(),
              expiresAt: new Date(newBet.expires_at).getTime(),
              timeRemaining: Math.floor((new Date(newBet.created_at).getTime() + (newBet.duration * 60000) - Date.now()) / 60000),
              status: newBet.status,
              duration: newBet.duration,
              onChainBetId: newBet.on_chain_id || null,
              transactionSignature: newBet.transaction_signature || null
            },
            ...prevBets
          ].slice(0, 20);
          
          return updatedBets;
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < bets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getBetTypeColor = (prediction: string) => {
    return prediction === 'migrate' ? 'text-green-400' : 'text-red-400';
  };

  const getBetTypeBackground = (prediction: string) => {
    return prediction === 'migrate' ? 'bg-green-400/10' : 'bg-red-400/10';
  };

  const getBetIcon = (prediction: string) => {
    return prediction === 'migrate' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  if (bets.length === 0) {
    return null;
  }

  return (
    <div className="relative py-2 backdrop-blur-md bg-gradient-to-r from-dream-accent1/10 via-dream-background/0 to-dream-accent2/10 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <button 
            onClick={scrollLeft} 
            className="p-1 rounded-full bg-dream-background/20 text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-background/40 transition-colors"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
          <button 
            onClick={scrollRight} 
            className="p-1 rounded-full bg-dream-background/20 text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-background/40 transition-colors"
            disabled={currentIndex === bets.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div ref={scrollRef} className="flex items-center overflow-hidden h-10">
          <motion.div
            className="flex items-center gap-6"
            animate={{ x: -currentIndex * 280 }}
            transition={{ ease: "easeInOut", duration: 0.5 }}
          >
            {bets.map((bet, index) => (
              <Link 
                key={bet.id} 
                to={`/betting/token/${bet.tokenId}`}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${getBetTypeBackground(bet.prediction)}`}>
                  <span className={getBetTypeColor(bet.prediction)}>{getBetIcon(bet.prediction)}</span>
                  <span className="text-xs font-medium">{bet.prediction === 'migrate' ? 'Moon' : 'Die'}</span>
                </div>
                
                <span className="text-sm text-dream-foreground/80">
                  <span className="font-semibold">{bet.tokenSymbol}</span>
                  <span className="mx-1 text-dream-foreground/40">|</span>
                  <span>{bet.amount} SOL</span>
                  <span className="mx-1 text-dream-foreground/40">|</span>
                  <span>{Math.max(0, Math.floor((bet.expiresAt - Date.now()) / 60000))}m left</span>
                </span>
                
                <ArrowRight className="w-3 h-3 text-dream-foreground/40" />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BetReel;
