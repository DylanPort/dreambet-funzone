import { useState, useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase, isAuthRateLimited, checkSupabaseTables, isAuthDisabled } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { Bet, BetPrediction } from '@/types/bet';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isMinting, setIsMinting] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const { publicKey } = useWallet();

  // Mint free PXB points
  const mintPoints = useCallback(async (amount: number = 100) => {
    if (!userProfile || !publicKey) {
      toast.error('Connect your wallet to mint PXB points');
      return;
    }

    setIsMinting(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Update user's points in the database
      const { error } = await supabase
        .from('users')
        .update({
          points: userProfile.pxbPoints + amount
        })
        .eq('id', userProfile.id);
      
      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint PXB points');
        return;
      }
      
      // Record the minting in the history
      await supabase
        .from('points_history')
        .insert({
          user_id: userProfile.id,
          amount: amount,
          action: 'mint',
          reference_id: 'daily_mint'
        });
      
      // Update the user profile in the state
      setUserProfile({
        ...userProfile,
        pxbPoints: userProfile.pxbPoints + amount
      });
      
      toast.success(`Successfully minted ${amount} PXB points!`);
    } catch (error) {
      console.error('Unexpected error in mintPoints:', error);
      toast.error('Failed to mint PXB points due to an unexpected error');
    } finally {
      setIsMinting(false);
    }
  }, [userProfile, publicKey, setUserProfile]);

  // Helper function to check if token exists and create it if needed
  const ensureTokenExists = async (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    initialMarketCap: number
  ) => {
    try {
      // Check if token exists in database
      const { data: existingToken, error: checkError } = await supabase
        .from('tokens')
        .select('token_mint')
        .eq('token_mint', tokenId)
        .single();
      
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          // Token doesn't exist, create it
          console.log(`Token ${tokenId} (${tokenName}) doesn't exist, creating it now`);
          
          const { data: newToken, error: insertError } = await supabase
            .from('tokens')
            .insert({
              token_mint: tokenId,
              token_name: tokenName,
              token_symbol: tokenSymbol,
              initial_market_cap: initialMarketCap,
              current_market_cap: initialMarketCap,
              last_trade_price: 0
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Failed to create token:', insertError);
            throw new Error(`Failed to create token: ${insertError.message}`);
          }
          
          console.log('Token created successfully:', newToken);
          return true;
        } else {
          // Other error occurred when checking if token exists
          console.error('Error checking if token exists:', checkError);
          throw new Error(`Error checking token: ${checkError.message}`);
        }
      }
      
      console.log(`Token ${tokenId} already exists in database`);
      return true;
    } catch (error) {
      console.error('Unexpected error in ensureTokenExists:', error);
      throw error;
    }
  };

  // Place a bet
  const placeBet = useCallback(async (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    durationMinutes: number = 30
  ) => {
    if (!userProfile || !publicKey) {
      toast.error('Connect your wallet to place a bet');
      return;
    }
    
    if (userProfile.pxbPoints < betAmount) {
      toast.error(`Not enough PXB points. You need ${betAmount} but only have ${userProfile.pxbPoints}.`);
      return;
    }

    setIsPlacingBet(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Check if auth is disabled in Supabase - this just logs info, we proceed regardless
      const authDisabled = await isAuthDisabled();
      if (authDisabled) {
        console.log('Authentication is disabled in Supabase, proceeding with public access');
      }
      
      // Fetch token data from TokenDataCache to get the initial market cap
      const tokenData = await fetchTokenMetrics(tokenId);
      
      // We now always have token data due to fallback values in fetchTokenMetrics
      const initialMarketCap = tokenData?.marketCap || 1000; // Default to 1000 if still null
      
      console.log(`Initial market cap for ${tokenSymbol}: $${initialMarketCap}`);
      
      // Ensure the token exists in the database before creating a bet
      await ensureTokenExists(tokenId, tokenName, tokenSymbol, initialMarketCap);
      
      // Calculate duration in seconds
      const durationSeconds = durationMinutes * 60;
      
      // First, update the user points immediately in the UI for better UX
      const updatedPoints = userProfile.pxbPoints - betAmount;
      setUserProfile({
        ...userProfile,
        pxbPoints: updatedPoints
      });
      
      // Update user's points in the database
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: updatedPoints
        })
        .eq('id', userProfile.id);
      
      if (pointsError) {
        // Revert the UI change if the database update fails
        setUserProfile({
          ...userProfile,
          pxbPoints: userProfile.pxbPoints
        });
        console.error('Error updating points:', pointsError);
        toast.error('Failed to deduct PXB points for bet');
        return;
      }
      
      // Record the point deduction in the history - with error handling for RLS issues
      try {
        const { error: historyError } = await supabase
          .from('points_history')
          .insert({
            user_id: userProfile.id,
            amount: -betAmount,
            action: 'bet_placed',
            reference_id: tokenId
          });
          
        if (historyError) {
          console.warn('Non-critical error recording points history:', historyError);
          // We continue anyway as this is non-critical
        }
      } catch (historyError) {
        console.warn('Failed to record points history, but continuing:', historyError);
        // Continue with the bet placement even if history recording fails
      }
      
      // Create the bet in the database with improved error handling
      let betData;
      try {
        const { data, error: betError } = await supabase
          .from('bets')
          .insert({
            bettor1_id: userProfile.id,
            token_mint: tokenId,
            token_name: tokenName,
            token_symbol: tokenSymbol,
            sol_amount: betAmount,
            prediction_bettor1: betType,
            percentage_change: percentageChange,
            duration: durationSeconds,
            status: 'pending',
            creator: userProfile.id, // Use the user ID as creator, not wallet address
            initial_market_cap: initialMarketCap
          })
          .select()
          .single();
        
        if (betError) {
          throw betError;
        }
        
        betData = data;
      } catch (betError: any) {
        // Attempt to revert the points if bet creation fails
        await supabase
          .from('users')
          .update({
            points: userProfile.pxbPoints
          })
          .eq('id', userProfile.id);
          
        // Revert the UI change
        setUserProfile({
          ...userProfile,
          pxbPoints: userProfile.pxbPoints
        });
        
        console.error('Error creating bet:', betError);
        toast.error(`Failed to create bet: ${betError.message || 'Unknown error'}. Your points have been returned.`);
        return;
      }
      
      // Try to record the bet creation in history
      try {
        await supabase
          .from('bet_history')
          .insert({
            bet_id: betData.bet_id,
            user_id: userProfile.id,
            action: 'bet_created',
            details: {
              token_mint: tokenId,
              token_name: tokenName,
              token_symbol: tokenSymbol,
              amount: betAmount,
              type: betType,
              percentage_change: percentageChange,
              duration_minutes: durationMinutes
            },
            market_cap_at_action: initialMarketCap
          });
      } catch (historyError) {
        console.warn('Failed to record bet history, but continuing:', historyError);
        // Continue even if history creation fails
      }
      
      // Format the new bet to add to the local state
      const newBet: PXBBet = {
        id: betData.bet_id,
        userId: userProfile.id,
        tokenMint: tokenId,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        betAmount: betAmount,
        betType: betType,
        percentageChange: percentageChange,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(new Date().getTime() + (durationSeconds * 1000)).toISOString(),
        initialMarketCap: initialMarketCap,
        currentMarketCap: initialMarketCap
      };
      
      // Add the new bet to the local state
      setBets(prevBets => [newBet, ...prevBets]);
      
      // Dispatch a custom event to notify other components about the new bet
      // Use same event name and format as in supabaseService.ts
      const newBetForEvent: Bet = {
        id: betData.bet_id,
        tokenId: tokenId,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        initiator: walletAddress,
        amount: betAmount,
        prediction: betType === 'up' ? 'migrate' : 'die',
        timestamp: new Date().getTime(),
        expiresAt: new Date(new Date().getTime() + (durationSeconds * 1000)).getTime(),
        status: 'open',
        duration: durationMinutes,
        // Add the required properties with default values
        onChainBetId: '',
        transactionSignature: ''
      };
      
      const newBetCreatedEvent = new CustomEvent('newBetCreated', {
        detail: { bet: newBetForEvent }
      });
      window.dispatchEvent(newBetCreatedEvent);
      
      toast.success(`${betType === 'up' ? 'MOON' : 'DIE'} bet placed on ${tokenSymbol}!`);
      
      return newBet;
    } catch (error) {
      console.error('Unexpected error in placeBet:', error);
      // Attempt to revert points on unexpected error
      fetchUserProfile();
      toast.error('Failed to place bet due to an unexpected error. Refreshing your balance...');
    } finally {
      setIsPlacingBet(false);
    }
  }, [userProfile, publicKey, setUserProfile, setBets, fetchUserProfile]);

  return {
    mintPoints,
    placeBet,
    isMinting,
    isPlacingBet
  };
};
