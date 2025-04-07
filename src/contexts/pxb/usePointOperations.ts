import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, PXBBet } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet, BetPrediction } from '@/types/bet';
import { createSupabaseBet } from '@/services/supabaseService';

// Constants for minting limits
const MINT_LIMIT_PER_PERIOD = 20000; // Increased from 2000 for the promotion
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
  const [transferFeature, setTransferFeature] = useState<'enabled' | 'coming-soon'>('coming-soon');

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

        console.log('Created bet in Supabase:', newBet);

        // Update user points in Supabase - important for deducting points
        const { error: updateError } = await supabase
          .from('users')
          .update({ points: userProfile.pxbPoints - betAmount })
          .eq('id', userProfile.id);

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
          creator: walletAddress,
          tokenMint: newBet.tokenMint,
          tokenName: newBet.tokenName || '',
          tokenSymbol: newBet.tokenSymbol || '',
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

        console.log(`Bet placed successfully!`);
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
    if (transferFeature === 'coming-soon') {
      console.log('Send/receive feature is coming soon');
      return false;
    }

    if (!userProfile || !publicKey) {
      console.error('Connect your wallet to send points');
      return false;
    }

    if (amount <= 0) {
      console.error('Amount must be greater than zero');
      return false;
    }

    if (amount > userProfile.pxbPoints) {
      console.error('Insufficient PXB points');
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

      console.log(`Successfully sent ${amount} PXB points!`);
      return true;
    } catch (error) {
      console.error('Error sending points:', error);
      console.error('Failed to send points');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, publicKey, setUserProfile, fetchUserProfile, setIsLoading, transferFeature]);

  const purchaseToken = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number,
    tokenQuantity: number,
    price: number
  ): Promise<boolean> => {
    if (!userProfile || !publicKey) {
      console.error('Please connect your wallet to purchase tokens');
      return false;
    }

    if (pxbAmount > userProfile.pxbPoints) {
      console.error('Insufficient PXB points to purchase tokens');
      return false;
    }

    const walletAddress = publicKey.toString();

    try {
      setIsLoading(true);

      // Optimistically update user profile by deducting PXB amount
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - pxbAmount } : null);

      // Get user ID
      const userId = userProfile.id;

      // Record transaction in token_transactions table
      const { error: txError } = await supabase.from('token_transactions').insert({
        userid: userId,
        tokenid: tokenMint,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'buy',
        quantity: tokenQuantity,
        price: price,
        pxbamount: pxbAmount,
        timestamp: new Date().toISOString()
      });

      if (txError) {
        console.error('Error recording token purchase:', txError);
        // Revert optimistic update if transaction fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + pxbAmount } : null);
        return false;
      }

      // Update user points in Supabase - IMPORTANT: Don't call fetchUserProfile() here to avoid double credit
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - pxbAmount })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating user points after purchase:', updateError);
        // Revert optimistic update if update fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + pxbAmount } : null);
        return false;
      }

      // Record the purchase in points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: -pxbAmount,
        action: 'token_purchase',
        reference_id: tokenMint,
        reference_name: tokenName
      });

      // Update or create token portfolio entry
      const { data: existingPortfolio } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('userid', userId)
        .eq('tokenid', tokenMint)
        .single();

      if (existingPortfolio) {
        // Calculate new average purchase price
        const totalValue = (existingPortfolio.quantity * existingPortfolio.averagepurchaseprice) + (tokenQuantity * price);
        const newQuantity = existingPortfolio.quantity + tokenQuantity;
        const newAvgPrice = totalValue / newQuantity;

        await supabase
          .from('token_portfolios')
          .update({
            quantity: newQuantity,
            averagepurchaseprice: newAvgPrice,
            currentvalue: newQuantity * price,
            lastupdated: new Date().toISOString()
          })
          .eq('id', existingPortfolio.id);
      } else {
        // Create new portfolio entry
        await supabase
          .from('token_portfolios')
          .insert({
            userid: userId,
            tokenid: tokenMint,
            tokenname: tokenName,
            tokensymbol: tokenSymbol,
            quantity: tokenQuantity,
            averagepurchaseprice: price,
            currentvalue: tokenQuantity * price
          });
      }

      // Dispatch an event to add a marker on the price chart
      const purchaseEvent = new CustomEvent('tokenPurchase', {
        detail: {
          tokenId: tokenMint,
          price: price,
          timestamp: new Date().toISOString(),
          amount: tokenQuantity
        }
      });
      window.dispatchEvent(purchaseEvent);

      console.log(`Successfully purchased ${tokenQuantity} ${tokenSymbol} for ${pxbAmount} PXB!`);
      
      // IMPORTANT: Only refresh user profile once at the end to prevent double crediting
      await fetchUserProfile(); 
      return true;
    } catch (error) {
      console.error('Error purchasing token:', error);
      // Revert optimistic update if any error occurs
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + pxbAmount } : null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, publicKey, setUserProfile, fetchUserProfile, setIsLoading]);

  const sellToken = useCallback(async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ): Promise<boolean> => {
    if (!userProfile || !publicKey) {
      console.error('Please connect your wallet to sell tokens');
      return false;
    }

    const walletAddress = publicKey.toString();

    try {
      setIsLoading(true);
      
      // Get user ID
      const userId = userProfile.id;

      // Check if user has the tokens in their portfolio
      const { data: portfolio, error: portfolioError } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('userid', userId)
        .eq('tokenid', tokenMint)
        .single();

      if (portfolioError || !portfolio) {
        console.error('You do not own this token or portfolio not found:', portfolioError);
        return false;
      }

      if (portfolio.quantity < tokenQuantity) {
        console.error(`Insufficient token quantity. You only have ${portfolio.quantity} ${tokenSymbol}`);
        return false;
      }

      // Calculate sale proceeds in PXB
      const pxbProceeds = tokenQuantity * price;
      
      // Optimistically update user profile by adding PXB proceeds
      setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints + pxbProceeds } : null);

      // Record transaction in token_transactions table
      const { error: txError } = await supabase.from('token_transactions').insert({
        userid: userId,
        tokenid: tokenMint,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'sell',
        quantity: tokenQuantity,
        price: price,
        pxbamount: pxbProceeds,
        timestamp: new Date().toISOString()
      });

      if (txError) {
        console.error('Error recording token sale:', txError);
        // Revert optimistic update if transaction fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - pxbProceeds } : null);
        return false;
      }

      // Update user points in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints + pxbProceeds })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error updating user points after sale:', updateError);
        // Revert optimistic update if update fails
        setUserProfile(prev => prev ? { ...prev, pxbPoints: prev.pxbPoints - pxbProceeds } : null);
        return false;
      }

      // Record the sale in points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: pxbProceeds,
        action: 'token_sale',
        reference_id: tokenMint,
        reference_name: tokenName
      });

      // Update token portfolio
      const newQuantity = portfolio.quantity - tokenQuantity;
      
      if (newQuantity > 0) {
        // Update portfolio with reduced quantity
        await supabase
          .from('token_portfolios')
          .update({
            quantity: newQuantity,
            currentvalue: newQuantity * price,
            lastupdated: new Date().toISOString()
          })
          .eq('id', portfolio.id);
      } else {
        // Remove token from portfolio if quantity is zero
        await supabase
          .from('token_portfolios')
          .delete()
          .eq('id', portfolio.id);
      }

      console.log(`Successfully sold ${tokenQuantity} ${tokenSymbol} for ${pxbProceeds} PXB!`);
      await fetchUserProfile(); // Refresh user data
      return true;
    } catch (error) {
      console.error('Error selling token:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, publicKey, setUserProfile, fetchUserProfile, setIsLoading]);

  return {
    mintPoints,
    placeBet,
    sendPoints,
    purchaseToken,
    sellToken,
    generatePxbId: useCallback(() => generatePxbId(userProfile), [userProfile]),
    mintingPoints,
    transferFeature
  };
};
