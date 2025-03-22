import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types/pxb';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useLeaderboardData } from './pxb/useLeaderboardData';

interface PXBPointsContextProps {
  userProfile: UserProfile | null;
  leaderboard: UserProfile[];
  fetchLeaderboard: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  mintPoints: (amount: number) => Promise<void>;
  mintingPoints: boolean;
  walletConnected: boolean;
}

const PXBPointsContext = createContext<PXBPointsContextProps | undefined>(undefined);

interface PXBPointsProviderProps {
  children: React.ReactNode;
}

export const PXBPointsProvider: React.FC<PXBPointsProviderProps> = ({ children }) => {
  const { connected, publicKey, disconnect } = useWallet();
  const wallet = useAnchorWallet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mintingPoints, setMintingPoints] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    setWalletConnected(connected);
  }, [connected]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (connected && publicKey) {
        try {
          const response = await fetch(`/api/pxb/profile?walletAddress=${publicKey.toString()}`);
          if (response.ok) {
            const profileData = await response.json();
            setUserProfile(profileData);
          } else {
            console.error('Failed to fetch profile:', response.status);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchProfile();
  }, [connected, publicKey]);

  const connectWallet = async () => {
    if (!connected) {
      console.log('Wallet not connected');
      return;
    }
  };

  const disconnectWallet = () => {
    disconnect().catch(() => { });
    setUserProfile(null);
  };

  const mintPoints = async (amount: number) => {
    if (!wallet) {
      console.error('Wallet not connected!');
      return;
    }

    setMintingPoints(true);
    try {
      const response = await fetch('/api/pxb/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Points minted successfully:', result);

        // Optimistically update the user profile
        setUserProfile((prevProfile) => {
          if (prevProfile) {
            return { ...prevProfile, pxbPoints: prevProfile.pxbPoints + amount };
          }
          return prevProfile;
        });
      } else {
        console.error('Failed to mint points:', response.status);
      }
    } catch (error) {
      console.error('Error minting points:', error);
    } finally {
      setMintingPoints(false);
    }
  };

  // Updated to use the separate hook
  const { 
    leaderboard, 
    winrateLeaderboard,
    fetchLeaderboard 
  } = useLeaderboardData();
  
  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        leaderboard,
        fetchLeaderboard,
        connectWallet,
        disconnectWallet,
        mintPoints,
        mintingPoints,
        walletConnected
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};

export const usePXBPoints = () => {
  const context = useContext(PXBPointsContext);
  if (!context) {
    throw new Error('usePXBPoints must be used within a PXBPointsProvider');
  }
  return context;
};
