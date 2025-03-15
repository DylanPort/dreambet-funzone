import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, Wallet, Clock, Sparkles, Zap, ExternalLink } from 'lucide-react';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchOpenBets, fetchLatestBets } from "@/services/supabaseService";
import { toast } from 'sonner';

const BetReel: React.FC = () => {
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [latestBets, setLatestBets] = useState<Bet[]>([]);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchLatestBets(5, false);
      setLatestBets(data);
    } catch (error) {
      console.error('Error fetching latest bets:', error);
    }
  }, []);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        const bets = await fetchOpenBets();

        // Include open, matched, and expired bets in the reel
        const active = bets.filter(bet => bet.status === 'open' || bet.status === 'matched' || bet.status === 'expired');
        console.log('Active and expired bets for reel:', active);
        setActiveBets(active);
      } catch (error) {
        console.error('Error fetching bets for reel:', error);
        toast.error('Error loading bets');
      } finally {
        setLoading(false);
      }
    };
    fetchBets();
    const channel = supabase.channel('public:bets').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'bets'
    }, async payload => {
      console.log('New bet inserted in reel:', payload);
      try {
        const {
          data,
          error
        } = await supabase.from('bets').select(`
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
            `).eq('bet_id', payload.new.bet_id).single();
        if (error) throw error;
        if (data) {
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
            expiresAt: new Date(data.created_at).getTime() + data.duration * 1000,
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
          toast.success('New bet created!');
          setTimeout(() => {
            setAnimateIndex(null);
          }, 3000);
        }
      } catch (error) {
        console.error('Error fetching new bet details:', error);
      }
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'bets'
    }, payload => {
      console.log('Bet updated in reel:', payload);

      // If status changed to expired, keep showing it
      if (payload.new.status !== payload.old.status) {
        if (payload.new.status === 'open' || payload.new.status === 'matched' || payload.new.status === 'expired') {
          // Refresh the bets list to include this updated bet
          fetchBets();

          // Show toast for expired bets
          if (payload.new.status === 'expired') {
            toast.info('A bet has expired', {
              description: 'Check the bet details for more information'
            });
          }
        } else {
          // Remove the bet from our list if it's no longer active or expired
          setActiveBets(prev => prev.filter(bet => bet.id !== payload.new.bet_id));
        }
      }
    }).subscribe();
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in BetReel:", event.detail);
      const {
        bet
      } = event.detail;
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
    return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
            <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">ACTIVE BETS</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400">Loading active bets...</div>
          </div>
        </div>
      </div>;
  }
  if (activeBets.length === 0) {
    return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden py-[3px] my-[36px]">
        <div className="flex items-center">
          <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
            <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-4 w-26 mr-1 object-cover" />
            <span className="text-sm font-semibold">ACTIVE BETS</span>
          </div>
          <div className="overflow-hidden mx-4 flex-1">
            <div className="text-sm text-gray-400 italic">No active or expired bets at the moment</div>
          </div>
        </div>
      </div>;
  }
  return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 py-2 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
          <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-5 w-5 mr-2" />
          <span className="text-sm font-semibold">ACTIVE BETS</span>
        </div>
        
        <div className="flex items-center ml-auto mr-4">
          <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
            <Zap className="w-3 h-3" />
            <span>0.6</span>
          </div>
        </div>
        
        <div className="overflow-hidden mr-4 flex-1">
          <div className="flex gap-6 items-center animate-scroll">
            {activeBets.map((bet, index) => <Link key={`${bet.id}-${index}`} to={`/betting/token/${bet.tokenId}`} className={`flex-shrink-0 flex items-center glass-panel px-3 py-2 rounded-md border ${bet.status === 'expired' ? 'border-amber-500/30' : 'border-white/5'} transition-all duration-500 hover:bg-black/40 
                  ${animateIndex === index ? 'animate-entrance' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold text-sm">{bet.tokenSymbol.charAt(0)}</span>
                  </div>
                  
                  <div className="mr-2">
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-semibold">{bet.tokenName}</div>
                      <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-dream-foreground/60">
                      <span>{bet.tokenSymbol}</span>
                      <span className="flex items-center">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        <span>{formatTimeRemaining(bet.expiresAt)}</span>
                      </span>
                      {bet.status === 'expired' && <span className="bg-amber-500/20 text-amber-400 px-1 rounded-sm">
                          Expired
                        </span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    <div className={`flex items-center px-2 py-0.5 rounded-md text-xs
                      ${bet.prediction === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {bet.prediction === 'migrate' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      <span>{bet.prediction === 'migrate' ? 'Moon' : 'Die'}</span>
                    </div>
                    
                    <div className="flex items-center text-xs bg-dream-accent2/10 px-2 py-0.5 rounded-md">
                      <Wallet className="h-3 w-3 mr-1 text-dream-accent2" />
                      <span className="font-semibold">{bet.amount} SOL</span>
                    </div>
                  </div>
                </div>
              </Link>)}
          </div>
        </div>
      </div>
    </div>;
};

export default BetReel;
