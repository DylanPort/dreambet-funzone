
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PXBBet, SupabaseBetsRow } from '@/types/pxb';
import { toast } from 'sonner';

export const useBetProcessor = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Function to format bet data from the database
  const formatBetData = (bet: SupabaseBetsRow): PXBBet => {
    return {
      id: bet.bet_id,
      userId: bet.creator,
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
      initialMarketCap: bet.initial_market_cap || null,
      currentMarketCap: bet.current_market_cap || null,
      userRole: 'creator',
      timeframe: Math.floor(bet.duration / 60), // Convert seconds to minutes
      resolvedAt: bet.outcome ? bet.end_time : undefined
    };
  };

  // Process a new bet
  const processBet = useCallback(async (
    userId: string,
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    duration: number
  ): Promise<PXBBet | null> => {
    setIsProcessing(true);
    try {
      console.log(`Processing bet for user ${userId} on token ${tokenMint}`);
      
      // Get the current market cap if available
      let initialMarketCap = null;
      try {
        const { data: tokenData, error: tokenError } = await supabase
          .from('tokens')
          .select('current_market_cap')
          .eq('token_mint', tokenMint)
          .maybeSingle();
          
        if (!tokenError && tokenData && tokenData.current_market_cap) {
          initialMarketCap = tokenData.current_market_cap;
        }
      } catch (error) {
        console.error('Error getting token market cap:', error);
      }
      
      // Calculate bet expiry time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (duration * 60 * 1000)); // duration in minutes
      
      // Create a new bet record
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .insert([
          {
            bettor1_id: userId,
            token_mint: tokenMint,
            token_name: tokenName,
            token_symbol: tokenSymbol,
            prediction_bettor1: betType,
            sol_amount: betAmount,
            duration: duration * 60, // Convert minutes to seconds for storage
            start_time: now.toISOString(),
            end_time: expiresAt.toISOString(),
            status: 'open',
            creator: userId,
            initial_market_cap: initialMarketCap,
            percentage_change: percentageChange
          }
        ])
        .select()
        .single();
      
      if (betError) {
        console.error('Error creating bet:', betError);
        throw new Error(`Failed to create bet: ${betError.message}`);
      }
      
      // Also deduct points from the user's account
      const { error: pointsError } = await supabase
        .from('users')
        .update({ points: supabase.raw('points - ' + betAmount) })
        .eq('id', userId);
      
      if (pointsError) {
        console.error('Error deducting points:', pointsError);
        // If this fails, we should probably revert the bet creation
        // For now, just log the error but allow the bet to proceed
      }
      
      // Record points transaction in history
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          amount: -betAmount,
          action: 'bet_placed',
          reference_id: betData.bet_id
        });
      
      // Return the created bet
      if (betData) {
        // Create PXBBet from the bet data
        const formattedBet: PXBBet = {
          id: betData.bet_id,
          userId: userId,
          tokenMint: tokenMint,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          betAmount: betAmount,
          betType: betType,
          percentageChange: percentageChange,
          status: 'open',
          pointsWon: 0,
          createdAt: betData.created_at,
          expiresAt: expiresAt.toISOString(),
          initialMarketCap: initialMarketCap,
          userRole: 'creator',
          timeframe: duration,
        };
        
        toast.success(`Bet placed on ${tokenName || tokenMint}`);
        return formattedBet;
      }
      
      return null;
    } catch (error) {
      console.error('Error in processBet:', error);
      toast.error('Failed to place bet. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processBet, isProcessing, formatBetData };
};

export default useBetProcessor;
