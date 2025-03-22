
import { UserProfile, PXBBet, LeaderboardEntry, WinRateLeaderboardEntry, ReferralStats } from "@/types/pxb";

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: WinRateLeaderboardEntry[];
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  mintPoints: (amount?: number) => Promise<void>;
  placeBet: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    betAmount: number,
    betType: "up" | "down",
    percentageChange: number,
    duration: number
  ) => Promise<PXBBet | void>;
  sendPoints: (recipientId: string, amount: number) => Promise<boolean>;
  generatePxbId: () => string;
  fetchUserProfile: () => Promise<void>;
  fetchUserBets: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  addPointsToUser: (amount: number, reason: string) => Promise<boolean | undefined>;
  mintingPoints: boolean;
  // Referral system
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<void>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
}
