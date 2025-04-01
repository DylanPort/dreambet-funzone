
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt: string;
  isTemporary?: boolean; // Add this flag to identify temporary profiles
  referralCode?: string; // Add referral code field
  referredBy?: string; // Add referred by field
}

// Updated PXBBet interface with all required fields
export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: 'up' | 'down';
  percentageChange: number;
  status: 'pending' | 'won' | 'lost' | 'open' | 'expired';
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
  initialMarketCap?: number;
  currentMarketCap?: number;
  userRole?: 'creator' | 'participant';
  timeframe?: number;
  resolvedAt?: string;
}

// Referral statistics interface
export interface ReferralStats {
  referrals_count: number;
  pointsEarned: number;
  pendingReferrals: number;
}

// Updated SupabaseUserProfile interface to include referral fields
export interface SupabaseUserProfile {
  id: string;
  username?: string;
  wallet_address: string;
  points: number;
  created_at: string;
  referral_code?: string;
  referred_by?: string;
}

// Add leaderboard entry interface
export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  points: number;
  winRate: number;
  walletAddress?: string;
}
