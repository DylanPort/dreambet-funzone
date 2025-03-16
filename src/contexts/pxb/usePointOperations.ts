
import { useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { connected, publicKey } = useWallet();

  const mintPoints = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }
      
      const walletAddress = publicKey.toString();
      console.log("Minting points for wallet:", walletAddress);
      
      // Check if user already exists with more robust error handling
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      
      console.log("Existing user check:", existingUser, checkError);
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', checkError);
        toast.error('Failed to check user status');
        return;
      }
      
      if (existingUser) {
        // User exists, check if they already have points
        if (existingUser.points > 0) {
          toast.error('You have already minted your PXB Points');
          setUserProfile({
            id: existingUser.id,
            username: existingUser.username || username,
            pxbPoints: existingUser.points,
            createdAt: existingUser.created_at
          });
          return;
        }
      }
      
      // Prepare user data
      let userId = existingUser?.id || crypto.randomUUID();
      const finalUsername = username || existingUser?.username || publicKey.toString().substring(0, 8);
      
      console.log("Creating/updating user with ID:", userId);
      
      // Insert or update user with points
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          wallet_address: walletAddress,
          username: finalUsername,
          points: 500
        })
        .select()
        .single();
      
      if (updateError) {
        console.error('Error minting points:', updateError);
        toast.error('Failed to mint PXB Points. Please try again.');
        return;
      }
      
      console.log("User after minting points:", updatedUser);
      
      // Record the points transaction
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          action: 'mint',
          amount: 500,
          reference_id: crypto.randomUUID()
        });
      
      // Update local state
      const newProfile: UserProfile = {
        id: updatedUser.id,
        username: updatedUser.username || finalUsername,
        pxbPoints: updatedUser.points,
        createdAt: updatedUser.created_at
      };
      
      setUserProfile(newProfile);
      toast.success(`Successfully minted 500 PXB Points!`);
      
      // Fetch fresh data
      await fetchUserProfile();
    } catch (error) {
      console.error('Error minting points:', error);
      toast.error('Failed to mint PXB Points');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, setUserProfile, fetchUserProfile, setIsLoading]);

  const placeBet = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number = 10,
    duration: number = 60
  ) => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey || !userProfile) {
        toast.error('You must be logged in to place a bet');
        return;
      }
      
      if (betAmount > userProfile.pxbPoints) {
        toast.error('Insufficient PXB Points balance');
        return;
      }
      
      // Show a loading toast while processing the bet
      const toastId = `bet-${tokenSymbol}-${Date.now()}`;
      toast.loading(`Processing your bet on ${tokenSymbol}...`, { id: toastId });
      
      // Get current market cap from DexScreener to track the starting point
      console.log(`Fetching market cap data for token: ${tokenMint}`);
      const tokenData = await fetchDexScreenerData(tokenMint);
      
      if (!tokenData || !tokenData.marketCap) {
        toast.error('Unable to fetch current market cap for this token', { id: toastId });
        return;
      }
      
      const initialMarketCap = tokenData.marketCap;
      console.log(`Initial market cap: $${initialMarketCap}`);
      
      const walletAddress = publicKey.toString();
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      const betId = crypto.randomUUID();
      
      // First deduct points from user balance
      console.log(`Deducting ${betAmount} points from user ${userProfile.id}`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - betAmount })
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('Error updating points:', updateError);
        toast.error('Failed to deduct PXB Points for bet', { id: toastId });
        return;
      }
      
      // Then create the bet record
      console.log(`Creating bet record: ${betId}`);
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          bet_id: betId,
          creator: walletAddress,
          bettor1_id: userProfile.id,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          sol_amount: betAmount,
          prediction_bettor1: betType,
          percentage_change: percentageChange,
          initial_market_cap: initialMarketCap,
          status: 'pending',
          duration: duration * 60
        });
      
      if (betError) {
        console.error('Error creating bet:', betError);
        
        // If bet creation fails, refund the points
        console.log(`Refunding ${betAmount} points to user ${userProfile.id}`);
        await supabase
          .from('users')
          .update({ points: userProfile.pxbPoints })
          .eq('id', userProfile.id);
          
        toast.error('Failed to place bet, points refunded', { id: toastId });
        return;
      }
      
      // Create a record in bet_history
      console.log(`Creating bet history record for bet ${betId}`);
      await supabase
        .from('bet_history')
        .insert({
          bet_id: betId,
          user_id: userProfile.id,
          action: 'place_bet',
          details: {
            token_mint: tokenMint,
            token_name: tokenName,
            token_symbol: tokenSymbol,
            bet_amount: betAmount,
            prediction: betType,
            percentage_change: percentageChange,
            duration: duration
          },
          market_cap_at_action: initialMarketCap
        });
      
      // Update local user profile state with reduced points
      const updatedProfile = {
        ...userProfile,
        pxbPoints: userProfile.pxbPoints - betAmount
      };
      
      setUserProfile(updatedProfile);
      
      // Create new bet object for immediate display
      const newBet: PXBBet = {
        id: betId,
        userId: userProfile.id,
        tokenMint,
        tokenName,
        tokenSymbol,
        betAmount,
        betType,
        percentageChange,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        initialMarketCap
      };
      
      // Add new bet to state at the beginning of the array
      setBets(prevBets => [newBet, ...prevBets]);
      
      const predictionText = betType === 'up' ? `MOON by ${percentageChange}%` : `DIE by ${percentageChange}%`;
      toast.success(`Bet placed successfully! ${betAmount} PXB Points on ${tokenSymbol} to ${predictionText}`, { id: toastId });
      
      // Fetch user profile to ensure points are updated
      fetchUserProfile();
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, userProfile, setIsLoading, setUserProfile, setBets, fetchUserProfile]);

  return {
    mintPoints,
    placeBet
  };
};
