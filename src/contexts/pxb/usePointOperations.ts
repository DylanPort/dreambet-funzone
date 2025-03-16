
import { useState, useCallback } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { supabase, isAuthRateLimited, checkSupabaseTables, isAuthDisabled } from '@/integrations/supabase/client';
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
      const walletAddress = publicKey.toString();
      
      // First check if auth is disabled in Supabase
      const authDisabled = await isAuthDisabled();
      let isAuthenticated = false;
      
      if (!authDisabled) {
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
          console.log('No session found, attempting to sign in with wallet', walletAddress);
          
          // Try to sign in with the wallet address
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: `${walletAddress}@solana.wallet`, // Use wallet address as email
            password: walletAddress, // Use wallet address as password
          });
          
          if (signInError) {
            // If sign in fails due to auth being disabled, proceed without auth
            if (signInError.message === 'Email logins are disabled') {
              console.log('Sign in failed: Email authentication is disabled, proceeding without login');
              // We can proceed without authentication since we have the wallet address
            } else {
              // Try to sign up the user
              console.log('Sign in failed, attempting to create account', signInError);
              
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: `${walletAddress}@solana.wallet`,
                password: walletAddress,
                options: {
                  data: {
                    wallet_address: walletAddress
                  }
                }
              });
              
              if (signUpError) {
                // If sign up fails due to signups being disabled, proceed without auth
                if (signUpError.message === 'Signups not allowed for this instance') {
                  console.log('Failed to create account: Signups are disabled, proceeding without authentication');
                  // We can proceed without authentication since we have the wallet address
                } else {
                  console.error('Failed to authenticate with your wallet:', signUpError);
                }
              } else {
                console.log('Successfully created account for wallet', walletAddress);
                isAuthenticated = true;
              }
            }
          } else {
            console.log('Successfully signed in with wallet', walletAddress);
            isAuthenticated = true;
          }
        } else {
          isAuthenticated = true;
        }
      } else {
        console.log('Authentication is disabled in Supabase, proceeding without auth');
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
      setUserProfile({
        ...userProfile,
        pxbPoints: updatedPoints
      });
      
      // Update user's points in the database
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: updatedPoints
        })
        .eq('id', userProfile.id);
      
      if (pointsError) {
        // Revert the UI change if the database update fails
        setUserProfile({
          ...userProfile,
          pxbPoints: userProfile.pxbPoints
        });
        console.error('Error updating points:', pointsError);
        toast.error('Failed to deduct PXB points for bet');
        return;
      }
      
      // Record the point deduction in the history
      await supabase
        .from('points_history')
        .insert({
          user_id: userProfile.id,
          amount: -betAmount,
          action: 'bet_placed',
          reference_id: tokenId
        });
      
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
        
        console.error('Error creating bet:', betError);
        toast.error('Failed to create bet. Your points have been returned.');
        return;
      }
      
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
      
      // Add the new bet to the local state
      setBets(prevBets => [newBet, ...prevBets]);
      
      // Dispatch a custom event to notify other components about the new bet
      // Use same event name and format as in supabaseService.ts
      const newBetForEvent: Bet = {
        id: betData.bet_id,
        tokenId: tokenId,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        initiator: walletAddress,
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
