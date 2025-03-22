
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

// Database schema interfaces for type safety with Supabase
export interface SupabaseBetsRow {
  bet_id: string;
  bettor1_id: string;
  bettor2_id?: string;
  creator: string;
  token_mint: string;
  token_name?: string; 
  token_symbol?: string;
  sol_amount: number;
  prediction_bettor1: 'up' | 'down';
  percentage_change: number;
  status: string;
  points_won?: number;
  created_at: string;
  duration: number;
  initial_market_cap?: number;
  current_market_cap?: number;
  tokens?: {
    token_name: string;
    token_symbol: string;
  };
  // Include all other columns from the bets table
  on_chain_id?: string;
  transaction_signature?: string;
  end_time?: string;
  start_time?: string;
}
