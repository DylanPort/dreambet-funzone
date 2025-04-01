
import { UserProfile, PXBBet, LeaderboardEntry, WinRateLeaderboardEntry, ReferralStats } from "@/types/pxb";
import { TokenPortfolio, TokenTransaction } from "@/services/tokenTradingService";

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
  userBets?: PXBBet[]; // Added this property to match the usage in BetDetails.tsx
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: WinRateLeaderboardEntry[];
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  isLoadingBets?: boolean;
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
  // Portfolio data
  portfolio?: TokenPortfolio[];
  transactions?: TokenTransaction[];
  isLoadingPortfolio?: boolean;
  isLoadingTransactions?: boolean;
  fetchUserPortfolio?: () => Promise<void>;
  fetchUserTransactions?: (tokenId?: string) => Promise<void>;
  // Referral system
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<void>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
}
