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

  // Mint points
  const mintPoints = useCallback(async (amount: number = 100) => {
    if (!userProfile) {
      toast.error("You need to be logged in to mint points");
      return;
    }

    setIsLoading(true);
    try {
      // Optimistically update the user's balance locally
      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints + amount
      } : null);

      // Update the user's balance in the database
      const { error } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + amount })
        .eq('id', userProfile.id);

      if (error) {
        console.error("Error minting points:", error);
        toast.error("Failed to mint points");

        // Revert the optimistic update if the database update fails
        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints - amount
        } : null);
      } else {
        toast.success(`Successfully minted ${amount} PXB points!`);
        await fetchUserProfile();
      }
    } catch (error) {
      console.error("Exception minting points:", error);
      toast.error("An unexpected error occurred");

      // Revert the optimistic update if an exception occurs
      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints - amount
      } : null);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, setUserProfile, fetchUserProfile, setIsLoading]);

  // Place bet
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
      // Optimistically update the user's balance locally
      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints - betAmount
      } : null);

      const expiresAt = new Date(Date.now() + duration * 60000).toISOString();

      // Create a new bet in the database
      const { data: betData, error } = await supabase
        .from('bets')
        .insert({
          user_id: userProfile.id,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          bet_amount: betAmount,
          bet_type: betType,
          percentage_change: percentageChange,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        console.error("Error placing bet:", error);
        toast.error("Failed to place bet");

        // Revert the optimistic update if the database update fails
        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints + betAmount
        } : null);
        return;
      }

      const newBet: PXBBet = {
        id: betData.id,
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
        expiresAt: expiresAt,
      };

      // Update the bets state
      setBets(prevBets => [...prevBets, newBet]);
      toast.success(`Successfully placed bet of ${betAmount} PXB points!`);
      await fetchUserProfile();
      return newBet;
    } catch (error) {
      console.error("Exception placing bet:", error);
      toast.error("An unexpected error occurred");

      // Revert the optimistic update if an exception occurs
      setUserProfile(prev => prev ? {
        ...prev,
        pxbPoints: prev.pxbPoints + betAmount
      } : null);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, setBets, fetchUserProfile, setIsLoading]);

  // Generate a PXB ID for the user - returns the ID so it can be displayed
  const generatePxbId = useCallback(() => {
    if (!userProfile) {
      toast.error("You need to be logged in to generate a PXB ID");
      return "";
    }
    
    // If the user already has an ID, return that (it's permanent)
    if (userProfile.id) {
      return userProfile.id;
    }
    
    // Just return the existing ID - it was already created when the profile was created
    return userProfile.id;
  }, [userProfile]);

  // Send points to another user
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
        // Update the user's balance locally
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
    isSendingPoints
  };
};
