
import { useState, useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { Bet, BetPrediction } from '@/types/bet';

export const usePointOperations = (
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setBets: React.Dispatch<React.SetStateAction<PXBBet[]>>,
  fetchUserProfile: () => Promise<void>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [isMinting, setIsMinting] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const { publicKey } = useWallet();

  // Mint free PXB points
  const mintPoints = useCallback(async (amount: number = 100) => {
    if (!userProfile || !publicKey) {
      toast.error('Connect your wallet to mint PXB points');
      return;
    }

    setIsMinting(true);
    try {
      const walletAddress = publicKey.toString();
      
      // Update user's points in the database
      const { error } = await supabase
        .from('users')
        .update({
          points: userProfile.pxbPoints + amount
        })
        .eq('id', userProfile.id);
      
      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint PXB points');
        return;
      }
      
      // Record the minting in the history
      await supabase
        .from('points_history')
        .insert({
          user_id: userProfile.id,
          amount: amount,
          action: 'mint',
          reference_id: 'daily_mint'
        });
      
      // Update the user profile in the state
      setUserProfile({
        ...userProfile,
        pxbPoints: userProfile.pxbPoints + amount
      });
      
      toast.success(`Successfully minted ${amount} PXB points!`);
    } catch (error) {
      console.error('Unexpected error in mintPoints:', error);
      toast.error('Failed to mint PXB points due to an unexpected error');
    } finally {
      setIsMinting(false);
    }
  }, [userProfile, publicKey, setUserProfile]);

  // Place a bet
  const placeBet = useCallback(async (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    durationMinutes: number = 30
  ) => {
    if (!userProfile || !publicKey) {
      toast.error('Connect your wallet to place a bet');
      return;
    }
    
    if (userProfile.pxbPoints < betAmount) {
      toast.error(`Not enough PXB points. You need ${betAmount} but only have ${userProfile.pxbPoints}.`);
      return;
    }

    setIsPlacingBet(true);
    
    try {
      console.log('Starting bet placement with:', {
        tokenId, tokenName, tokenSymbol, betAmount, betType, percentageChange, durationMinutes,
        userProfileId: userProfile.id,
        walletAddress: publicKey.toString(),
        currentPoints: userProfile.pxbPoints
      });
      
      // Get the current authenticated user's session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Check if we have a valid session
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please try reconnecting your wallet.');
        return;
      }
      
      // If no session exists, try to create one using the wallet address
      if (!sessionData.session) {
        console.log('No session found, attempting to sign in with wallet', publicKey.toString());
        
        // Try to sign in with the wallet address
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: `${publicKey.toString()}@solana.wallet`, // Use wallet address as email
          password: publicKey.toString(), // Use wallet address as password
        });
        
        if (signInError) {
          // If sign in fails, try to sign up the user
          console.log('Sign in failed, attempting to create account', signInError);
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: `${publicKey.toString()}@solana.wallet`,
            password: publicKey.toString(),
            options: {
              data: {
                wallet_address: publicKey.toString()
              }
            }
          });
          
          if (signUpError) {
            console.error('Failed to create account:', signUpError);
            toast.error('Failed to authenticate with your wallet. Please try again.');
            return;
          }
          
          // Check if we now have a session after signup
          const { data: newSessionData } = await supabase.auth.getSession();
          if (!newSessionData.session) {
            toast.error('Authentication required. Please try reconnecting your wallet.');
            return;
          }
        }
      }
      
      // Re-check the session to ensure we're authenticated
      const { data: verifySessionData } = await supabase.auth.getSession();
      if (!verifySessionData.session) {
        toast.error('Authentication failed. Please try reconnecting your wallet.');
        return;
      }
      
      // Fetch token data from TokenDataCache to get the initial market cap
      const tokenData = await fetchTokenMetrics(tokenId);
      
      // We now always have token data due to fallback values in fetchTokenMetrics
      const initialMarketCap = tokenData?.marketCap || 1000; // Default to 1000 if still null
      
      console.log(`Initial market cap for ${tokenSymbol}: $${initialMarketCap}`);
      
      // Calculate duration in seconds
      const durationSeconds = durationMinutes * 60;
      
      // First, update the user points immediately in the UI for better UX
      const updatedPoints = userProfile.pxbPoints - betAmount;
      
      console.log(`Deducting points: ${userProfile.pxbPoints} -> ${updatedPoints}`);
      
      // Update user's points in the database FIRST before creating the bet
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: updatedPoints
        })
        .eq('id', userProfile.id);
      
      if (pointsError) {
        console.error('Error updating points:', pointsError);
        toast.error('Failed to deduct PXB points for bet');
        return;
      }
      
      // Update the user profile in the state after successful database update
      setUserProfile({
        ...userProfile,
        pxbPoints: updatedPoints
      });
      
      console.log('Points updated successfully in database, now recording in history');
      
      // Record the point deduction in the history
      await supabase
        .from('points_history')
        .insert({
          user_id: userProfile.id,
          amount: -betAmount,
          action: 'bet_placed',
          reference_id: tokenId
        });
      
      console.log('Point history recorded, now creating bet in database');
      
      // Create the bet in the database
      // Make sure to use the user ID from userProfile for bettor1_id
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .insert({
          bettor1_id: userProfile.id,
          token_mint: tokenId,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          sol_amount: betAmount,
          prediction_bettor1: betType,
          percentage_change: percentageChange,
          duration: durationSeconds,
          status: 'pending',
          creator: userProfile.id, // Use the user ID as creator, not wallet address
          initial_market_cap: initialMarketCap
        })
        .select()
        .single();
      
      if (betError) {
        // Attempt to revert the points if bet creation fails
        console.error('Error creating bet, attempting to revert points:', betError);
        
        await supabase
          .from('users')
          .update({
            points: userProfile.pxbPoints
          })
          .eq('id', userProfile.id);
          
        // Revert the UI change
        setUserProfile({
          ...userProfile,
          pxbPoints: userProfile.pxbPoints
        });
        
        toast.error('Failed to create bet. Your points have been returned.');
        return;
      }
      
      console.log('Bet created successfully in database:', betData);
      
      // Record the bet creation in history
      await supabase
        .from('bet_history')
        .insert({
          bet_id: betData.bet_id,
          user_id: userProfile.id,
          action: 'bet_created',
          details: {
            token_mint: tokenId,
            token_name: tokenName,
            token_symbol: tokenSymbol,
            amount: betAmount,
            type: betType,
            percentage_change: percentageChange,
            duration_minutes: durationMinutes
          },
          market_cap_at_action: initialMarketCap
        });
      
      // Format the new bet to add to the local state
      const newBet: PXBBet = {
        id: betData.bet_id,
        userId: userProfile.id,
        tokenMint: tokenId,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        betAmount: betAmount,
        betType: betType,
        percentageChange: percentageChange,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(new Date().getTime() + (durationSeconds * 1000)).toISOString(),
        initialMarketCap: initialMarketCap,
        currentMarketCap: initialMarketCap
      };
      
      console.log('Adding new bet to local state:', newBet);
      
      // Add the new bet to the local state
      setBets(prevBets => [newBet, ...prevBets]);
      
      // Dispatch a custom event to notify other components about the new bet
      // Use same event name and format as in supabaseService.ts
      const newBetForEvent: Bet = {
        id: betData.bet_id,
        tokenId: tokenId,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        initiator: publicKey.toString(),
        amount: betAmount,
        prediction: betType === 'up' ? 'migrate' : 'die',
        timestamp: new Date().getTime(),
        expiresAt: new Date(new Date().getTime() + (durationSeconds * 1000)).getTime(),
        status: 'open',
        duration: durationMinutes,
        // Add the required properties with default values
        onChainBetId: '',
        transactionSignature: ''
      };
      
      const newBetCreatedEvent = new CustomEvent('newBetCreated', {
        detail: { bet: newBetForEvent }
      });
      window.dispatchEvent(newBetCreatedEvent);
      
      toast.success(`${betType === 'up' ? 'MOON' : 'DIE'} bet placed on ${tokenSymbol}!`);
      
      // Refresh user profile to ensure points are updated
      fetchUserProfile();
      
      return newBet;
    } catch (error) {
      console.error('Unexpected error in placeBet:', error);
      // Attempt to revert points on unexpected error
      fetchUserProfile();
      toast.error('Failed to place bet due to an unexpected error. Refreshing your balance...');
    } finally {
      setIsPlacingBet(false);
    }
  }, [userProfile, publicKey, setUserProfile, setBets, fetchUserProfile]);

  return {
    mintPoints,
    placeBet,
    isMinting,
    isPlacingBet
  };
};
