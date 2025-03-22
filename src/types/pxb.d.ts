
// User profile types
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt: string;
  referralCode?: string;
}

export interface SupabaseUserProfile {
  id: string;
  wallet_address: string;
  username: string | null;
  points: number;
  created_at: string;
  referral_code?: string;
  referred_by?: string | null;
}

// PXB Bet types
export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: 'up' | 'down';
  percentageChange: number;
  status: 'pending' | 'active' | 'won' | 'lost';
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
  initialMarketCap?: number;
  currentMarketCap?: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  walletAddress?: string;
  points: number;
  rank: number;
}

export interface WinRateLeaderboardEntry {
  userId: string;
  username: string;
  walletAddress?: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  rank: number;
}

// Referral types
export interface Referral {
  id: string;
  referredUsername: string;
  pointsAwarded: number;
  createdAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referrals: Referral[];
  referralCode: string | null;
}

// Context types
export interface PXBPointsContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  bets: PXBBet[];
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
  addPointsToUser: (amount: number, reason: string) => Promise<void>;
  mintingPoints: boolean;
  isLeaderboardLoading: boolean;
  isLoadingWinRate: boolean;
  // Referral system
  generateReferralLink: () => Promise<string>;
  checkAndProcessReferral: (referralCode: string) => Promise<void>;
  referralStats: ReferralStats;
  fetchReferralStats: () => Promise<void>;
  isLoadingReferrals: boolean;
}
