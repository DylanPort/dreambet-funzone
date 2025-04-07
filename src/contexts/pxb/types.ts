import { PXBBet, UserProfile, LeaderboardEntry, WinRateLeaderboardEntry, ReferralStats } from '@/types/pxb';

// Define types for token portfolio and transactions
export interface TokenPortfolio {
  id: string;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentValue: number;
  lastUpdated: string;
  created_at?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pxbAmount: number;
  timestamp: string;
  created_at?: string;
}

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
  checkAndProcessReferral: (referralCode: string) => Promise<void>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
  transferFeature?: 'enabled' | 'coming-soon';
  
  // Token trading functionality
  purchaseToken: (tokenId: string, tokenName: string, tokenSymbol: string, pxbAmount: number) => Promise<boolean>;
  sellToken: (portfolioId: string, quantity: number) => Promise<boolean>;
  tokenPortfolios: TokenPortfolio[];
  tokenTransactions: TokenTransaction[];
  fetchTokenPortfolios: () => Promise<void>;
  fetchTokenTransactions: () => Promise<void>;
  isLoadingPortfolios: boolean;
  isLoadingTransactions: boolean;
}
