
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { Bet, BetPrediction } from '@/types/bet';
import { useProfileData } from './pxb/useProfileData';
import { useBetsData } from './pxb/useBetsData';
import { usePointOperations } from './pxb/usePointOperations';
import { useLeaderboardData } from './pxb/useLeaderboardData';
import { toast } from 'sonner';

interface PXBPointsContextType {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isLoading: boolean;
  fetchUserProfile: () => Promise<void>;
  addPointsToUser: (amount: number, reason?: string) => Promise<boolean>;
  mintPoints: (amount: number) => Promise<void>;
  bets: PXBBet[];
  fetchBets: () => Promise<void>;
  topBettors: UserProfile[];
  leaderboardLoading: boolean;
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
}

export const PXBPointsContext = createContext<PXBPointsContextType>({
  userProfile: null,
  setUserProfile: () => {},
  isLoading: false,
  fetchUserProfile: async () => {},
  addPointsToUser: async () => false,
  mintPoints: async () => {},
  bets: [],
  fetchBets: async () => {},
  topBettors: [],
  leaderboardLoading: false,
  placeBet: async () => undefined,
  sendPoints: async () => false,
  purchaseToken: async () => false,
  sellToken: async () => false,
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
    fetchBets
  } = useBetsData(userProfile);
  
  const {
    mintPoints,
    placeBet,
    sendPoints,
    purchaseToken,
    sellToken,
  } = usePointOperations(userProfile, setUserProfile, setBets, fetchUserProfile, setIsLoading);
  
  const {
    topBettors,
    leaderboardLoading
  } = useLeaderboardData();
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile().then(() => {
        fetchBets();
      });
    }
  }, [connected, publicKey, fetchUserProfile, fetchBets]);
  
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
        fetchBets,
        topBettors,
        leaderboardLoading,
        placeBet,
        sendPoints,
        purchaseToken,
        sellToken,
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};

export default PXBPointsProvider;
