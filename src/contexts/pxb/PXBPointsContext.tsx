
import React, { createContext, useContext, useEffect } from 'react';
import { PXBPointsContextType } from './types';
import { useProfileData } from './useProfileData';
import { useTradeData } from './useTradeData';
import { useLeaderboardData } from './useLeaderboardData';
import { usePointOperations } from './usePointOperations';
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
  
  const { trades, setTrades, fetchUserTrades, isLoading: isLoadingTrades } = useTradeData(userProfile);
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
    sendPoints, 
    purchaseToken,
    sellToken,
    generatePxbId,
    mintingPoints,
    transferFeature
  } = usePointOperations(
    userProfile,
    setUserProfile,
    setTrades,
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

  const addPointsToUserWrapper = async (amount: number) => {
    try {
      await addPointsToUser(amount);
    } catch (error) {
      console.error("Error adding points to user:", error);
    }
  };

  const checkAndProcessReferralWrapper = async (referralCode: string) => {
    try {
      const result = await checkAndProcessReferral(referralCode);
      return result === undefined ? false : result;
    } catch (error) {
      console.error("Error processing referral:", error);
      return false;
    }
  };

  const fetchTokenTransactions = async (tokenId: string) => {
    try {
      if (trades && trades.length > 0) {
        return trades
          .filter(trade => trade.tokenMint === tokenId)
          .map(trade => ({
            id: trade.id,
            timestamp: trade.createdAt,
            type: 'buy',
            tokenAmount: trade.amount * 10,
            price: 0.001,
            pxbAmount: trade.amount,
            userId: trade.userId,
            tokenId: trade.tokenMint,
            tokenName: trade.tokenName || '',
            tokenSymbol: trade.tokenSymbol || ''
          }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching token transactions:", error);
      return [];
    }
  };

  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        isLoading,
        trades,
        userTrades: trades,
        leaderboard,
        winRateLeaderboard,
        mintPoints: mintPointsWrapper,
        sendPoints,
        purchaseToken: purchaseTokenWrapper,
        sellToken: sellTokenWrapper,
        generatePxbId,
        fetchUserProfile,
        fetchUserTrades,
        fetchLeaderboard,
        fetchWinRateLeaderboard,
        addPointsToUser: addPointsToUserWrapper,
        mintingPoints,
        transferFeature,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingTrades,
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
