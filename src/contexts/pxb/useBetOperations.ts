
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PXBBet, UserProfile } from '@/types/pxb';
import { toast } from 'sonner';

export const useBetOperations = (
  userProfile: UserProfile | null,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  setIsLoadingBets: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [userBets, setUserBets] = useState<PXBBet[]>([]);

  // Fetch the user's bets
  const fetchUserBets = useCallback(async () => {
    if (!userProfile) return;
    
    setIsLoadingBets(true);
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          bet_id,
          creator,
          token_mint,
          token_name,
          token_symbol,
          prediction_bettor1,
          sol_amount,
          duration,
          status,
          created_at,
          points_won,
          start_time,
          end_time,
          outcome,
          initial_market_cap,
          current_market_cap,
          percentage_change
        `)
        .eq('creator', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        toast.error('Failed to load your bets');
        return;
      }
      
      if (data) {
        const formattedBets: PXBBet[] = data.map(bet => ({
          id: bet.bet_id,
          userId: userProfile.id,
          tokenMint: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          betAmount: bet.sol_amount,
          betType: bet.prediction_bettor1 === 'up' ? 'up' : 'down',
          percentageChange: bet.percentage_change || 0,
          status: (bet.status as any) || 'pending',
          pointsWon: bet.points_won || 0,
          createdAt: bet.created_at,
          expiresAt: bet.end_time || new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString(),
          initialMarketCap: bet.initial_market_cap,
          currentMarketCap: bet.current_market_cap,
          userRole: 'creator',
          timeframe: Math.floor(bet.duration / 60), // Convert seconds to minutes
          resolvedAt: bet.outcome ? bet.end_time : undefined
        }));
        
        setBets(formattedBets);
        setUserBets(formattedBets);
      }
    } catch (error) {
      console.error('Error in fetchUserBets:', error);
      toast.error('An error occurred while loading your bets');
    } finally {
      setIsLoadingBets(false);
    }
  }, [userProfile, setBets, setIsLoadingBets]);

  return {
    fetchUserBets,
    userBets
  };
};
