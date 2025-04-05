
import React, { createContext, useContext, useEffect } from 'react';
import { PXBPointsContextType } from './types';
import { useProfileData } from './useProfileData';
import { useBetsData } from './useBetsData';
import { useLeaderboardData } from './useLeaderboardData';
import { usePointOperations } from './usePointOperations';
import { useBetProcessor } from './useBetProcessor';
import { useReferralSystem } from './useReferralSystem';
import { useWallet } from '@solana/wallet-adapter-react';

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

  // Create a wrapper for addPointsToUser to match the expected signature in PXBPointsContextType
  const addPointsToUserWrapper = async (amount: number, reason: string): Promise<boolean> => {
    try {
      await addPointsToUser(amount, reason);
      return true;
    } catch (error) {
      console.error("Error adding points to user:", error);
      return false;
    }
  };

  // Create feature object for transferFeature
  const transferFeatureWrapper = transferFeature ? 
    { enabled: transferFeature === 'enabled', message: transferFeature === 'coming-soon' ? 'Coming soon' : undefined } : 
    { enabled: false, message: 'Coming soon' };

  // Create a wrapper for generateReferralLink to match the expected signature
  const generateReferralLinkWrapper = () => {
    return generateReferralLink();
  };

  // Create a wrapper for checkAndProcessReferral to match the expected signature
  const checkAndProcessReferralWrapper = async (code: string): Promise<boolean> => {
    try {
      await checkAndProcessReferral(code);
      return true;
    } catch (error) {
      console.error("Error processing referral:", error);
      return false;
    }
  };

  // Adapt referralStats to match the expected interface
  const adaptedReferralStats = {
    referralsCount: referralStats.referrals_count || 0,
    pointsEarned: referralStats.points_earned || 0
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
        addPointsToUser: addPointsToUserWrapper,
        mintingPoints,
        transferFeature: transferFeatureWrapper,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingBets,
        generateReferralLink: generateReferralLinkWrapper,
        checkAndProcessReferral: checkAndProcessReferralWrapper,
        referralStats: adaptedReferralStats,
        fetchReferralStats,
        isLoadingReferrals,
        fetchTokenTransactions
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
