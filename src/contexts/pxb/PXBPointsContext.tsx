
import React, { createContext, useContext, useEffect } from 'react';
import { PXBPointsContextType } from './types';
import { useProfileData } from './useProfileData';
import { useBetsData } from './useBetsData';
import { useLeaderboardData } from './useLeaderboardData';
import { usePointOperations } from './usePointOperations';
import { useBetProcessor } from './useBetProcessor';
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
    fetchUserProfile 
  } = useProfileData();
  
  const { bets, setBets, fetchUserBets } = useBetsData(userProfile);
  const { leaderboard, fetchLeaderboard } = useLeaderboardData();
  
  // Set up operations
  const { mintPoints, placeBet, sendPoints, generatePxbId } = usePointOperations(
    userProfile,
    setUserProfile,
    setBets,
    fetchUserProfile,
    setIsLoading
  );
  
  // Handle bet processing
  useBetProcessor(bets, userProfile, setUserProfile, setBets);
  
  // Load user profile when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      console.log("Wallet connected in PXBPointsContext, fetching profile");
      fetchUserProfile();
    } else {
      console.log("Wallet disconnected in PXBPointsContext, clearing profile");
      setUserProfile(null);
    }
  }, [connected, publicKey, fetchUserProfile, setUserProfile]);

  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        isLoading,
        bets,
        leaderboard,
        mintPoints,
        placeBet,
        sendPoints,
        generatePxbId,
        fetchUserProfile,
        fetchUserBets,
        fetchLeaderboard
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
