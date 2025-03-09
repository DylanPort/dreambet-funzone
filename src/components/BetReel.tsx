
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Wallet, Clock, Sparkles } from 'lucide-react';
import { Bet, BetPrediction } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const BetReel: React.FC = () => {
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);

  useEffect(() => {
    // Function to fetch some initial bets
    const fetchInitialBets = async () => {
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
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (data) {
          const formattedBets = data.map(bet => {
            // Convert database prediction to BetPrediction type
            let prediction: BetPrediction;
            if (bet.prediction_bettor1 === 'up') {
              prediction = 'migrate';
            } else if (bet.prediction_bettor1 === 'down') {
              prediction = 'die';
            } else {
              // Ensure we're casting to a valid BetPrediction value
              prediction = bet.prediction_bettor1 as BetPrediction;
            }

            return {
              id: bet.bet_id,
              tokenId: bet.token_mint,
              tokenName: bet.tokens?.token_name || 'Unknown Token',
              tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
              initiator: bet.creator,
              amount: bet.sol_amount,
              prediction: prediction,
              timestamp: new Date(bet.created_at).getTime(),
              expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
              status: bet.status,
              duration: Math.floor(bet.duration / 60),
              onChainBetId: bet.on_chain_id?.toString() || '',
              transactionSignature: bet.transaction_signature || ''
            };
          });
          
          setRecentBets(formattedBets);
        }
      } catch (error) {
        console.error('Error fetching initial bets:', error);
      }
    };

    fetchInitialBets();

    // Set up supabase realtime subscription
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
            // Fetch the complete bet data with token info
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
            
            if (data) {
              // Convert database prediction to BetPrediction type
              let prediction: BetPrediction;
              if (data.prediction_bettor1 === 'up') {
                prediction = 'migrate';
              } else if (data.prediction_bettor1 === 'down') {
                prediction = 'die';
              } else {
                // Ensure we're casting to a valid BetPrediction value
                prediction = data.prediction_bettor1 as BetPrediction;
              }
              
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
                status: data.status,
                duration: Math.floor(data.duration / 60),
                onChainBetId: data.on_chain_id?.toString() || '',
                transactionSignature: data.transaction_signature || ''
              };
              
              // Add the new bet to the beginning of the array
              setRecentBets(prev => {
                const newBets = [newBet, ...prev.slice(0, 4)]; // Keep only 5 bets
                return newBets;
              });
              
              // Set the animate index to trigger animation
              setAnimateIndex(0);
              
              // Reset animation after it completes
              setTimeout(() => {
                setAnimateIndex(null);
              }, 3000);
            }
          } catch (error) {
            console.error('Error fetching new bet details:', error);
          }
        }
      )
      .subscribe();
    
    // Also listen for custom events from the app
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in BetReel:", event.detail);
      
      const { bet } = event.detail;
      
      if (bet) {
        setRecentBets(prev => {
          // Check if the bet already exists
          const exists = prev.some(existingBet => existingBet.id === bet.id);
          if (!exists) {
            const newBets = [bet, ...prev.slice(0, 4)]; // Keep only 5 bets
            
            // Set the animate index to trigger animation
            setAnimateIndex(0);
            
            // Reset animation after it completes
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

  if (recentBets.length === 0) {
    return null; // Don't render anything if there are no bets
  }

  return (
    <div className="bet-reel-container bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
          <Sparkles className="h-4 w-4 text-dream-accent1 mr-2" />
          <span className="text-sm font-semibold">Live Bets</span>
        </div>
        
        <div className="overflow-hidden mx-4 flex-1">
          <div className="flex gap-6 items-center">
            {recentBets.map((bet, index) => (
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
