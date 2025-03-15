import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PXBBet } from '@/types/pxb';
import { toast } from 'sonner';

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

  const mockUserId = 'user-123';

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const storedProfile = localStorage.getItem('pxb_user_profile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const mintPoints = async (username: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newProfile: UserProfile = {
        id: mockUserId,
        username,
        pxbPoints: 500,
        reputation: 0,
        createdAt: new Date().toISOString()
      };
      
      setUserProfile(newProfile);
      localStorage.setItem('pxb_user_profile', JSON.stringify(newProfile));
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
      if (!userProfile) {
        toast.error('You must be logged in to place a bet');
        return;
      }
      
      if (betAmount > userProfile.pxbPoints) {
        toast.error('Insufficient PXB Points balance');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);
      
      const newBet: PXBBet = {
        id: `bet-${Date.now()}`,
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
      
      const updatedProfile = {
        ...userProfile,
        pxbPoints: userProfile.pxbPoints - betAmount
      };
      
      setUserProfile(updatedProfile);
      localStorage.setItem('pxb_user_profile', JSON.stringify(updatedProfile));
      
      const storedBets = localStorage.getItem('pxb_user_bets');
      const currentBets = storedBets ? JSON.parse(storedBets) : [];
      const updatedBets = [...currentBets, newBet];
      localStorage.setItem('pxb_user_bets', JSON.stringify(updatedBets));
      
      setBets(updatedBets);
      
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const storedBets = localStorage.getItem('pxb_user_bets');
      if (storedBets) {
        setBets(JSON.parse(storedBets));
      } else {
        setBets([]);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockLeaderboard: UserProfile[] = [
        { id: 'user-1', username: 'crypto_king', pxbPoints: 1250, reputation: 95, createdAt: new Date().toISOString() },
        { id: 'user-2', username: 'moon_chaser', pxbPoints: 980, reputation: 82, createdAt: new Date().toISOString() },
        { id: 'user-3', username: 'degen_trader', pxbPoints: 520, reputation: 65, createdAt: new Date().toISOString() },
        { id: 'user-4', username: 'diamond_hands', pxbPoints: 475, reputation: 58, createdAt: new Date().toISOString() },
        { id: 'user-5', username: 'pump_detector', pxbPoints: 390, reputation: 47, createdAt: new Date().toISOString() },
      ];
      
      if (userProfile) {
        mockLeaderboard.push(userProfile);
      }
      
      mockLeaderboard.sort((a, b) => b.reputation - a.reputation);
      
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserBets();
    fetchLeaderboard();
    
    const interval = setInterval(() => {
      if (bets.length > 0) {
        const updatedBets = bets.map(bet => {
          if (bet.status === 'pending' && new Date(bet.expiresAt) < new Date()) {
            const won = Math.random() > 0.5;
            
            if (won && userProfile) {
              const pointsWon = bet.betAmount * 2;
              const updatedProfile = {
                ...userProfile,
                pxbPoints: userProfile.pxbPoints + pointsWon,
                reputation: userProfile.reputation + 10
              };
              
              setUserProfile(updatedProfile);
              localStorage.setItem('pxb_user_profile', JSON.stringify(updatedProfile));
              
              toast.success(`Your bet on ${bet.tokenSymbol} won! +${pointsWon} PXB Points`);
              
              return {
                ...bet,
                status: 'won' as const,
                pointsWon
              };
            } else {
              toast.error(`Your bet on ${bet.tokenSymbol} lost!`);
              
              return {
                ...bet,
                status: 'lost' as const,
                pointsWon: 0
              };
            }
          }
          return bet;
        });
        
        setBets(updatedBets);
        localStorage.setItem('pxb_user_bets', JSON.stringify(updatedBets));
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
