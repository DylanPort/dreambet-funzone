
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  walletAddress: string;
  pxbPoints: number;
  createdAt: string;
  avatar?: string;
  bio?: string;
  referralCode?: string;
}

export interface PXBTrade {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  quantity: number;
  type: 'buy' | 'sell';
  timestamp: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  displayName?: string;
  points: number;
  avatar?: string;
  rank: number;
}

export interface WinRateLeaderboardEntry {
  id: string;
  username: string;
  displayName?: string;
  trades: number;
  winRate: number;
  avatar?: string;
  rank: number;
}

export interface ReferralStats {
  totalReferrals: number;
  pointsEarned: number;
  referrals_count?: number;
  points_earned?: number;
}

export interface SupabaseTradeRow {
  id: string;
  userid: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  pxbamount: number;
  price: number;
  quantity: number;
  type: 'buy' | 'sell';
  timestamp: string;
}
