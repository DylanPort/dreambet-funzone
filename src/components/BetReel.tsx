
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Wallet, Clock, Sparkles } from 'lucide-react';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchOpenBets } from "@/services/supabaseService";

const BetReel: React.FC = () => {
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        const bets = await fetchOpenBets();
        
        // Get only open or matched bets
        const active = bets.filter(bet => 
          bet.status === 'open' || bet.status === 'matched'
        );
        
        console.log('Active bets for reel:', active);
        setActiveBets(active);
      } catch (error) {
        console.error('Error fetching active bets for reel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();

    const channel = supabase
      .channel('public:bets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'bets' 
        }, 
        async (payload) => {
          console.log('New bet inserted in reel:', payload);
          
          try {
            const { data, error } = await supabase
              .from('bets')
              .select(`
                bet_id,
                token_mint,
                tokens (token_name, token_symbol),
                creator,
                prediction_bettor1,
                sol_amount,
                created_at,
                status,
                duration,
                on_chain_id,
                transaction_signature
              `)
              .eq('bet_id', payload.new.bet_id)
              .single();
            
            if (error) throw error;
            
            if (data && (data.status === 'open' || data.status === 'matched')) {
              let prediction: BetPrediction;
              if (data.prediction_bettor1 === 'up') {
                prediction = 'migrate';
              } else if (data.prediction_bettor1 === 'down') {
                prediction = 'die';
              } else {
                prediction = data.prediction_bettor1 as BetPrediction;
              }
              
              const status = data.status as BetStatus;
              
              const newBet: Bet = {
                id: data.bet_id,
                tokenId: data.token_mint,
                tokenName: data.tokens?.token_name || 'Unknown Token',
                tokenSymbol: data.tokens?.token_symbol || 'UNKNOWN',
                initiator: data.creator,
                amount: data.sol_amount,
                prediction: prediction,
                timestamp: new Date(data.created_at).getTime(),
                expiresAt: new Date(data.created_at).getTime() + (data.duration * 1000),
                status: status,
                duration: Math.floor(data.duration / 60),
                onChainBetId: data.on_chain_id?.toString() || '',
                transactionSignature: data.transaction_signature || ''
              };
              
              setActiveBets(prev => {
                const newBets = [newBet, ...prev.slice(0, 4)];
                return newBets;
              });
              
              setAnimateIndex(0);
              
              setTimeout(() => {
                setAnimateIndex(null);
              }, 3000);
            }
          } catch (error) {
            console.error('Error fetching new bet details:', error);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets'
        },
        (payload) => {
          console.log('Bet updated in reel:', payload);
          
          // If status changed, update or remove the bet from our list
          if (payload.new.status !== payload.old.status) {
            if (payload.new.status === 'open' || payload.new.status === 'matched') {
              // Refresh the bets list to include this updated bet
              fetchBets();
            } else {
              // Remove the bet from our list if it's no longer active
              setActiveBets(prev => prev.filter(bet => bet.id !== payload.new.bet_id));
            }
          }
        }
      )
      .subscribe();
    
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in BetReel:", event.detail);
      
      const { bet } = event.detail;
      
      if (bet && (bet.status === 'open' || bet.status === 'matched')) {
        setActiveBets(prev => {
          const exists = prev.some(existingBet => existingBet.id === bet.id);
          if (!exists) {
            const newBets = [bet, ...prev.slice(0, 4)];
            
            setAnimateIndex(0);
            
            setTimeout(() => {
              setAnimateIndex(null);
            }, 3000);
            
            return newBets;
          }
          return prev;
        });
      }
    };

    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
    };
  }, []);

  // Show loading state while fetching bets
  if (loading) {
    return (
      <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
            <Sparkles className="h-4 w-4 text-dream-accent1 mr-2" />
            <span className="text-sm font-semibold">Live Bets</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400">Loading active bets...</div>
          </div>
        </div>
      </div>
    );
  }

  if (activeBets.length === 0) {
    return (
      <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
            <Sparkles className="h-4 w-4 text-dream-accent1 mr-2" />
            <span className="text-sm font-semibold">Live Bets</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400 italic">No active bets at the moment</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
          <Sparkles className="h-4 w-4 text-dream-accent1 mr-2" />
          <span className="text-sm font-semibold">Live Bets</span>
        </div>
        
        <div className="overflow-hidden mx-4 flex-1">
          <div className="flex gap-6 items-center animate-scroll">
            {activeBets.map((bet, index) => (
              <Link
                key={`${bet.id}-${index}`}
                to={`/betting/token/${bet.tokenId}`}
                className={`flex-shrink-0 flex items-center bg-black/20 px-3 py-1 rounded-md border border-white/5 transition-all duration-500 hover:bg-black/40 
                  ${animateIndex === index ? 'animate-entrance' : ''}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2
                    ${bet.prediction === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {bet.prediction === 'migrate' 
                      ? <ArrowUp className="h-3 w-3" /> 
                      : <ArrowDown className="h-3 w-3" />}
                  </div>
                  <div className="mr-2">
                    <div className="text-xs font-semibold">{bet.tokenSymbol}</div>
                    <div className="text-[10px] text-gray-400">{bet.prediction.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center text-xs">
                    <Wallet className="h-3 w-3 mr-1 text-dream-accent2" />
                    <span className="font-semibold">{bet.amount} SOL</span>
                  </div>
                  <div className="ml-2 flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1 text-dream-accent3" />
                    <span className="text-gray-300">{formatTimeRemaining(bet.expiresAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetReel;
