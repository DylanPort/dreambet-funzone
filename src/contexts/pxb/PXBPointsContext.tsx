
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PXBBet, UserProfile, LeaderboardEntry } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import { useBetsData } from './useBetsData';
import { useLeaderboardData } from './useLeaderboardData';
import { useTradingPool } from './useTradingPool';
import { useBetProcessor } from './useBetProcessor';
import { usePointOperations } from './usePointOperations';
import { useReferralSystem } from './useReferralSystem';
import { useProfileData } from './useProfileData';

// Define the context interface
interface PXBPointsContextType {
  userProfile: UserProfile | null;
  allUserProfiles: UserProfile[];
  userBets: PXBBet[];
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
  createTemporaryProfile: () => Promise<UserProfile>;
  createBet: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    percentageChange: number,
    duration: number
  ) => Promise<PXBBet>;
  resolveBet: (betId: string) => Promise<void>;
  transferPoints: (receiverWallet: string, amount: number) => Promise<void>;
  generateReferralCode: () => Promise<string>;
  useReferralCode: (code: string) => Promise<boolean>;
  checkReferralCodeValid: (code: string) => Promise<boolean>;
  transferFeature: { enabled: boolean; fee: number };
  refreshLeaderboards: () => Promise<void>;
  claimDailyBonus: () => Promise<void>;
  enterTradingPool: (amount: number) => Promise<void>;
  leaveTradingPool: (amount: number) => Promise<void>;
  tradingPoolBalance: number;
  tradingPoolRewards: number;
}

// Create context with default values
const PXBPointsContext = createContext<PXBPointsContextType>({
  userProfile: null,
  allUserProfiles: [],
  userBets: [],
  leaderboard: [],
  winRateLeaderboard: [],
  isLoading: true,
  error: null,
  refreshUserProfile: async () => {},
  createTemporaryProfile: async () => ({ id: '', username: '', pxbPoints: 0, createdAt: '' }),
  createBet: async () => ({
    id: '',
    userId: '',
    tokenMint: '',
    tokenName: '',
    tokenSymbol: '',
    betAmount: 0,
    betType: 'up',
    percentageChange: 0,
    status: 'pending',
    pointsWon: 0,
    createdAt: '',
    expiresAt: ''
  }),
  resolveBet: async () => {},
  transferPoints: async () => {},
  generateReferralCode: async () => '',
  useReferralCode: async () => false,
  checkReferralCodeValid: async () => false,
  transferFeature: { enabled: true, fee: 2 },
  refreshLeaderboards: async () => {},
  claimDailyBonus: async () => {},
  enterTradingPool: async () => {},
  leaveTradingPool: async () => {},
  tradingPoolBalance: 0,
  tradingPoolRewards: 0
});

// Provider component
export const PXBPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the wallet connection
  const { publicKey, connected } = useWallet();
  
  // State for the user profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom hooks for functionality
  const {
    userBets,
    refreshUserBets
  } = useBetsData(userProfile?.id);
  
  const {
    leaderboard,
    winRateLeaderboard,
    refreshLeaderboards
  } = useLeaderboardData();
  
  const {
    tradingPoolBalance,
    tradingPoolRewards,
    enterTradingPool,
    leaveTradingPool
  } = useTradingPool(userProfile?.id);
  
  const {
    createBet,
    resolveBet
  } = useBetProcessor(userProfile?.id, refreshUserBets);
  
  const {
    transferPoints,
    claimDailyBonus
  } = usePointOperations(userProfile?.id, refreshUserProfile);
  
  const {
    generateReferralCode,
    useReferralCode,
    checkReferralCodeValid
  } = useReferralSystem(userProfile?.id);
  
  const {
    fetchUserProfile,
    fetchAllProfiles,
    createTemporaryProfile
  } = useProfileData();
  
  const transferFeature = { enabled: true, fee: 2 };

  // Function to refresh the user profile
  const refreshUserProfile = async () => {
    if (!publicKey) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const profile = await fetchUserProfile(publicKey.toString());
      setUserProfile(profile);
      
      const allProfiles = await fetchAllProfiles();
      setAllUserProfiles(allProfiles);
      
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError('Failed to load user profile');
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Load the user profile when the wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshUserProfile();
    } else {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [connected, publicKey]);
  
  // Context value
  const value = {
    userProfile,
    allUserProfiles,
    userBets,
    leaderboard,
    winRateLeaderboard,
    isLoading,
    error,
    refreshUserProfile,
    createTemporaryProfile,
    createBet,
    resolveBet,
    transferPoints,
    generateReferralCode,
    useReferralCode,
    checkReferralCodeValid,
    transferFeature,
    refreshLeaderboards,
    claimDailyBonus,
    enterTradingPool,
    leaveTradingPool,
    tradingPoolBalance,
    tradingPoolRewards
  };

  return (
    <PXBPointsContext.Provider value={value}>
      {children}
    </PXBPointsContext.Provider>
  );
};

// Custom hook to use the PXBPoints context
export const usePXBPoints = () => useContext(PXBPointsContext);
