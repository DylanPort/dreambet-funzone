
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, PXBBet } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, BetPrediction } from '@/types/bet';
import { createSupabaseBet } from '@/services/supabaseService';
import { toast } from 'sonner';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { publicKey } = useWallet();
  const [mintingPoints, setMintingPoints] = useState(false);

  const mintPoints = useCallback(async (amount: number): Promise<void> => {
    if (!publicKey || !userProfile) {
      toast.error('Connect your wallet to mint points');
      return;
    }

    const walletAddress = publicKey.toString();
    
    setMintingPoints(true);
    try {
      // Check if the wallet has already minted points before
      const mintedWallets = JSON.parse(localStorage.getItem('pxbMintedWallets') || '{}');
      
      // Allow multiple mints - removing the restriction
      // if (mintedWallets[walletAddress]) {
      //   toast.error('You have already minted your free PXB points');
      //   return;
      // }
      
      // Get the current user profile to ensure we have the latest data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('points')
        .eq('wallet_address', walletAddress)
        .single();
        
      if (fetchError) {
        console.error('Error fetching current points:', fetchError);
        toast.error('Failed to mint points');
        return;
      }
      
      const currentPoints = userData?.points || userProfile.pxbPoints;
      const newPointsTotal = currentPoints + amount;
      
      // Update the points in the database
      const { data, error } = await supabase
        .from('users')
        .update({ points: newPointsTotal })
        .eq('wallet_address', walletAddress)
        .select();

      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint points');
        return;
      }

      console.log('Points updated in database:', data);

      // Add record to points history
      const { error: historyError } = await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: amount,
        action: 'mint',
        reference_id: `mint_${Date.now()}`  // Use timestamp to make each mint unique
      });

      if (historyError) {
        console.error('Error recording points history:', historyError);
        // Continue anyway since the points were already added
      }

      // Mark this wallet as having minted
      mintedWallets[walletAddress] = true;
      localStorage.setItem('pxbMintedWallets', JSON.stringify(mintedWallets));

      // Update the user profile with new points
      setUserProfile({
        ...userProfile,
        pxbPoints: newPointsTotal
      });
      
      toast.success(`Successfully minted ${amount} PXB points!`);

    } catch (error) {
      console.error('Error in mintPoints:', error);
      toast.error('Failed to mint points');
    } finally {
      setMintingPoints(false);
    }
  }, [publicKey, userProfile, setUserProfile]);

  const placeBet = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    duration: number
  ): Promise<PXBBet | void> => {
    if (!userProfile || !publicKey) {
      toast.error('Please connect your wallet to place a bet.');
      return;
    }

    if (betAmount > userProfile.pxbPoints) {
      toast.error('Insufficient PXB points to place this bet.');
      return;
    }

    const walletAddress = publicKey.toString();
    const pxbId = generatePxbId();

    try {
      setIsLoading(true);

      // Optimistically update user profile
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - betAmount } : null);

      // Convert betType to a valid BetPrediction
      const prediction: BetPrediction = betType === 'up' ? 'up' : 'down';

      // Create the bet in Supabase
      const newBet = await createSupabaseBet(
        tokenMint,
        tokenName,
        tokenSymbol,
        prediction,
        duration,
        betAmount,
        walletAddress,
        pxbId
      );

      if (!newBet) {
        throw new Error('Failed to create bet');
      }

      // Update user points in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - betAmount })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Error updating user points after bet:', updateError);
        // Revert optimistic update if update fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + betAmount } : null);
        throw new Error('Failed to update points after bet');
      }

      // Record the bet in points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: -betAmount,
        action: 'bet_placed',
        reference_id: newBet.id,
        reference_name: tokenName
      });

      // Convert Bet to PXBBet
      const pxbBet: PXBBet = {
        id: newBet.id,
        userId: userProfile.id,
        tokenMint: newBet.tokenMint,
        tokenName: newBet.tokenName,
        tokenSymbol: newBet.tokenSymbol,
        betAmount: newBet.amount,
        betType: betType,
        percentageChange: percentageChange,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
        initialMarketCap: undefined,
        currentMarketCap: undefined
      };

      // Update bets state
      setBets(prevBets => [...prevBets, pxbBet]);

      toast.success(`Bet placed successfully!`);
      return pxbBet;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error(error.message || 'Failed to place bet');
      // Revert optimistic update if any error occurs
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + betAmount } : null);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, publicKey, setUserProfile, setBets, setIsLoading]);

  const sendPoints = useCallback(async (recipientId: string, amount: number) => {
    if (!userProfile || !publicKey) {
      toast.error('Connect your wallet to send points');
      return false;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return false;
    }

    if (amount > userProfile.pxbPoints) {
      toast.error('Insufficient PXB points');
      return false;
    }

    const senderWalletAddress = publicKey.toString();

    try {
      setIsLoading(true);

      // Optimistically update user profile
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - amount } : null);

      // Deduct points from sender
      const { error: senderError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - amount })
        .eq('wallet_address', senderWalletAddress);

      if (senderError) {
        console.error('Error deducting points from sender:', senderError);
        // Revert optimistic update if update fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + amount } : null);
        throw new Error('Failed to deduct points from sender');
      }

      // Add points to recipient
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (recipientError) {
        console.error('Error fetching recipient:', recipientError);
        // Revert optimistic update if recipient fetch fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + amount } : null);
        throw new Error('Failed to fetch recipient');
      }

      const newRecipientPoints = (recipientData?.points || 0) + amount;

      const { error: addPointsError } = await supabase
        .from('users')
        .update({ points: newRecipientPoints })
        .eq('id', recipientId);

      if (addPointsError) {
        console.error('Error adding points to recipient:', addPointsError);
        // Revert optimistic update if adding points fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + amount } : null);
        throw new Error('Failed to add points to recipient');
      }

      // Record the transaction in points history for sender
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: -amount,
        action: 'transfer_sent',
        reference_id: recipientId
      });

      // Record the transaction in points history for recipient
      await supabase.from('points_history').insert({
        user_id: recipientId,
        amount: amount,
        action: 'transfer_received',
        reference_id: userProfile.id
      });

      // Refresh sender's profile
      await fetchUserProfile();

      toast.success(`Successfully sent ${amount} PXB points!`);
      return true;
    } catch (error) {
      console.error('Error sending points:', error);
      toast.error('Failed to send points');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, publicKey, setUserProfile, fetchUserProfile, setIsLoading]);

  const generatePxbId = useCallback(() => {
    if (!userProfile) return "";
    const shortId = userProfile.id.substring(0, 8).toUpperCase();
    const uniqueId = uuidv4().substring(0, 3);
    return `PXB-${shortId}-${uniqueId}`;
  }, [userProfile]);

  return {
    mintPoints,
    placeBet,
    sendPoints,
    generatePxbId
  };
};
