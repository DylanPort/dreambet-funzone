
import { UserProfile } from '@/services/userService';

export interface PXBBet {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMint: string;
  amount: number;
  prediction: 'moon' | 'die';
  createdAt: string;
  expiresAt: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  creator: string;
  bettor?: string;
  outcome?: 'won' | 'lost' | 'tie';
  marketCap?: number;
  initialMarketCap?: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string | null;
  points: number;
  rank: number;
  walletAddress?: string;
}

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  walletAddress?: string;
  pxbPoints: number;
  isLoading: boolean;
  
  // Betting functions
  createBet: (tokenMint: string, tokenName: string, tokenSymbol: string, amount: number, prediction: 'moon' | 'die') => Promise<boolean>;
  placeBet: (betId: string, prediction: 'moon' | 'die') => Promise<boolean>;
  bets: PXBBet[];
  activeBets: PXBBet[];
  recentBets: PXBBet[];
  fetchBets: () => Promise<void>;
  fetchBet: (betId: string) => Promise<PXBBet | null>;
  currentBet: PXBBet | null;
  
  // Points operations
  awardPoints: (amount: number, reason: string) => Promise<boolean>;
  deductPoints: (amount: number, reason: string) => Promise<boolean>;
  transferPoints: (recipientWalletAddress: string, amount: number) => Promise<boolean>;
  
  // Profile operations
  updateUsername: (username: string) => Promise<boolean>;
  claimDailyBonus: () => Promise<boolean>;
  hasClaimedDailyBonus: boolean;
  earnedPXB: number;
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  fetchLeaderboard: () => Promise<void>;
  
  // Utilities
  refreshUserProfile: () => Promise<void>;
}
