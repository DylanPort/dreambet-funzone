
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
  leaderboard: UserProfile[];
  mintPoints: (username: string) => Promise<void>;
  placeBet: (tokenMint: string, tokenName: string, tokenSymbol: string, betAmount: number, betType: 'up' | 'down', duration: number) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchUserBets: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
}

const PXBPointsContext = createContext<PXBPointsContextType | undefined>(undefined);

export const usePXBPoints = () => {
  const context = useContext(PXBPointsContext);
  if (context === undefined) {
    throw new Error('usePXBPoints must be used within a PXBPointsProvider');
  }
  return context;
};

export const PXBPointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bets, setBets] = useState<PXBBet[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const { connected, publicKey } = useWallet();

  // Check for wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [connected, publicKey]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey) {
        setUserProfile(null);
        return;
      }

      const walletAddress = publicKey.toString();
      
      // Check if user exists in Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist yet, but that's okay
          console.log('User not found in database yet');
          setUserProfile(null);
        } else {
          console.error('Error fetching user profile:', error);
          toast.error('Failed to load user profile');
        }
      } else if (userData) {
        // Transform the Supabase user data to our UserProfile format
        setUserProfile({
          id: userData.id,
          username: userData.username || walletAddress.substring(0, 8),
          pxbPoints: userData.points || 0,
          reputation: userData.reputation || 0,
          createdAt: userData.created_at
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const mintPoints = async (username: string) => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey) {
        toast.error('Please connect your wallet first');
        return;
      }
      
      const walletAddress = publicKey.toString();
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (existingUser && existingUser.points >= 500) {
        toast.error('You have already claimed your PXB Points');
        setUserProfile({
          id: existingUser.id,
          username: existingUser.username || username,
          pxbPoints: existingUser.points,
          reputation: existingUser.reputation || 0,
          createdAt: existingUser.created_at
        });
        return;
      }
      
      // Create or update the user
      let userId = existingUser?.id || crypto.randomUUID();
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          wallet_address: walletAddress,
          username: username,
          points: 500,
          reputation: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint PXB Points');
        return;
      }
      
      // Record the points transaction
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          action: 'mint',
          amount: 500,
          reference_id: crypto.randomUUID()
        });
      
      // Update the user profile in state
      const newProfile: UserProfile = {
        id: updatedUser.id,
        username: updatedUser.username || username,
        pxbPoints: updatedUser.points,
        reputation: updatedUser.reputation || 0,
        createdAt: updatedUser.created_at
      };
      
      setUserProfile(newProfile);
      toast.success(`Successfully minted 500 PXB Points!`);
    } catch (error) {
      console.error('Error minting points:', error);
      toast.error('Failed to mint PXB Points');
    } finally {
      setIsLoading(false);
    }
  };

  const placeBet = async (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: 'up' | 'down',
    duration: number = 60
  ) => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey || !userProfile) {
        toast.error('You must be logged in to place a bet');
        return;
      }
      
      if (betAmount > userProfile.pxbPoints) {
        toast.error('Insufficient PXB Points balance');
        return;
      }
      
      const walletAddress = publicKey.toString();
      
      // Create the bet in database
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      const betId = crypto.randomUUID();
      
      // Insert bet record
      const { error: betError } = await supabase
        .from('pxb_bets')
        .insert({
          id: betId,
          user_id: userProfile.id,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          bet_amount: betAmount,
          bet_type: betType,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        });
      
      if (betError) {
        console.error('Error creating bet:', betError);
        toast.error('Failed to place bet');
        return;
      }
      
      // Update user's points
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - betAmount })
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('Error updating points:', updateError);
        toast.error('Failed to update points');
        return;
      }
      
      // Update local state
      const updatedProfile = {
        ...userProfile,
        pxbPoints: userProfile.pxbPoints - betAmount
      };
      
      setUserProfile(updatedProfile);
      
      // Create new bet in local state
      const newBet: PXBBet = {
        id: betId,
        userId: userProfile.id,
        tokenMint,
        tokenName,
        tokenSymbol,
        betAmount,
        betType,
        status: 'pending',
        pointsWon: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      
      setBets(prevBets => [...prevBets, newBet]);
      
      toast.success(`Bet placed successfully! ${betAmount} PXB Points on ${tokenSymbol} to ${betType === 'up' ? 'MOON' : 'DIE'}`);
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBets = async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey) {
        setBets([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('pxb_bets')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        return;
      }
      
      // Convert to PXBBet format
      const formattedBets: PXBBet[] = data.map(bet => ({
        id: bet.id,
        userId: bet.user_id,
        tokenMint: bet.token_mint,
        tokenName: bet.token_name,
        tokenSymbol: bet.token_symbol,
        betAmount: bet.bet_amount,
        betType: bet.bet_type as 'up' | 'down',
        status: bet.status as 'pending' | 'won' | 'lost',
        pointsWon: bet.points_won || 0,
        createdAt: bet.created_at,
        expiresAt: bet.expires_at
      }));
      
      setBets(formattedBets);
    } catch (error) {
      console.error('Error in fetchUserBets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('reputation', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      // Convert to UserProfile format
      const formattedLeaderboard: UserProfile[] = data.map(user => ({
        id: user.id,
        username: user.username || user.wallet_address.substring(0, 8),
        pxbPoints: user.points,
        reputation: user.reputation || 0,
        createdAt: user.created_at
      }));
      
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process bets at regular intervals
  useEffect(() => {
    if (!bets.length) return;
    
    const interval = setInterval(async () => {
      const now = new Date();
      const pendingBets = bets.filter(bet => 
        bet.status === 'pending' && new Date(bet.expiresAt) < now
      );
      
      if (!pendingBets.length) return;
      
      for (const bet of pendingBets) {
        try {
          // Simple 50/50 chance of winning for now
          const won = Math.random() > 0.5;
          const pointsWon = won ? bet.betAmount * 2 : 0;
          const newStatus = won ? 'won' as const : 'lost' as const;
          const reputationChange = won ? 10 : 0;
          
          // Update bet in database
          await supabase
            .from('pxb_bets')
            .update({ 
              status: newStatus,
              points_won: pointsWon 
            })
            .eq('id', bet.id);
          
          if (won && userProfile) {
            // Update user's points and reputation
            await supabase
              .from('users')
              .update({ 
                points: userProfile.pxbPoints + pointsWon,
                reputation: userProfile.reputation + reputationChange
              })
              .eq('id', userProfile.id);
            
            // Update local state
            setUserProfile({
              ...userProfile,
              pxbPoints: userProfile.pxbPoints + pointsWon,
              reputation: userProfile.reputation + reputationChange
            });
            
            toast.success(`Your bet on ${bet.tokenSymbol} won! +${pointsWon} PXB Points`);
          } else {
            toast.error(`Your bet on ${bet.tokenSymbol} lost!`);
          }
          
          // Update bets in local state
          setBets(prevBets => prevBets.map(b => 
            b.id === bet.id 
              ? { ...b, status: newStatus, pointsWon } 
              : b
          ));
        } catch (error) {
          console.error(`Error processing bet ${bet.id}:`, error);
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [bets, userProfile]);

  return (
    <PXBPointsContext.Provider
      value={{
        userProfile,
        isLoading,
        bets,
        leaderboard,
        mintPoints,
        placeBet,
        fetchUserProfile,
        fetchUserBets,
        fetchLeaderboard
      }}
    >
      {children}
    </PXBPointsContext.Provider>
  );
};
