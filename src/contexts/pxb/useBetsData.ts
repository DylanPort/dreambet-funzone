
import { useState, useCallback } from 'react';
import { PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

export const useBetsData = (userProfile: any) => {
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { connected, publicKey } = useWallet();

  const fetchUserBets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey || !userProfile) {
        setBets([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('bets')
        .select('*, tokens:token_mint(token_name, token_symbol)')
        .eq('bettor1_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        return;
      }
      
      console.log('Raw bets data from Supabase:', data);
      
      const formattedBets: PXBBet[] = (data as any[]).map((bet: any) => {
        const tokenName = bet.token_name || bet.tokens?.token_name || 'Unknown Token';
        const tokenSymbol = bet.token_symbol || bet.tokens?.token_symbol || 'UNKNOWN';
        
        return {
          id: bet.bet_id,
          userId: bet.bettor1_id,
          tokenMint: bet.token_mint,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          betAmount: bet.sol_amount,
          betType: bet.prediction_bettor1 as 'up' | 'down',
          percentageChange: bet.percentage_change || 0,
          status: bet.status === 'pending' ? 'pending' : (bet.status === 'won' ? 'won' : 'lost'),
          pointsWon: bet.points_won || 0,
          createdAt: bet.created_at,
          expiresAt: new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString(),
          initialMarketCap: bet.initial_market_cap,
          currentMarketCap: bet.current_market_cap
        };
      });
      
      console.log('Formatted bets:', formattedBets);
      setBets(formattedBets);
    } catch (error) {
      console.error('Error in fetchUserBets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, userProfile]);

  return {
    bets,
    setBets,
    fetchUserBets,
    isLoading
  };
};
