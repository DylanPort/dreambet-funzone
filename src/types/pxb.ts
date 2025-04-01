
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
  user_id?: string;
  rank: number;
  username: string;
  points: number;
  pxbPoints?: number;
  winRate: number;
  walletAddress?: string;
  wallet?: string;
  betsWon?: number;
  betsLost?: number;
}

// Add SupabaseBetsRow for database operation
export interface SupabaseBetsRow {
  bet_id: string;
  creator: string;
  token_mint: string;
  token_name?: string;
  token_symbol?: string;
  prediction_bettor1: 'up' | 'down';
  sol_amount: number;
  duration: number;
  status: 'pending' | 'won' | 'lost' | 'open' | 'expired';
  points_won?: number;
  created_at: string;
  end_time?: string;
  start_time?: string;
  outcome?: string;
  initial_market_cap?: number;
  current_market_cap?: number;
  percentage_change?: number;
}
