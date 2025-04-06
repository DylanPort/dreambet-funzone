
import { UserProfile, PXBTrade, LeaderboardEntry, WinRateLeaderboardEntry } from '@/types/pxb';

export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  trades: PXBTrade[];
  userTrades: PXBTrade[];
  leaderboard: LeaderboardEntry[];
  winRateLeaderboard: WinRateLeaderboardEntry[];
  mintPoints: (amount?: number) => Promise<void>;
  sendPoints: (recipientId: string, amount: number) => Promise<boolean>;
  purchaseToken: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number,
    tokenQuantity: number,
    price: number
  ) => Promise<boolean>;
  sellToken: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    tokenQuantity: number,
    price: number
  ) => Promise<boolean>;
  generatePxbId: () => string;
  fetchUserProfile: () => Promise<void>;
  fetchUserTrades: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchWinRateLeaderboard: () => Promise<void>;
  addPointsToUser: (amount: number) => Promise<void>;
  mintingPoints: boolean;
  transferFeature: 'enabled' | 'coming-soon';
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  isLoadingTrades: boolean;
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<boolean>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  fetchTokenTransactions: (tokenId: string) => Promise<any[]>;
}

export interface ReferralStats {
  totalReferrals: number;
  pointsEarned: number;
  referrals_count?: number; // Added for backward compatibility
  points_earned?: number; // Added for backward compatibility
  referrals?: number; // Added to fix errors in PXBWallet
}
