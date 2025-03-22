
export interface UserProfile {
  id: string;
  pxbId?: string;
  walletAddress?: string;
  pxbPoints: number;
  winCount: number;
  lossCount: number;
  totalBets: number;
  username?: string;
  avatar?: string;
  created_at?: string;
  bets?: PXBBet[];
}

export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  betType: "up" | "down";
  amount: number;
  status: "pending" | "won" | "lost" | "refunded";
  percentageChange: number;
  duration: number;
  createdAt: string;
  endTime: string;
  initialMarketCap?: number;
  currentMarketCap?: number;
  pnl?: number;
}

export interface LeaderboardEntry {
  id?: string;
  user_id?: string;
  rank: number;
  username?: string;
  pxbPoints?: number;
  points?: number;
  winCount?: number;
  lossCount?: number;
  totalBets?: number;
  avatar?: string;
}

export interface WinRateLeaderboardEntry {
  id: string;
  rank: number;
  username?: string;
  winRate: number;
  winCount: number;
  lossCount: number;
  totalBets: number;
  avatar?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned: number;
  referralCode?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  pointsEarned: number;
  created_at: string;
  referredUsername?: string;
}
