import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile } from '@/types/pxb';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setTrades: React.Dispatch<React.SetStateAction<any[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [mintingPoints, setMintingPoints] = useState(false);
  const [transferFeature] = useState<'enabled' | 'coming-soon'>('enabled');

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
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, pxbPoints: prev.pxbPoints - amount };
      });

      const { error: senderError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - amount })
        .eq('id', userProfile.id);

      if (senderError) {
        console.error('Error sending points (sender update):', senderError);
        toast.error('Failed to send points (sender update).');
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        return false;
      }

      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('points')
        .eq('id', recipientId)
        .single();

      if (recipientError) {
        console.error('Error sending points (recipient fetch):', recipientError);
        toast.error('Failed to send points (recipient fetch).');
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
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + amount });
        return false;
      }

      toast.success(`Successfully sent ${amount} PXB points!`);
      return true;
    } catch (error) {
      console.error('Error sending points:', error);
      toast.error('Failed to send points.');
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
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, pxbPoints: prev.pxbPoints - pxbAmount };
      });

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
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
        return false;
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - pxbAmount })
        .eq('id', userProfile.id);

      if (userError) {
        console.error('Error updating user points:', userError);
        toast.error('Failed to update user points.');
        setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
        return false;
      }

      await fetchUserProfile();

      toast.success(`Successfully purchased ${tokenQuantity} ${tokenSymbol} tokens!`);
      return true;
    } catch (error) {
      console.error('Error purchasing token:', error);
      toast.error('Failed to purchase token.');
      setUserProfile({ ...userProfile, pxbPoints: userProfile.pxbPoints + pxbAmount });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sellToken = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ): Promise<boolean> => {
    if (!userProfile) {
      console.error('Cannot sell tokens: User not logged in');
      return false;
    }

    try {
      const amount = tokenQuantity * price;

      const { data: portfolioData, error: portfolioError } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('userid', userProfile.id)
        .eq('tokenid', tokenMint)
        .single();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        console.error('Error checking token portfolio:', portfolioError);
        return false;
      }

      if (!portfolioData || portfolioData.quantity < tokenQuantity) {
        console.error('Not enough tokens to sell');
        return false;
      }

      const newQuantity = portfolioData.quantity - tokenQuantity;
      const newValue = newQuantity * price;

      if (newQuantity <= 0) {
        const { error: deleteError } = await supabase
          .from('token_portfolios')
          .delete()
          .eq('userid', userProfile.id)
          .eq('tokenid', tokenMint);

        if (deleteError) {
          console.error('Error removing token from portfolio:', deleteError);
          return false;
        }
      } else {
        const { error: updateError } = await supabase
          .from('token_portfolios')
          .update({
            quantity: newQuantity,
            currentvalue: newValue,
            lastupdated: new Date().toISOString()
          })
          .eq('userid', userProfile.id)
          .eq('tokenid', tokenMint);

        if (updateError) {
          console.error('Error updating token portfolio:', updateError);
          return false;
        }
      }

      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          userid: userProfile.id,
          tokenid: tokenMint,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          type: 'sell',
          quantity: tokenQuantity,
          price: price,
          pxbamount: amount,
          timestamp: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error recording token transaction:', transactionError);
        return false;
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('id', userProfile.id);

      if (userUpdateError) {
        console.error('Error updating user points:', userUpdateError);
        return false;
      }

      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pxbPoints: prev.pxbPoints + amount
        };
      });

      const { error: historyError } = await supabase
        .from('points_history')
        .insert({
          user_id: userProfile.id,
          amount: amount,
          action: 'token_sale',
          reference_id: tokenMint
        });

      if (historyError) {
        console.error('Error recording points history:', historyError);
      }

      const { data: updatedTrades, error: tradesError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('userid', userProfile.id)
        .order('timestamp', { ascending: false });

      if (!tradesError && updatedTrades) {
        setTrades(updatedTrades);
      }

      return true;
    } catch (error) {
      console.error('Error selling token:', error);
      return false;
    }
  }, [userProfile, setUserProfile, setTrades]);

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
