import { useState, useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isSendingPoints, setIsSendingPoints] = useState(false);
  const [pxbIdGenerated, setPxbIdGenerated] = useState(false);

  const mintPoints = useCallback(async (amount: number = 100): Promise<boolean> => {
    if (!userProfile) {
      toast.error("You need to be logged in to mint points");
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error: claimCheckError } = await supabase
        .from('points_history')
        .select('created_at')
        .eq('user_id', userProfile.id)
        .eq('action', 'mint')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (claimCheckError) {
        console.error("Error checking last claim time:", claimCheckError);
        toast.error("Failed to verify claim eligibility");
        return false;
      }
      
      if (data && data.length > 0) {
        const lastClaimDate = new Date(data[0].created_at);
        const now = new Date();
        const timeSinceClaim = now.getTime() - lastClaimDate.getTime();
        const sixHoursInMs = 6 * 60 * 60 * 1000;
        
        if (timeSinceClaim < sixHoursInMs) {
          const remainingTime = Math.ceil((sixHoursInMs - timeSinceClaim) / (60 * 60 * 1000));
          toast.error(`You need to wait ${remainingTime} more hour${remainingTime !== 1 ? 's' : ''} between claims`);
          return false;
        }
      }

      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints + amount
      } : null);

      const { error } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('id', userProfile.id);

      if (error) {
        console.error("Error minting points:", error);
        toast.error("Failed to mint points");

        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints - amount
        } : null);
        return false;
      } else {
        const { error: historyError } = await supabase
          .from('points_history')
          .insert({
            user_id: userProfile.id,
            amount: amount,
            action: 'mint'
          });
        
        if (historyError) {
          console.error("Error recording mint history:", historyError);
        }
        
        toast.success(`Successfully minted ${amount} PXB points!`);
        await fetchUserProfile();
        return true;
      }
    } catch (error) {
      console.error("Exception minting points:", error);
      toast.error("An unexpected error occurred");

      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints - amount
      } : null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, setUserProfile, fetchUserProfile, setIsLoading]);

  const placeBet = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    duration: number
  ) => {
    if (!userProfile) {
      toast.error("You need to be logged in to place a bet");
      return;
    }

    if (betAmount <= 0) {
      toast.error("Bet amount must be greater than 0");
      return;
    }

    if (betAmount > userProfile.pxbPoints) {
      toast.error(`Not enough PXB points. You have ${userProfile.pxbPoints}, but tried to bet ${betAmount}.`);
      return;
    }

    setIsLoading(true);
    try {
      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints - betAmount
      } : null);

      const expiresAt = new Date(Date.now() + duration * 60000).toISOString();

      const { data: betData, error } = await supabase
        .from('bets')
        .insert({
          bettor1_id: userProfile.id,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          sol_amount: betAmount,
          prediction_bettor1: betType,
          percentage_change: percentageChange,
          status: 'pending',
          creator: userProfile.id,
          created_at: new Date().toISOString(),
          duration: duration
        })
        .select()
        .single();

      if (error) {
        console.error("Error placing bet:", error);
        toast.error("Failed to place bet");

        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints + betAmount
        } : null);
        return;
      }

      const newBet: PXBBet = {
        id: betData.bet_id,
        userId: userProfile.id,
        tokenMint: tokenMint,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        betAmount: betAmount,
        betType: betType,
        percentageChange: percentageChange,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt
      };

      setBets(prevBets => [...prevBets, newBet]);
      toast.success(`Successfully placed bet of ${betAmount} PXB points!`);
      await fetchUserProfile();
      return newBet;
    } catch (error) {
      console.error("Exception placing bet:", error);
      toast.error("An unexpected error occurred");

      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints + betAmount
      } : null);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, setBets, fetchUserProfile, setIsLoading]);

  const generatePxbId = useCallback(() => {
    if (!userProfile) {
      toast.error("You need to be logged in to generate a PXB ID");
      return "";
    }
    
    if (userProfile.id) {
      setPxbIdGenerated(true);
      return userProfile.id;
    }
    
    setPxbIdGenerated(true);
    return userProfile.id;
  }, [userProfile]);

  const sendPoints = useCallback(async (recipientId: string, amount: number): Promise<boolean> => {
    if (!userProfile) {
      toast.error("You need to be logged in to send points");
      return false;
    }

    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return false;
    }

    if (amount > userProfile.pxbPoints) {
      toast.error(`Not enough PXB points. You have ${userProfile.pxbPoints}, but tried to send ${amount}.`);
      return false;
    }
    
    setIsSendingPoints(true);
    
    try {
      const { data, error } = await supabase.rpc('transfer_pxb_points', {
        sender_id: userProfile.id,
        recipient_id: recipientId,
        amount: amount
      });
      
      if (error) {
        console.error("Error sending points:", error);
        toast.error("Failed to send points: " + error.message);
        return false;
      }
      
      if (data === true) {
        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints - amount
        } : null);
        
        toast.success(`Successfully sent ${amount} PXB points!`);
        return true;
      } else {
        toast.error("Failed to send points. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Exception sending points:", error);
      toast.error("An unexpected error occurred");
      return false;
    } finally {
      setIsSendingPoints(false);
    }
  }, [userProfile, setUserProfile]);

  return {
    mintPoints,
    placeBet,
    sendPoints,
    generatePxbId,
    isSendingPoints,
    pxbIdGenerated
  };
};
