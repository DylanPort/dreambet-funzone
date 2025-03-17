
import { UserProfile, PXBBet } from '@/types/pxb';

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
  userBets: PXBBet[]; // Added this missing property
  leaderboard: UserProfile[];
  mintPoints: (amount?: number) => Promise<void>;
  placeBet: (
    tokenMint: string, 
    tokenName: string, 
    tokenSymbol: string, 
    betAmount: number, 
    betType: 'up' | 'down', 
    percentageChange: number,
    duration: number
  ) => Promise<PXBBet | void>;
  fetchUserProfile: () => Promise<void>;
  fetchUserBets: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
}
