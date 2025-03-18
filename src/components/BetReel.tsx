import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Wallet, Clock, Sparkles, Zap, ExternalLink } from 'lucide-react';
import { Bet, BetPrediction, BetStatus } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchOpenBets } from "@/services/supabaseService";
import { toast } from 'sonner';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
const BetReel: React.FC = () => {
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    bets: pxbBets
  } = usePXBPoints();
  const {
    publicKey
  } = useWallet();
  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        const bets = await fetchOpenBets();
        const active = bets.filter(bet => bet.status === 'open' || bet.status === 'matched' || bet.status === 'expired');
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        let fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        const now = Date.now();
        fallbackBets = fallbackBets.filter(bet => bet.expiresAt > now);
        const convertedPXBBets: Bet[] = pxbBets.filter(pb => pb.status === 'pending').map(pb => ({
          id: pb.id,
          tokenId: pb.tokenMint,
          tokenName: pb.tokenName,
          tokenSymbol: pb.tokenSymbol,
          tokenMint: pb.tokenMint,
          initiator: publicKey?.toString() || '',
          amount: pb.betAmount,
          prediction: pb.betType === 'up' ? 'migrate' : 'die',
          timestamp: new Date(pb.createdAt).getTime(),
          expiresAt: new Date(pb.expiresAt).getTime(),
          status: 'open' as BetStatus,
          duration: 30,
          onChainBetId: '',
          transactionSignature: ''
        }));
        const combinedBets = [...active];
        fallbackBets.forEach(fallbackBet => {
          if (!combinedBets.some(bet => bet.id === fallbackBet.id)) {
            combinedBets.push(fallbackBet);
          }
        });
        convertedPXBBets.forEach(pxbBet => {
          if (!combinedBets.some(bet => bet.id === pxbBet.id)) {
            combinedBets.push(pxbBet);
          }
        });
        console.log('Active and expired bets for reel:', combinedBets);
        const updatedBets = combinedBets.map(bet => {
          if (bet.expiresAt < now && bet.status !== 'expired') {
            return {
              ...bet,
              status: 'expired' as BetStatus
            };
          }
          return bet;
        });
        setActiveBets(updatedBets);
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
            tokenMint: data.token_mint,
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
      if (payload.new.status !== payload.old.status) {
        if (payload.new.status === 'open' || payload.new.status === 'matched' || payload.new.status === 'expired') {
          fetchBets();
          if (payload.new.status === 'expired') {
            toast.info('A bet has expired', {
              description: 'Check the bet details for more information'
            });
          }
        } else {
          setActiveBets(prev => prev.filter(bet => bet.id !== payload.new.bet_id));
        }
      }
    }).subscribe();
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in BetReel:", event.detail);
      const {
        bet
      } = event.detail;
      if (bet) {
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
    const checkExpiredInterval = setInterval(() => {
      const now = Date.now();
      setActiveBets(prev => prev.map(bet => {
        if (bet.expiresAt < now && bet.status !== 'expired') {
          return {
            ...bet,
            status: 'expired' as BetStatus
          };
        }
        return bet;
      }));
    }, 10000);
    if (pxbBets.length > 0) {
      fetchBets();
    }
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
      clearInterval(checkExpiredInterval);
    };
  }, [pxbBets, publicKey]);
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
  const activeBetsCount = activeBets.filter(bet => bet.status !== 'expired').length;
  const expiredBetsCount = activeBets.filter(bet => bet.status === 'expired').length;
  return <div className="bet-reel-container fixed top-16 left-0 right-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden py-0 my-[27px]">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-3 py-1 bg-dream-accent1/20 border-r border-white/10 flex items-center">
          <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-5 w-5 mr-2" />
          <span className="text-sm font-semibold">ACTIVE BETS</span>
        </div>
        
        <div className="flex items-center ml-4">
          <div className="flex gap-2 items-center">
            <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
              Active: {activeBetsCount}
            </div>
            <div className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-medium">
              Expired: {expiredBetsCount}
            </div>
          </div>
        </div>
        
        <div className="overflow-hidden mx-4 flex-1">
          <div className="flex gap-4 items-center animate-scroll">
            {activeBets.map((bet, index) => <Link key={`${bet.id}-${index}`} to={`/betting/token/${bet.tokenId}`} className={`flex-shrink-0 flex items-center glass-panel px-3 py-2 rounded-md border 
                  ${bet.status === 'expired' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'} 
                  transition-all duration-500 hover:bg-black/40 
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
                      {bet.status !== 'expired' && <span className="bg-green-500/20 text-green-400 px-1 rounded-sm">
                          Active
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