import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, PXBBet } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, BetPrediction } from '@/types/bet';
import { createSupabaseBet } from '@/services/supabaseService';
import { toast } from '@/hooks/use-toast';

// Constants for minting limits
const MINT_LIMIT_PER_PERIOD = 2000; // Max tokens per period
const MINT_PERIOD_HOURS = 24; // Period in hours
const MINT_PERIOD_MS = MINT_PERIOD_HOURS * 60 * 60 * 1000; // Period in milliseconds

// Define generatePxbId at the top level to avoid using it before declaration
const generatePxbId = (userProfile: UserProfile | null): string => {
  if (!userProfile) return "";
  const shortId = userProfile.id.substring(0, 8).toUpperCase();
  const uniqueId = uuidv4().substring(0, 3);
  return `PXB-${shortId}-${uniqueId}`;
};

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
      console.error('Connect your wallet to mint points');
      return;
    }

    if (amount <= 0) {
      console.error('Amount must be greater than zero');
      return;
    }

    const walletAddress = publicKey.toString();
    
    setMintingPoints(true);
    try {
      // Check if user has a temporary profile
      const isTemporaryUser = userProfile.isTemporary || userProfile.id.startsWith('temp-');
      let mintAmount = amount;
      
      // Only check minting history for permanent users
      if (!isTemporaryUser) {
        // Get minting history for this wallet in the last 24 hours
        const now = new Date();
        const periodStart = new Date(now.getTime() - MINT_PERIOD_MS);
        
        try {
          const { data: mintHistory, error: historyError } = await supabase
            .from('points_history')
            .select('amount')
            .eq('user_id', userProfile.id)
            .eq('action', 'mint')
            .gte('created_at', periodStart.toISOString());
            
          if (historyError) {
            console.error('Error fetching mint history:', historyError);
            // Continue with minting anyway to not block the user
          } else {
            // Calculate how much has been minted in the current period
            const mintedInPeriod = mintHistory?.reduce((total, record) => total + record.amount, 0) || 0;
            const remainingAllowance = MINT_LIMIT_PER_PERIOD - mintedInPeriod;
            
            if (remainingAllowance <= 0) {
              console.error(`You've reached your minting limit of ${MINT_LIMIT_PER_PERIOD} PXB per ${MINT_PERIOD_HOURS} hours`);
              setMintingPoints(false);
              return;
            }
            
            // If requested amount exceeds remaining allowance, limit it
            mintAmount = Math.min(amount, remainingAllowance);
            if (mintAmount < amount) {
              console.log(`Mint limit reached. You can only mint ${mintAmount} more PXB within this ${MINT_PERIOD_HOURS}-hour period`);
            }
          }
        } catch (historyErr) {
          console.error('Error processing mint history:', historyErr);
          // Continue with minting anyway
        }
      }
      
      // For temporary users, just update the state without database operations
      if (isTemporaryUser) {
        // Update the user profile with new points for temporary users
        const newPointsTotal = userProfile.pxbPoints + mintAmount;
        setUserProfile({
          ...userProfile,
          pxbPoints: newPointsTotal
        });
        
        console.log(`Successfully minted ${mintAmount} PXB points!`);
        setMintingPoints(false);
        return;
      }
      
      // For permanent users, continue with database operations
      // Get the current user profile to ensure we have the latest data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('points')
        .eq('wallet_address', walletAddress)
        .single();
        
      if (fetchError) {
        console.error('Error fetching current points:', fetchError);
        console.error('Failed to mint points');
        setMintingPoints(false);
        return;
      }
      
      const currentPoints = userData?.points || userProfile.pxbPoints;
      const newPointsTotal = currentPoints + mintAmount;
      
      // Update the points in the database
      const { data, error } = await supabase
        .from('users')
        .update({ points: newPointsTotal })
        .eq('wallet_address', walletAddress)
        .select();

      if (error) {
        console.error('Error minting points:', error);
        console.error('Failed to mint points');
        setMintingPoints(false);
        return;
      }

      console.log('Points updated in database:', data);

      // Add record to points history with a timestamp
      const { error: historyError2 } = await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: mintAmount,
        action: 'mint',
        reference_id: `mint_${Date.now()}_${uuidv4().substring(0, 8)}`,  // Use timestamp and UUID to make each mint unique
        created_at: new Date().toISOString()
      });

      if (historyError2) {
        console.error('Error recording points history:', historyError2);
        // Continue anyway since the points were already added
      }

      // Update the user profile with new points
      setUserProfile({
        ...userProfile,
        pxbPoints: newPointsTotal
      });
      
      if (mintAmount === amount) {
        console.log(`Successfully minted ${mintAmount} PXB points!`);
      } else {
        console.log(`Successfully minted ${mintAmount} PXB points! (Limit reached)`);
      }
    } catch (error) {
      console.error('Error in mintPoints:', error);
      console.error('Failed to mint points');
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
      console.error('Please connect your wallet to place a bet.');
      return;
    }

    if (betAmount > userProfile.pxbPoints) {
      console.error('Insufficient PXB points to place this bet.');
      return;
    }

    const walletAddress = publicKey.toString();
    const pxbId = generatePxbId(userProfile);

    try {
      setIsLoading(true);

      // Optimistically update user profile
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - betAmount } : null);

      // Convert betType to a valid BetPrediction
      const prediction: BetPrediction = betType === 'up' ? 'up' : 'down';

      try {
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
          initialMarketCap: newBet.initialMarketCap,
          currentMarketCap: newBet.initialMarketCap
        };

        // Update bets state
        setBets(prevBets => [...prevBets, pxbBet]);

        toast.success(`Bet placed successfully!`);
        return pxbBet;
      } catch (supabaseError: any) {
        console.error('Error with Supabase operations:', supabaseError);
        // Revert optimistic update if Supabase operations fail
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + betAmount } : null);
        throw new Error(supabaseError.message || 'Failed to place bet in database');
      }
    } catch (error: any) {
      console.error('Error placing bet:', error);
      console.error(error.message || 'Failed to place bet');
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

  return {
    mintPoints,
    placeBet,
    sendPoints,
    generatePxbId: useCallback(() => generatePxbId(userProfile), [userProfile]),
    mintingPoints // Expose the mintingPoints state
  };
};
