
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
  isTemporary?: boolean;
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

export interface SupabaseUserProfile {
  id: string;
  username?: string;
  display_name?: string;
  wallet_address: string;
  points: number;
  created_at: string;
  avatar_url?: string;
  bio?: string;
  referral_code?: string;
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

export interface TradeHistory {
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
}
