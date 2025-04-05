
import { PXBBet, UserProfile, LeaderboardEntry, WinRateLeaderboardEntry, ReferralStats } from '@/types/pxb';

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
  userBets: PXBBet[];
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
  ) => Promise<PXBBet | void>;
  sendPoints: (recipientId: string, amount: number) => Promise<boolean>;
  generatePxbId: () => string;
  fetchUserProfile: () => Promise<void>;
  fetchUserBets: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  addPointsToUser: (amount: number, reason: string) => Promise<boolean>;
  mintingPoints: boolean;
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  isLoadingBets: boolean;
  // Referral system
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (code: string) => Promise<boolean>;
  referralStats: { referralsCount: number; pointsEarned: number; };
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  transferFeature: { enabled: boolean; message?: string; };
  // Add the function to fetch token transactions
  fetchTokenTransactions: (tokenId: string) => Promise<any[]>;
}
