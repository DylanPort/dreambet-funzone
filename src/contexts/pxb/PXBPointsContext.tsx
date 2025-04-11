import React, { createContext, useContext, useEffect } from 'react';
import { PXBPointsContextType } from './types';
import { useProfileData } from './useProfileData';
import { useBetsData } from './useBetsData';
import { useLeaderboardData } from './useLeaderboardData';
import { usePointOperations } from './usePointOperations';
import { useBetProcessor } from './useBetProcessor';
import { useReferralSystem } from './useReferralSystem';
import { useTradingPool } from './useTradingPool';
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
    purchaseToken,
    sellToken,
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
    participateInTradingPool,
    executeTradeInPool,
    withdrawFromPool
  } = useTradingPool(userProfile, fetchUserProfile);

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

  const purchaseTokenWrapper = async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number,
    tokenQuantity: number,
    price: number
  ) => {
    return purchaseToken(tokenMint, tokenName, tokenSymbol, pxbAmount, tokenQuantity, price);
  };

  const sellTokenWrapper = async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ) => {
    return sellToken(tokenMint, tokenName, tokenSymbol, tokenQuantity, price);
  };

  const fetchTokenTransactions = async (tokenId: string) => {
    try {
      if (bets && bets.length > 0) {
        return bets
          .filter(bet => bet.tokenMint === tokenId)
          .map(bet => ({
            id: bet.id,
            timestamp: bet.createdAt,
            type: 'buy',
            tokenAmount: bet.betAmount * 10,
            price: 0.001,
            pxbAmount: bet.betAmount,
            userId: bet.userId,
            tokenId: bet.tokenMint,
            tokenName: bet.tokenName || '',
            tokenSymbol: bet.tokenSymbol || ''
          }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching token transactions:", error);
      return [];
    }
  };

  // Create wrapper function to match expected signature (amount: number) => Promise<void>
  const addPointsWrapper = async (amount: number): Promise<void> => {
    await addPointsToUser(amount, "Points operation");
  };

  // Create wrapper function to match expected signature for checkAndProcessReferral
  const checkAndProcessReferralWrapper = async (referralCode: string): Promise<boolean> => {
    await checkAndProcessReferral(referralCode);
    return true;
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
        purchaseToken: purchaseTokenWrapper,
        sellToken: sellTokenWrapper,
        participateInTradingPool,
        executeTradeInPool,
        withdrawFromPool,
        generatePxbId,
        fetchUserProfile,
        fetchUserBets,
        fetchLeaderboard,
        fetchWinRateLeaderboard,
        addPointsToUser: addPointsWrapper,
        mintingPoints,
        transferFeature,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingBets,
        generateReferralLink,
        checkAndProcessReferral: checkAndProcessReferralWrapper,
        referralStats,
        fetchReferralStats,
        isLoadingReferrals,
        fetchTokenTransactions
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
