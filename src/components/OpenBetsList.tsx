import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets } from '@/services/supabaseService';
import { Bet, BetStatus } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import BetListHeader from './bets/BetListHeader';
import EmptyBetsList from './bets/EmptyBetsList';
import DesktopBetsList from './bets/DesktopBetsList';
import MobileBetScroller from './bets/MobileBetScroller';
import LoadingBetsList from './bets/LoadingBetsList';
import ErrorBetsList from './bets/ErrorBetsList';

interface BetCountStats {
  moon: number;
  dust: number;
  moonPercentage: number;
  dustPercentage: number;
  moonWins: number;
  dustWins: number;
  moonLosses: number;
  dustLosses: number;
  averageMoonMarketCap: number;
  averageDustMarketCap: number;
  totalVolume: number;
}

const OpenBetsList = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [filter, setFilter] = useState('all');
  const [localBets, setLocalBets] = useState<Bet[]>([]);
  const { bets: pxbBets } = usePXBPoints();
  const [betCountsByToken, setBetCountsByToken] = useState<Record<string, BetCountStats>>({});
  const isMobile = useIsMobile();

  const {
    data: supabaseBets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['openBets'],
    queryFn: async () => {
      console.log('Fetching open bets from Supabase...');
      try {
        const bets = await fetchOpenBets();
        console.log('OpenBetsList - Fetched bets:', bets);
        return bets;
      } catch (err) {
        console.error('Error fetching open bets:', err);
        throw err;
      }
    },
    refetchInterval: 30000
  });

  useEffect(() => {
    console.log('OpenBetsList - Component state:', {
      connected,
      publicKeyExists: !!publicKey,
      publicKeyValue: publicKey?.toString(),
      supabaseBetsCount: supabaseBets?.length || 0,
      pxbBetsCount: pxbBets?.length || 0,
      localBetsCount: localBets?.length || 0,
      filterValue: filter
    });
  }, [connected, publicKey, supabaseBets, pxbBets, localBets, filter]);

  useEffect(() => {
    try {
      const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
      let fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
      const now = Date.now();
      fallbackBets = fallbackBets.filter(bet => bet.expiresAt > now && bet.status === 'open');
      const pxbFallbackBets: Bet[] = pxbBets.filter(pb => pb.status === 'pending').map(pb => ({
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
      const combinedBets = [...fallbackBets, ...pxbFallbackBets].filter(localBet => {
        return !supabaseBets.some(bet => bet.id === localBet.id || bet.onChainBetId && localBet.onChainBetId && bet.onChainBetId === localBet.onChainBetId);
      });
      setLocalBets(combinedBets);
      console.log('Combined local bets with Supabase bets:', {
        supabaseBets,
        fallbackBets,
        pxbBets,
        pxbFallbackBets,
        combinedLocalBets: combinedBets
      });
    } catch (error) {
      console.error('Error loading local bets:', error);
      setLocalBets([]);
    }
  }, [supabaseBets, pxbBets, publicKey]);

  useEffect(() => {
    const allBets = [...supabaseBets, ...localBets];
    const counts: Record<string, BetCountStats> = {};
    allBets.forEach(bet => {
      if (!counts[bet.tokenId]) {
        counts[bet.tokenId] = {
          moon: 0,
          dust: 0,
          moonPercentage: 0,
          dustPercentage: 0,
          moonWins: 0,
          dustWins: 0,
          moonLosses: 0,
          dustLosses: 0,
          averageMoonMarketCap: 0,
          averageDustMarketCap: 0,
          totalVolume: 0
        };
      }
      counts[bet.tokenId].totalVolume += bet.amount;
      if (bet.prediction === 'migrate') {
        counts[bet.tokenId].moon += 1;
        if (bet.initialMarketCap) {
          const currentTotal = counts[bet.tokenId].averageMoonMarketCap * (counts[bet.tokenId].moon - 1);
          const newTotal = currentTotal + bet.initialMarketCap;
          counts[bet.tokenId].averageMoonMarketCap = newTotal / counts[bet.tokenId].moon;
        }
        if (bet.status === 'completed') {
          if (bet.winner === bet.initiator) {
            counts[bet.tokenId].moonWins += 1;
          } else {
            counts[bet.tokenId].moonLosses += 1;
          }
        }
      } else if (bet.prediction === 'die') {
        counts[bet.tokenId].dust += 1;
        if (bet.initialMarketCap) {
          const currentTotal = counts[bet.tokenId].averageDustMarketCap * (counts[bet.tokenId].dust - 1);
          const newTotal = currentTotal + bet.initialMarketCap;
          counts[bet.tokenId].averageDustMarketCap = newTotal / counts[bet.tokenId].dust;
        }
        if (bet.status === 'completed') {
          if (bet.winner === bet.initiator) {
            counts[bet.tokenId].dustWins += 1;
          } else {
            counts[bet.tokenId].dustLosses += 1;
          }
        }
      }
    });
    Object.keys(counts).forEach(tokenId => {
      const total = counts[tokenId].moon + counts[tokenId].dust;
      if (total > 0) {
        counts[tokenId].moonPercentage = Math.round(counts[tokenId].moon / total * 100);
        counts[tokenId].dustPercentage = Math.round(counts[tokenId].dust / total * 100);
      }
    });
    console.log('Calculated bet counts and percentages by token:', counts);
    setBetCountsByToken(counts);
  }, [supabaseBets, localBets]);

  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in OpenBetsList:", event.detail);
      const { bet } = event.detail;
      try {
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        const fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        const exists = fallbackBets.some(existingBet => existingBet.id === bet.id);
        if (!exists) {
          fallbackBets.push(bet);
          localStorage.setItem('pumpxbounty_fallback_bets', JSON.stringify(fallbackBets));
          setLocalBets(prev => {
            const exists = prev.some(existingBet => existingBet.id === bet.id);
            if (!exists) {
              return [bet, ...prev];
            }
            return prev;
          });
          console.log('Added new bet to local storage:', bet);
          toast({
            title: "New bet created",
            description: `Your ${bet.prediction} bet for ${bet.amount} SOL on ${bet.tokenSymbol} has been stored locally`
          });
        }
      } catch (error) {
        console.error('Error storing new bet in local storage:', error);
      }
    };
    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
    };
  }, [toast]);

  const handleRefresh = () => {
    toast({
      title: "Refreshing open bets",
      description: "Fetching the latest open bets..."
    });
    refetch();
  };

  const allBets = [...supabaseBets, ...localBets];
  const filteredBets = allBets.filter(bet => {
    if (filter === 'all') return true;
    return filter === bet.prediction;
  });

  if (isLoading) {
    return <LoadingBetsList />;
  }

  if (error) {
    console.error('Error in OpenBetsList:', error);
    return <ErrorBetsList onRefresh={handleRefresh} />;
  }

  return (
    <div className="space-y-5">
      <BetListHeader 
        title="ACTIVE BETS"
        count={filteredBets.length}
        filter={filter}
        setFilter={setFilter}
        onRefresh={handleRefresh}
      />

      {isMobile && filteredBets.length > 0 && (
        <MobileBetScroller bets={filteredBets} betCountsByToken={betCountsByToken} />
      )}

      {filteredBets.length === 0 ? (
        <EmptyBetsList />
      ) : (
        <div className={isMobile ? "relative w-full" : "space-y-4"}>
          {!isMobile && <DesktopBetsList bets={filteredBets} betCountsByToken={betCountsByToken} />}
        </div>
      )}
    </div>
  );
};

export default OpenBetsList;
