
export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  betType: 'up' | 'down';
  percentageChange: number;
  timeframe: number;
  status: 'pending' | 'won' | 'lost' | 'expired';
  createdAt: string;
  resolvedAt?: string;
  initialMarketCap?: number;
  currentMarketCap?: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  pxbPoints: number;
  walletAddress: string;
  profileImage?: string;
  rank?: number;
}

export interface WinRateLeaderboardEntry {
  userId: string;
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
  totalReferrals: number;
  totalPointsEarned: number;
  referrals: Referral[];
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
