
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, PXBBet, ReferralStats } from '@/types/pxb';
import { toast } from 'sonner';
import { useReferralSystem } from './useReferralSystem';

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
}

const PXBPointsContext = createContext<PXBPointsContextType | undefined>(undefined);

export const PXBPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, connected } = useWallet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(false);

  // Fetch the user's profile from Supabase
  const fetchUserProfile = useCallback(async () => {
    if (!connected || !publicKey) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Fetching user profile for wallet:', publicKey.toString());
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', publicKey.toString())
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user doesn't exist, create a new profile
        if (error.code === 'PGRST116') {
          console.log('Creating new user profile...');
          const newProfile = await createUserProfile(publicKey.toString());
          setUserProfile(newProfile);
        } else {
          toast.error('Failed to load user profile');
        }
      } else if (data) {
        console.log('User profile found:', data);
        setUserProfile({
          id: data.id,
          username: data.username || `User_${publicKey.toString().substring(0, 8)}`,
          pxbPoints: data.points || 0,
          createdAt: data.created_at
        });
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      toast.error('An unexpected error occurred while loading your profile');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  // Create a new user profile
  const createUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
    try {
      const username = `User_${walletAddress.substring(0, 8)}`;
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          username: username,
          points: 100 // Initial PXB points
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        toast.error('Failed to create user profile');
        return null;
      }
      
      if (data) {
        // Record the initial points mint in history
        await supabase
          .from('points_history')
          .insert({
            user_id: data.id,
            amount: 100,
            action: 'mint',
            reference_id: 'initial_signup'
          });
          
        toast.success('Profile created with 100 PXB points!');
        
        return {
          id: data.id,
          username: data.username || username,
          pxbPoints: data.points || 100,
          createdAt: data.created_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Unexpected error in createUserProfile:', error);
      toast.error('Failed to create your profile');
      return null;
    }
  };

  // Fetch the user's bets
  const fetchUserBets = useCallback(async () => {
    if (!userProfile) return;
    
    setIsLoadingBets(true);
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          bet_id,
          creator,
          token_mint,
          token_name,
          token_symbol,
          prediction_bettor1,
          sol_amount,
          duration,
          status,
          created_at,
          points_won,
          start_time,
          end_time,
          outcome,
          initial_market_cap,
          current_market_cap,
          percentage_change
        `)
        .eq('creator', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        toast.error('Failed to load your bets');
        return;
      }
      
      if (data) {
        const formattedBets: PXBBet[] = data.map(bet => ({
          id: bet.bet_id,
          userId: userProfile.id,
          tokenMint: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          betAmount: bet.sol_amount,
          betType: bet.prediction_bettor1 === 'up' ? 'up' : 'down',
          percentageChange: bet.percentage_change || 0,
          status: (bet.status as any) || 'pending',
          pointsWon: bet.points_won || 0,
          createdAt: bet.created_at,
          expiresAt: bet.end_time || new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString(),
          initialMarketCap: bet.initial_market_cap,
          currentMarketCap: bet.current_market_cap,
          userRole: 'creator',
          timeframe: Math.floor(bet.duration / 60), // Convert seconds to minutes
          resolvedAt: bet.outcome ? bet.end_time : undefined
        }));
        
        setBets(formattedBets);
      }
    } catch (error) {
      console.error('Error in fetchUserBets:', error);
      toast.error('An error occurred while loading your bets');
    } finally {
      setIsLoadingBets(false);
    }
  }, [userProfile]);

  // Send PXB points to another user
  const sendPoints = useCallback(async (recipientId: string, amount: number): Promise<boolean> => {
    if (!userProfile) return false;
    
    try {
      // Check if user has enough points
      if (userProfile.pxbPoints < amount) {
        toast.error('Not enough PXB points');
        return false;
      }
      
      // Find the recipient user
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('id')
        .eq('id', recipientId)
        .single();
      
      if (recipientError || !recipientData) {
        console.error('Recipient not found:', recipientError);
        toast.error('Recipient not found');
        return false;
      }
      
      // Transfer points using the database function
      const { data: transferResult, error: transferError } = await supabase
        .rpc('transfer_pxb_points', {
          sender_id: userProfile.id,
          recipient_id: recipientId,
          amount: amount
        });
      
      if (transferError) {
        console.error('Error transferring points:', transferError);
        toast.error('Failed to transfer points');
        return false;
      }
      
      if (transferResult) {
        // Update the local user profile
        setUserProfile(prev => prev ? {
          ...prev,
          pxbPoints: prev.pxbPoints - amount
        } : null);
        
        toast.success(`Successfully sent ${amount} PXB points!`);
        return true;
      } else {
        toast.error('Transfer failed');
        return false;
      }
    } catch (error) {
      console.error('Unexpected error in sendPoints:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }, [userProfile]);

  // Generate a PXB ID for the user
  const generatePxbId = useCallback(() => {
    if (!userProfile) return '';
    
    // Format: PXB-[first 8 chars of user ID]-[random 6 chars]
    const userIdPart = userProfile.id.substring(0, 8);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `PXB-${userIdPart}-${randomPart}`;
  }, [userProfile]);

  // Setup referral system with the hook
  const { 
    generateReferralLink,
    checkAndProcessReferral,
    referralStats,
    fetchReferralStats,
    isLoadingReferrals,
    isProcessingReferral,
    processPendingReferrals
  } = useReferralSystem(userProfile, fetchUserProfile);

  // Fetch user profile when wallet changes
  useEffect(() => {
    fetchUserProfile();
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
    processPendingReferrals
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
