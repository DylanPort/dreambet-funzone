
import { useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';

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
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      
      console.log("Existing user check:", existingUser, checkError);
      
      if (existingUser) {
        // User exists, check if they already have points
        if (existingUser.points > 0) {
          toast.error('You have already claimed your PXB Points');
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
        toast.error('Failed to mint PXB Points');
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
      
      const walletAddress = publicKey.toString();
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      const betId = crypto.randomUUID();
      
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
          status: 'pending',
          duration: duration * 60
        });
      
      if (betError) {
        console.error('Error creating bet:', betError);
        toast.error('Failed to place bet');
        return;
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - betAmount })
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('Error updating points:', updateError);
        toast.error('Failed to update points');
        return;
      }
      
      const updatedProfile = {
        ...userProfile,
        pxbPoints: userProfile.pxbPoints - betAmount
      };
      
      setUserProfile(updatedProfile);
      
      const newBet: PXBBet = {
        id: betId,
        userId: userProfile.id,
        tokenMint,
        tokenName,
        tokenSymbol,
        betAmount,
        betType,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      
      setBets(prevBets => [...prevBets, newBet]);
      
      toast.success(`Bet placed successfully! ${betAmount} PXB Points on ${tokenSymbol} to ${betType === 'up' ? 'MOON' : 'DIE'}`);
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, userProfile, setIsLoading, setUserProfile, setBets]);

  return {
    mintPoints,
    placeBet
  };
};
