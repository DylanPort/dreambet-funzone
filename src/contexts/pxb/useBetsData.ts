
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
        console.log('Skipping fetch: Not connected or no user profile');
        setBets([]);
        return;
      }
      
      console.log('Fetching bets for user:', userProfile.id, 'wallet:', publicKey.toString());
      
      // Get bets where the user is either the creator (bettor1) or participant (bettor2)
      const { data, error } = await supabase
        .from('bets')
        .select('*, tokens:token_mint(token_name, token_symbol)')
        .or(`bettor1_id.eq.${userProfile.id},bettor2_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        return;
      }
      
      console.log('Raw bets data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('No bets found for user in database');
        setBets([]);
        return;
      }
      
      const formattedBets: PXBBet[] = (data as any[]).map((bet: any) => {
        const tokenName = bet.token_name || bet.tokens?.token_name || 'Unknown Token';
        const tokenSymbol = bet.token_symbol || bet.tokens?.token_symbol || 'UNKNOWN';
        
        // Determine if this user was the creator or participant
        const isCreator = bet.bettor1_id === userProfile.id;

        // Check if bet is expired but status is still 'open'
        const createdTime = new Date(bet.created_at).getTime();
        const expiryTime = createdTime + (bet.duration * 1000);
        const now = new Date().getTime();
        const isExpired = now > expiryTime;
        
        // Determine the correct status
        let betStatus = bet.status;
        
        // If the database shows 'open' but the bet is past its expiry time,
        // we should consider it 'pending' instead of 'lost'
        if (betStatus === 'open' && isExpired) {
          betStatus = 'pending';
        }
        
        return {
          id: bet.bet_id,
          userId: isCreator ? bet.bettor1_id : bet.bettor2_id,
          creator: bet.creator,  // Make sure we include the creator field
          tokenMint: bet.token_mint,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          betAmount: bet.sol_amount,
          betType: isCreator ? (bet.prediction_bettor1 as 'up' | 'down') : (bet.prediction_bettor2 as 'up' | 'down'),
          percentageChange: bet.percentage_change || 0,
          status: betStatus, // Using our corrected status
          pointsWon: bet.points_won || 0,
          createdAt: bet.created_at,
          expiresAt: new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString(),
          initialMarketCap: bet.initial_market_cap,
          currentMarketCap: bet.current_market_cap,
          userRole: isCreator ? 'creator' : 'participant'
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
