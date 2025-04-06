
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from '@/types/pxb';
import { v4 as uuidv4 } from 'uuid';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setTrades: any,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [mintingPoints, setMintingPoints] = useState(false);
  const transferFeature: 'enabled' | 'coming-soon' = 'coming-soon';

  const generatePxbId = (): string => {
    return uuidv4();
  };

  const mintPoints = async (amount: number = 50) => {
    if (!userProfile) {
      toast.error('Please connect your wallet to mint points.');
      return;
    }

    if (mintingPoints) {
      toast.info('Minting in progress, please wait.');
      return;
    }

    setMintingPoints(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint points.');
      } else {
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        toast.success(`Successfully minted ${amount} PXB points!`);
      }
    } catch (error) {
      console.error('Error minting points:', error);
      toast.error('Failed to mint points.');
    } finally {
      setMintingPoints(false);
    }
  };

  const sendPoints = async (recipientId: string, amount: number): Promise<boolean> => {
    if (!userProfile) {
      toast.error('Please connect your wallet to send points.');
      return false;
    }

    if (userProfile.pxbPoints < amount) {
      toast.error('Insufficient PXB points.');
      return false;
    }

    try {
      // Optimistically update the user's points
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, pxbPoints: prev.pxbPoints - amount };
      });

      // Update sender's points
      const { error: senderError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - amount })
        .eq('id', userProfile.id);

      if (senderError) {
        console.error('Error sending points (sender update):', senderError);
        toast.error('Failed to send points (sender update).');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        return false;
      }

      // Update recipient's points
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('points')
        .eq('id', recipientId)
        .single();

      if (recipientError) {
        console.error('Error sending points (recipient fetch):', recipientError);
        toast.error('Failed to send points (recipient fetch).');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        return false;
      }

      const newRecipientPoints = (recipientData?.points || 0) + amount;

      const { error: recipientUpdateError } = await supabase
        .from('users')
        .update({ points: newRecipientPoints })
        .eq('id', recipientId);

      if (recipientUpdateError) {
        console.error('Error sending points (recipient update):', recipientUpdateError);
        toast.error('Failed to send points (recipient update).');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        return false;
      }

      toast.success(`Successfully sent ${amount} PXB points!`);
      return true;
    } catch (error) {
      console.error('Error sending points:', error);
      toast.error('Failed to send points.');
      // Revert the optimistic update
      setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
      return false;
    }
  };

  const purchaseToken = async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number,
    tokenQuantity: number,
    price: number
  ): Promise<boolean> => {
    if (!userProfile) {
      toast.error('Please connect your wallet to purchase tokens.');
      return false;
    }

    if (userProfile.pxbPoints < pxbAmount) {
      toast.error('Insufficient PXB points.');
      return false;
    }

    setIsLoading(true);
    try {
      // Optimistically update user's points
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, pxbPoints: prev.pxbPoints - pxbAmount };
      });

      // Record the transaction in the database
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          userid: userProfile.id,
          tokenid: tokenMint,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          type: 'buy',
          quantity: tokenQuantity,
          price: price,
          pxbamount: pxbAmount,
          timestamp: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error purchasing token:', error);
        toast.error('Failed to purchase token.');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
        return false;
      }

      // Update user's points in the database
      const { error: userError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - pxbAmount })
        .eq('id', userProfile.id);

      if (userError) {
        console.error('Error updating user points:', userError);
        toast.error('Failed to update user points.');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
        return false;
      }

      // Fetch user profile to update points
      await fetchUserProfile();

      // Fetch user trades to update trades
      // await fetchUserTrades();

      toast.success(`Successfully purchased ${tokenQuantity} ${tokenSymbol} tokens!`);
      return true;
    } catch (error) {
      console.error('Error purchasing token:', error);
      toast.error('Failed to purchase token.');
      // Revert the optimistic update
      setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sellToken = async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ): Promise<boolean> => {
    if (!userProfile) {
      toast.error('Please connect your wallet to sell tokens.');
      return false;
    }

    setIsLoading(true);
    try {
      // Calculate the amount of PXB points the user will receive
      const pxbAmount = tokenQuantity * price;

      // Optimistically update user's points
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, pxbPoints: prev.pxbPoints + pxbAmount };
      });

      // Record the transaction in the database
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          userid: userProfile.id,
          tokenid: tokenMint,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          type: 'sell',
          quantity: tokenQuantity,
          price: price,
          pxbamount: pxbAmount,
          timestamp: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error selling token:', error);
        toast.error('Failed to sell token.');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints - pxbAmount });
        return false;
      }

      // Update user's points in the database
      const { error: userError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + pxbAmount })
        .eq('id', userProfile.id);

      if (userError) {
        console.error('Error updating user points:', userError);
        toast.error('Failed to update user points.');
        // Revert the optimistic update
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints - pxbAmount });
        return false;
      }

      // Fetch user profile to update points
      await fetchUserProfile();

      toast.success(`Successfully sold ${tokenQuantity} ${tokenSymbol} tokens!`);
      return true;
    } catch (error) {
      console.error('Error selling token:', error);
      toast.error('Failed to sell token.');
      // Revert the optimistic update if pxbAmount is defined
      if (userProfile) {
        const calculatedAmount = tokenQuantity * price;
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints - calculatedAmount });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mintPoints,
    sendPoints,
    purchaseToken,
    sellToken,
    generatePxbId,
    mintingPoints,
    transferFeature
  };
};
