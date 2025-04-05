import { UserProfile, LeaderboardEntry, WinRateLeaderboardEntry, UserBet } from './types';

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: UserBet[];
  userBets: UserBet[];
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: WinRateLeaderboardEntry[];
  mintPoints: (amount?: number) => Promise<void>;
  placeBet: (
    tokenMint: string, 
    tokenName: string, 
    tokenSymbol: string, 
    betAmount: number, 
    betType: 'up' | 'down', 
    percentageChange: number,
    duration: number
  ) => Promise<boolean>;
  sendPoints: (recipientPxbId: string, amount: number) => Promise<boolean>;
  generatePxbId: () => string;
  fetchUserProfile: () => Promise<void>;
  fetchUserBets: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  addPointsToUser: (userId: string, amount: number, action: string, referenceId?: string) => Promise<void>;
  mintingPoints: boolean;
  transferFeature: {
    enabled: boolean;
    message?: string;
  };
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  isLoadingBets: boolean;
  generateReferralLink: () => string;
  checkAndProcessReferral: (code: string) => Promise<boolean>;
  referralStats: {
    referralsCount: number;
    pointsEarned: number;
  } | null;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  fetchTokenTransactions: (tokenId: string) => Promise<any[]>;
  fetchAllTokenTransactions: (tokenId: string) => Promise<any[]>;
}
