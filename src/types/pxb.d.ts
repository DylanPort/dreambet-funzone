

export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;  // Changed from 'amount' to 'betAmount' to match usage in context
  betType: 'up' | 'down';
  percentageChange: number;
  timeframe: number;  // Added this field which was missing
  status: 'pending' | 'won' | 'lost' | 'expired' | 'open';  // Added 'open' and 'expired' to match all usages
  pointsWon: number;  // Added this field from the PXB.ts version
  createdAt: string;
  expiresAt: string;  // Added this from PXB.ts version
  resolvedAt?: string;  // Added this field which was missing
  initialMarketCap?: number;
  currentMarketCap?: number;
  userRole?: 'creator' | 'participant';  // Added from PXB.ts version
}

export interface LeaderboardEntry {
  id: string;
  userId?: string;
  username: string;
  pxbPoints: number;
  walletAddress: string;
  profileImage?: string;
  rank?: number;
}

export interface WinRateLeaderboardEntry {
  id: string;
  userId?: string;
  username: string;
  totalBets: number;
  wonBets: number;
  winRate: number;
  walletAddress: string;
  profileImage?: string;
  rank?: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  createdAt: string;
  pointsAwarded: number;
  status: 'pending' | 'completed';
}

export interface ReferralStats {
  referrals_count: number;
  points_earned: number;
  referral_code: string | null;
  referrals?: Referral[];
  totalReferrals?: number;
  totalPointsEarned?: number;
}

export interface UserPXBProfile {
  id: string;
  username: string;
  walletAddress: string;
  pxbPoints: number;
  profileImage?: string;
  createdAt: string;
  lastSignIn: string;
  totalBets?: number;
  wonBets?: number;
  lostBets?: number;
  referralCode?: string;
  referrerId?: string;
}

