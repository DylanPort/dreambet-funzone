
import { useState, useCallback } from 'react';
import { PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

export const useBetsData = (userProfile: any) => {
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { connected, publicKey } = useWallet();

  const fetchUserBets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey || !userProfile) {
        console.log('Skipping fetch: Not connected or no user profile');
        setBets([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching bets for user:', userProfile.id, 'wallet:', publicKey.toString());
      
      // First try to get bets where user is the creator
      const { data, error } = await supabase
        .from('bets')
        .select('*, tokens:token_mint(token_name, token_symbol)')
        .eq('bettor1_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        toast.error('Failed to load your bets. Please try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Raw bets data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('No bets found for user in database');
        setBets([]);
        setIsLoading(false);
        return;
      }
      
      const formattedBets: PXBBet[] = (data as any[]).map((bet: any) => {
        console.log('Formatting bet:', bet);
        
        const tokenName = bet.token_name || bet.tokens?.token_name || 'Unknown Token';
        const tokenSymbol = bet.token_symbol || bet.tokens?.token_symbol || 'UNKNOWN';
        
        const expiresAt = new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString();
        
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
          expiresAt: expiresAt,
          initialMarketCap: bet.initial_market_cap,
          currentMarketCap: bet.current_market_cap
        };
      });
      
      console.log('Formatted bets:', formattedBets);
      setBets(formattedBets);
    } catch (error) {
      console.error('Error in fetchUserBets:', error);
      toast.error('Failed to load your bets. Please try again.');
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
