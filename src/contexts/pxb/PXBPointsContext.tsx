
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchUserProfile, UserProfile } from '@/services/userService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBetsData } from './useBetsData';
import { usePointOperations } from './usePointOperations';
import { useProfileData } from './useProfileData';
import { useLeaderboardData } from './useLeaderboardData';
import { PXBPointsContextType } from './types';

// Create the context
const PXBPointsContext = createContext<PXBPointsContextType | undefined>(undefined);

export const PXBPointsProvider = ({ children }: { children: ReactNode }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const walletAddress = publicKey?.toBase58();

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pxbPoints, setPxbPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize sub-contexts
  const { 
    createBet, 
    placeBet,
    bets,
    activeBets,
    recentBets,
    fetchBets,
    fetchBet,
    currentBet
  } = useBetsData(walletAddress, pxbPoints);
  
  const {
    awardPoints,
    deductPoints,
    transferPoints
  } = usePointOperations(walletAddress, pxbPoints, setPxbPoints);
  
  const {
    updateUsername,
    claimDailyBonus,
    hasClaimedDailyBonus,
    earnedPXB
  } = useProfileData(walletAddress, userProfile, pxbPoints, setPxbPoints);
  
  const {
    leaderboard,
    userRank,
    fetchLeaderboard
  } = useLeaderboardData(walletAddress);

  // Fetch user profile when wallet is connected
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      if (walletAddress) {
        try {
          const profile = await fetchUserProfile(walletAddress);
          if (profile) {
            setUserProfile(profile);
            
            // Fetch points from users table
            const { data, error } = await supabase
              .from('users')
              .select('points')
              .eq('wallet_address', walletAddress)
              .single();
            
            if (data && !error) {
              setPxbPoints(data.points || 0);
            }
          } else {
            setPxbPoints(0);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          toast.error("Failed to load your profile");
        }
      } else {
        setUserProfile(null);
        setPxbPoints(0);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [walletAddress]);

  // Subscribe to point changes
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const userPointsChannel = supabase.channel('user_points_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('User points updated:', payload);
        if (payload.new && typeof payload.new.points === 'number') {
          setPxbPoints(payload.new.points);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(userPointsChannel);
    };
  }, [userProfile]);

  const refreshUserProfile = async () => {
    if (!walletAddress) return;
    
    try {
      const profile = await fetchUserProfile(walletAddress);
      if (profile) {
        setUserProfile(profile);
        
        // Fetch points from users table
        const { data, error } = await supabase
          .from('users')
          .select('points')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (data && !error) {
          setPxbPoints(data.points || 0);
        }
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
    }
  };

  // Context value
  const contextValue: PXBPointsContextType = {
    userProfile,
    walletAddress,
    pxbPoints,
    isLoading,
    createBet,
    placeBet,
    bets,
    activeBets,
    recentBets,
    fetchBets,
    fetchBet,
    currentBet,
    awardPoints,
    deductPoints,
    transferPoints,
    updateUsername,
    claimDailyBonus,
    hasClaimedDailyBonus,
    earnedPXB,
    leaderboard,
    userRank,
    fetchLeaderboard,
    refreshUserProfile
  };

  return (
    <PXBPointsContext.Provider value={contextValue}>
      {children}
    </PXBPointsContext.Provider>
  );
};

// Custom hook to use the PXB Points context
export const usePXBPoints = () => {
  const context = useContext(PXBPointsContext);
  if (context === undefined) {
    throw new Error('usePXBPoints must be used within a PXBPointsProvider');
  }
  return context;
};
