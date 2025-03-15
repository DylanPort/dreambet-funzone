import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PXBBet, SupabaseUserProfile, SupabaseBetsRow } from '@/types/pxb';
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
      
      console.log("Fetching user profile for wallet:", walletAddress);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('User not found in database yet');
          setUserProfile(null);
        } else {
          console.error('Error fetching user profile:', error);
          toast.error('Failed to load user profile');
        }
      } else if (userData) {
        const supabaseUser = userData as SupabaseUserProfile;
        console.log("User profile data from Supabase:", supabaseUser);
        
        setUserProfile({
          id: supabaseUser.id,
          username: supabaseUser.username || walletAddress.substring(0, 8),
          pxbPoints: supabaseUser.points || 0,
          reputation: supabaseUser.reputation || 0, // Provide default of 0
          createdAt: supabaseUser.created_at
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
      console.log("Minting points for wallet:", walletAddress);
      
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
          reputation: existingUser.reputation || 0, // Provide default of 0
          createdAt: existingUser.created_at
        });
        return;
      }
      
      let userId = existingUser?.id || crypto.randomUUID();
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          wallet_address: walletAddress,
          username: username,
          points: 500,
          reputation: 0 // Explicitly set default reputation
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error minting points:', error);
        toast.error('Failed to mint PXB Points');
        return;
      }
      
      console.log("User after minting points:", updatedUser);
      
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          action: 'mint',
          amount: 500,
          reference_id: crypto.randomUUID()
        });
      
      const newProfile: UserProfile = {
        id: updatedUser.id,
        username: updatedUser.username || username,
        pxbPoints: updatedUser.points,
        reputation: updatedUser.reputation || 0, // Provide default of 0
        createdAt: updatedUser.created_at
      };
      
      setUserProfile(newProfile);
      toast.success(`Successfully minted 500 PXB Points!`);
      
      // Force refresh the profile
      await fetchUserProfile();
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
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      const betId = crypto.randomUUID();
      
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          bet_id: betId,
          creator: walletAddress,
          bettor1_id: userProfile.id,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          sol_amount: betAmount,
          prediction_bettor1: betType,
          status: 'pending',
          duration: duration * 60
        });
      
      if (betError) {
        console.error('Error creating bet:', betError);
        toast.error('Failed to place bet');
        return;
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: userProfile.pxbPoints - betAmount })
        .eq('id', userProfile.id);
      
      if (updateError) {
        console.error('Error updating points:', updateError);
        toast.error('Failed to update points');
        return;
      }
      
      const updatedProfile = {
        ...userProfile,
        pxbPoints: userProfile.pxbPoints - betAmount
      };
      
      setUserProfile(updatedProfile);
      
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
      if (!connected || !publicKey || !userProfile) {
        setBets([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('bets')
        .select('*, tokens:token_mint(token_name, token_symbol)')
        .eq('bettor1_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user bets:', error);
        return;
      }
      
      const formattedBets: PXBBet[] = (data as any[]).map((bet: any) => {
        const tokenName = bet.token_name || bet.tokens?.token_name || 'Unknown Token';
        const tokenSymbol = bet.token_symbol || bet.tokens?.token_symbol || 'UNKNOWN';
        
        return {
          id: bet.bet_id,
          userId: bet.bettor1_id,
          tokenMint: bet.token_mint,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          betAmount: bet.sol_amount,
          betType: bet.prediction_bettor1 as 'up' | 'down',
          status: bet.status === 'pending' ? 'pending' : (bet.status === 'won' ? 'won' : 'lost'),
          pointsWon: bet.points_won || 0,
          createdAt: bet.created_at,
          expiresAt: new Date(new Date(bet.created_at).getTime() + (bet.duration * 1000)).toISOString()
        };
      });
      
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
        .order('points', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }
      
      const formattedLeaderboard: UserProfile[] = data.map(user => ({
        id: user.id,
        username: user.username || user.wallet_address.substring(0, 8),
        pxbPoints: user.points,
        reputation: user.reputation || 0, // Always provide a default value of 0
        createdAt: user.created_at
      }));
      
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          const won = Math.random() > 0.5;
          const pointsWon = won ? bet.betAmount * 2 : 0;
          const newStatus = won ? 'won' as const : 'lost' as const;
          const reputationChange = won ? 10 : 0;
          
          await supabase
            .from('bets')
            .update({ 
              status: newStatus,
              points_won: pointsWon 
            })
            .eq('bet_id', bet.id);
          
          if (won && userProfile) {
            await supabase
              .from('users')
              .update({ 
                points: userProfile.pxbPoints + pointsWon,
                reputation: (userProfile.reputation || 0) + reputationChange // Handle potentially undefined reputation
              })
              .eq('id', userProfile.id);
            
            setUserProfile({
              ...userProfile,
              pxbPoints: userProfile.pxbPoints + pointsWon,
              reputation: (userProfile.reputation || 0) + reputationChange // Handle potentially undefined reputation
            });
            
            toast.success(`Your bet on ${bet.tokenSymbol} won! +${pointsWon} PXB Points`);
          } else {
            toast.error(`Your bet on ${bet.tokenSymbol} lost!`);
          }
          
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
