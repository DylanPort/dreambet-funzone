
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, PXBBet, ReferralStats, LeaderboardEntry } from '@/types/pxb';
import { toast } from 'sonner';
import { useReferralSystem } from './useReferralSystem';
import { useProfileData } from './useProfileData';
import { usePointOperations } from './usePointOperations';
import { useBetOperations } from './useBetOperations';
import { useLeaderboard } from './useLeaderboard';

interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  sendPoints: (recipientId: string, amount: number) => Promise<boolean>;
  generatePxbId: () => string;
  bets: PXBBet[];
  isLoadingBets: boolean;
  fetchUserBets: () => Promise<void>;
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<boolean>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  isProcessingReferral: boolean;
  processPendingReferrals: () => Promise<void>;
  // Added properties to fix TypeScript errors
  placeBet: (tokenMint: string, tokenName: string, tokenSymbol: string, betAmount: number, betType: 'up' | 'down', percentageChange: number, duration: number) => Promise<PXBBet | void>;
  mintPoints: (amount: number) => Promise<void>;
  mintingPoints: boolean;
  addPointsToUser: (amount: number, reason: string) => Promise<boolean>;
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: LeaderboardEntry[];
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  userBets: PXBBet[];
}

const PXBPointsContext = createContext<PXBPointsContextType | undefined>(undefined);

export const PXBPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, connected } = useWallet();
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(false);

  // Use the new hooks for more modular code structure
  const {
    userProfile,
    setUserProfile,
    isLoading,
    setIsLoading,
    fetchUserProfile,
    addPointsToUser
  } = useProfileData();

  const {
    mintPoints,
    placeBet,
    sendPoints,
    generatePxbId,
    mintingPoints
  } = usePointOperations(userProfile, setUserProfile, setBets, fetchUserProfile, setIsLoading);

  const {
    fetchUserBets,
    userBets
  } = useBetOperations(userProfile, setBets, setIsLoadingBets);

  // Use the referral system hook
  const { 
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    isProcessingReferral,
    processPendingReferrals
  } = useReferralSystem(userProfile, fetchUserProfile);

  // Use the leaderboard hook
  const {
    leaderboard,
    winRateLeaderboard,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    isLeaderboardLoading,
    isLoadingWinRate
  } = useLeaderboard();

  // Fetch user profile when wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, connected, publicKey]);

  const value = {
    userProfile,
    isLoading,
    fetchUserProfile,
    sendPoints,
    generatePxbId,
    bets,
    isLoadingBets,
    fetchUserBets,
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    isProcessingReferral,
    processPendingReferrals,
    // Added properties
    placeBet,
    mintPoints,
    mintingPoints,
    addPointsToUser,
    leaderboard,
    winRateLeaderboard,
    fetchLeaderboard,
    fetchWinRateLeaderboard,
    isLeaderboardLoading,
    isLoadingWinRate,
    userBets
  };

  return (
    <PXBPointsContext.Provider value={value}>
      {children}
    </PXBPointsContext.Provider>
  );
};

export const usePXBPoints = () => {
  const context = useContext(PXBPointsContext);
  if (context === undefined) {
    throw new Error('usePXBPoints must be used within a PXBPointsProvider');
  }
  return context;
};
