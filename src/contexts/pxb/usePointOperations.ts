import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet } from '@/types/bet';
import { createSupabaseBet } from '@/services/supabaseService';
import { toast } from 'sonner';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<Bet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { publicKey } = useWallet();
  const [mintingPoints, setMintingPoints] = useState(false);

  const mintPoints = useCallback(async (amount: number) => {
    if (!publicKey || !userProfile) {
      toast.error('Connect your wallet to mint points');
      return false;
    }

    const walletAddress = publicKey.toString();
    
    // Check if the wallet has already minted points before
    const mintedWallets = JSON.parse(localStorage.getItem('pxbMintedWallets') || '{}');
    if (mintedWallets[walletAddress]) {
      toast.error('You have already minted your free PXB points');
      return false;
    }
    
    setMintingPoints(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('wallet_address', walletAddress)
        .select();

      if (error) {
        console.error('Error minting points:', error);
        throw new Error('Failed to mint points');
      }

      // Add record to points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: amount,
        action: 'mint',
        reference_id: 'one_time_mint'
      });

      // Mark this wallet as having minted
      mintedWallets[walletAddress] = true;
      localStorage.setItem('pxbMintedWallets', JSON.stringify(mintedWallets));

      // Update the user profile with new points
      setUserProfile({
        ...userProfile,
        pxbPoints: userProfile.pxbPoints + amount
      });

      return true;
    } catch (error) {
      console.error('Error in mintPoints:', error);
      throw error;
    } finally {
      setMintingPoints(false);
    }
  }, [publicKey, userProfile, setUserProfile]);

  const placeBet = useCallback(async (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    prediction: string,
    duration: number,
    amount: number
  ) => {
    if (!userProfile || !publicKey) {
      toast.error('Please connect your wallet to place a bet.');
      return null;
    }

    if (amount > userProfile.pxbPoints) {
      toast.error('Insufficient PXB points to place this bet.');
      return null;
    }

    const walletAddress = publicKey.toString();
    const pxbId = generatePxbId();

    try {
      setIsLoading(true);

      // Optimistically update user profile
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - amount } : null);

      // Create the bet in Supabase
      const newBet = await createSupabaseBet(
        tokenId,
        tokenName,
        tokenSymbol,
        prediction,
        duration,
        amount,
        walletAddress,
        pxbId
      );

      if (!newBet) {
        throw new Error('Failed to create bet');
      }

      // Update user points in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - amount })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Error updating user points after bet:', updateError);
        // Revert optimistic update if update fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + amount } : null);
        throw new Error('Failed to update points after bet');
      }

      // Record the bet in points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: -amount,
        action: 'bet_placed',
        reference_id: newBet.id,
        reference_name: tokenName
      });

      // Update bets state
      setBets(prevBets => [...prevBets, newBet]);

      toast.success(`Bet placed successfully!`);
      return newBet;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error(error.message || 'Failed to place bet');
      // Revert optimistic update if any error occurs
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + amount } : null);
      return null;
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
    if (!userProfile) return null;
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
