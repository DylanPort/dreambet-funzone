
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile, PXBBet, LeaderboardEntry, WinRateLeaderboardEntry, ReferralStats } from '@/types/pxb';
import { Bet, BetPrediction } from '@/types/bet';
import { useProfileData } from './pxb/useProfileData';
import { useBetsData } from './pxb/useBetsData';
import { usePointOperations } from './pxb/usePointOperations';
import { useLeaderboardData } from './pxb/useLeaderboardData';
import { useReferralSystem } from './pxb/useReferralSystem';
import { toast } from 'sonner';

interface PXBPointsContextType {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  addPointsToUser: (amount: number, reason?: string) => Promise<boolean>;
  mintPoints: (amount: number) => Promise<void>;
  bets: PXBBet[];
  userBets: PXBBet[]; // Alias for bets for backward compatibility
  fetchBets: () => Promise<void>;
  fetchUserBets: () => Promise<void>; // Alias for fetchBets for backward compatibility
  topBettors: UserProfile[];
  leaderboardLoading: boolean;
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: WinRateLeaderboardEntry[];
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  isLoadingBets: boolean;
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  placeBet: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    duration: number
  ) => Promise<PXBBet | void>;
  sendPoints: (recipientId: string, amount: number) => Promise<boolean>;
  purchaseToken: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number,
    tokenQuantity: number,
    price: number
  ) => Promise<boolean>;
  sellToken: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ) => Promise<boolean>;
  generatePxbId: () => string;
  transferFeature: 'enabled' | 'coming-soon';
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<boolean>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  fetchTokenTransactions: (tokenId: string) => Promise<any[]>;
}

export const PXBPointsContext = createContext<PXBPointsContextType>({
  userProfile: null,
  setUserProfile: () => {},
  isLoading: false,
  fetchUserProfile: async () => {},
  addPointsToUser: async () => false,
  mintPoints: async () => {},
  bets: [],
  userBets: [],
  fetchBets: async () => {},
  fetchUserBets: async () => {},
  topBettors: [],
  leaderboardLoading: false,
  leaderboard: [],
  winRateLeaderboard: [],
  isLeaderboardLoading: false,
  isLoadingWinRate: false,
  isLoadingBets: false,
  fetchLeaderboard: async () => {},
  fetchWinRateLeaderboard: async () => {},
  placeBet: async () => undefined,
  sendPoints: async () => false,
  purchaseToken: async () => false,
  sellToken: async () => false,
  generatePxbId: () => '',
  transferFeature: 'coming-soon',
  generateReferralLink: async () => '',
  checkAndProcessReferral: async () => false,
  referralStats: { totalReferrals: 0, activeReferrals: 0, pointsEarned: 0 },
  fetchReferralStats: async () => {},
  isLoadingReferrals: false,
  fetchTokenTransactions: async () => [],
});

export const usePXBPoints = () => useContext(PXBPointsContext);

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
  
  const {
    bets,
    setBets,
    fetchUserBets,
    isLoading: isLoadingBets
  } = useBetsData(userProfile);
  
  const {
    mintPoints,
    mintingPoints,
    placeBet,
    sendPoints,
    purchaseToken,
    sellToken,
    generatePxbId,
    transferFeature
  } = usePointOperations(userProfile, setUserProfile, setBets, fetchUserProfile, setIsLoading);
  
  const {
    leaderboard,
    winRateLeaderboard,
    isLoading: isLeaderboardLoading,
    isLoadingWinRate,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    topBettors,
    leaderboardLoading
  } = useLeaderboardData();

  // Use empty referral system if not available
  const defaultReferralSystem = {
    generateReferralLink: async () => '',
    checkAndProcessReferral: async () => false,
    referralStats: { totalReferrals: 0, activeReferrals: 0, pointsEarned: 0 },
    fetchReferralStats: async () => {},
    isLoadingReferrals: false
  };
  
  // Try to import the useReferralSystem hook if it exists
  const referralSystem = typeof useReferralSystem === 'function' 
    ? useReferralSystem(userProfile, fetchUserProfile)
    : defaultReferralSystem;
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile().then(() => {
        fetchUserBets();
      });
    }
  }, [connected, publicKey, fetchUserProfile, fetchUserBets]);

  const fetchTokenTransactions = async (tokenId: string): Promise<any[]> => {
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
  
  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        setUserProfile,
        isLoading,
        fetchUserProfile,
        addPointsToUser,
        mintPoints,
        bets,
        userBets: bets, // Alias for backward compatibility
        fetchBets: fetchUserBets, // Alias
        fetchUserBets,
        topBettors,
        leaderboardLoading,
        leaderboard,
        winRateLeaderboard,
        isLeaderboardLoading,
        isLoadingWinRate,
        isLoadingBets,
        fetchLeaderboard,
        fetchWinRateLeaderboard,
        placeBet,
        sendPoints,
        purchaseToken,
        sellToken,
        generatePxbId,
        transferFeature,
        ...referralSystem,
        fetchTokenTransactions
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};

export default PXBPointsProvider;
