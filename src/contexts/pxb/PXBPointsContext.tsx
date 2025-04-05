
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
  
  // Set up state and data fetching functions
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
  
  // Set up operations
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

  // Set up referral system
  const {
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals
  } = useReferralSystem(userProfile, fetchUserProfile);
  
  // Handle bet processing
  useBetProcessor(bets, userProfile, setUserProfile, setBets);
  
  // Load user profile when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [connected, publicKey, fetchUserProfile, setUserProfile]);

  // Create wrapper functions to match expected types in PXBPointsContextType
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

  // Add refetchUserProfile function
  const refetchUserProfile = async () => {
    if (connected && publicKey) {
      await fetchUserProfile();
    }
  };

  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        isLoading,
        bets,
        userBets: bets, // Expose bets as userBets for BetDetails.tsx
        leaderboard,
        winRateLeaderboard,
        mintPoints: mintPointsWrapper,
        placeBet: placeBetWrapper,
        sendPoints,
        generatePxbId,
        fetchUserProfile,
        refetchUserProfile,
        fetchUserBets,
        fetchLeaderboard,
        fetchWinRateLeaderboard,
        addPointsToUser,
        mintingPoints,
        transferFeature,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingBets,
        // Referral system
        generateReferralLink,
        checkAndProcessReferral,
        referralStats,
        fetchReferralStats,
        isLoadingReferrals
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
