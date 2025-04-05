
import React, { createContext, useContext, useEffect } from 'react';
import { PXBPointsContextType } from './types';
import { useProfileData } from './useProfileData';
import { useBetsData } from './useBetsData';
import { useLeaderboardData } from './useLeaderboardData';
import { usePointOperations } from './usePointOperations';
import { useBetProcessor } from './useBetProcessor';
import { useReferralSystem } from './useReferralSystem';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';

const PXBPointsContext = createContext<PXBPointsContextType | undefined>(undefined);

export const usePXBPoints = () => {
  const context = useContext(PXBPointsContext);
  if (context === undefined) {
    throw new Error('usePXBPoints must be used within a PXBPointsProvider');
  }
  return context;
};

export const PXBPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, publicKey } = useWallet();
  
  const { 
    userProfile, 
    setUserProfile, 
    isLoading, 
    setIsLoading, 
    fetchUserProfile,
    addPointsToUser
  } = useProfileData();
  
  const { bets, setBets, fetchUserBets, isLoading: isLoadingBets } = useBetsData(userProfile);
  const { 
    leaderboard, 
    winRateLeaderboard,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    isLoading: isLeaderboardLoading,
    isLoadingWinRate
  } = useLeaderboardData();
  
  const { 
    mintPoints, 
    placeBet, 
    sendPoints, 
    generatePxbId,
    mintingPoints,
    transferFeature
  } = usePointOperations(
    userProfile,
    setUserProfile,
    setBets,
    fetchUserProfile,
    setIsLoading
  );

  const {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  } = useReferralSystem(userProfile, fetchUserProfile);
  
  useBetProcessor(bets, userProfile, setUserProfile, setBets);
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [connected, publicKey, fetchUserProfile, setUserProfile]);

  const mintPointsWrapper = async (amount?: number) => {
    if (amount) {
      await mintPoints(amount);
    }
  };

  const placeBetWrapper = async (
    tokenMint: string, 
    tokenName: string, 
    tokenSymbol: string, 
    betAmount: number, 
    betType: 'up' | 'down', 
    percentageChange: number,
    duration: number
  ) => {
    return placeBet(tokenMint, tokenName, tokenSymbol, betAmount, betType, percentageChange, duration);
  };

  const fetchTokenTransactions = async (tokenId: string) => {
    try {
      if (bets && bets.length > 0) {
        const tokenBets = bets.filter(bet => bet.tokenMint === tokenId);
        
        const firstBet = tokenBets.length > 0 ? tokenBets.reduce((earliest, current) => 
          new Date(current.createdAt) < new Date(earliest.createdAt) ? current : earliest
        , tokenBets[0]) : null;
        
        return tokenBets.map((bet, index) => {
          const isFirst = bet.id === firstBet?.id;
          
          let currentValue = bet.betAmount;
          if (bet.status === 'won') {
            currentValue = bet.pointsWon || bet.betAmount * 2;
          } else if (bet.status === 'lost') {
            currentValue = 0;
          }
          
          // Determine transaction type - "buy" for "up" bets and "sell" for "down" bets
          const transactionType = bet.betType === 'up' ? 'buy' : 'sell';
          
          return {
            id: bet.id,
            timestamp: bet.createdAt,
            type: transactionType,
            tokenAmount: bet.betAmount * 10,
            price: 0.001,
            pxbAmount: bet.betAmount,
            userId: bet.userId,
            tokenId: bet.tokenMint,
            tokenName: bet.tokenName || '',
            tokenSymbol: bet.tokenSymbol || '',
            isInitialMarketBuy: isFirst,
            buyerAddress: transactionType === 'buy' ? bet.userId : undefined,
            sellerAddress: transactionType === 'sell' ? bet.userId : undefined,
            currentPxbValue: currentValue
          };
        });
      }
      return [];
    } catch (error) {
      console.error("Error fetching token transactions:", error);
      return [];
    }
  };

  // New function to fetch all token transactions from all users
  const fetchAllTokenTransactions = async (tokenId: string) => {
    try {
      // Query the token_transactions table for this specific token
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('tokenid', tokenId)
        .order('timestamp', { ascending: false });
        
      if (error) {
        console.error("Error fetching public token transactions:", error);
        return [];
      }
      
      // If we have data from the token_transactions table, format and return it
      if (data && data.length > 0) {
        return data.map(tx => ({
          id: tx.id,
          timestamp: tx.timestamp,
          type: tx.type,
          tokenAmount: tx.quantity,
          price: tx.price,
          pxbAmount: tx.pxbamount,
          userId: tx.userid,
          tokenId: tx.tokenid,
          tokenName: tx.tokenname,
          tokenSymbol: tx.tokensymbol,
          buyerAddress: tx.type === 'buy' ? tx.userid : undefined,
          sellerAddress: tx.type === 'sell' ? tx.userid : undefined,
        }));
      }
      
      // Fallback to using bets as a data source
      const { data: allBets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('token_mint', tokenId)
        .order('created_at', { ascending: false });
        
      if (betsError) {
        console.error("Error fetching bets for token transactions:", betsError);
        return [];
      }
      
      if (allBets && allBets.length > 0) {
        return allBets.map(bet => {
          // Determine transaction type - "buy" for "up" bets and "sell" for "down" bets
          const transactionType = bet.prediction_bettor1 === 'up' ? 'buy' : 'sell';
          
          let currentValue = bet.sol_amount;
          if (bet.status === 'won') {
            currentValue = bet.points_won || bet.sol_amount * 2;
          } else if (bet.status === 'lost') {
            currentValue = 0;
          }
          
          return {
            id: bet.bet_id,
            timestamp: bet.created_at,
            type: transactionType,
            tokenAmount: bet.sol_amount * 10,
            price: 0.001,
            pxbAmount: bet.sol_amount,
            userId: bet.bettor1_id,
            tokenId: bet.token_mint,
            tokenName: bet.token_name || '',
            tokenSymbol: bet.token_symbol || '',
            buyerAddress: transactionType === 'buy' ? bet.bettor1_id : undefined,
            sellerAddress: transactionType === 'sell' ? bet.bettor1_id : undefined,
            currentPxbValue: currentValue
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error("Error in fetchAllTokenTransactions:", error);
      return [];
    }
  };

  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        isLoading,
        bets,
        userBets: bets,
        leaderboard,
        winRateLeaderboard,
        mintPoints: mintPointsWrapper,
        placeBet: placeBetWrapper,
        sendPoints,
        generatePxbId,
        fetchUserProfile,
        fetchUserBets,
        fetchLeaderboard,
        fetchWinRateLeaderboard,
        addPointsToUser,
        mintingPoints,
        transferFeature,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingBets,
        generateReferralLink,
        checkAndProcessReferral,
        referralStats,
        fetchReferralStats,
        isLoadingReferrals,
        fetchTokenTransactions,
        fetchAllTokenTransactions
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
