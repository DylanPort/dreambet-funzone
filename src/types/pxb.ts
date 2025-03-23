
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt: string;
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
  timeframe?: number; // Added timeframe in minutes
  resolvedAt?: string; // Added resolvedAt timestamp
}

// Add LeaderboardEntry interface
export interface LeaderboardEntry {
  wallet: string;
  points: number;
  betsWon: number;
  betsLost: number;
  rank: number;
}

// Add WinRateLeaderboardEntry interface
export interface WinRateLeaderboardEntry {
  wallet: string;
  winRate: number;
  betsWon: number;
  betsLost: number;
  rank: number;
}

// Add ReferralStats interface
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
  referral_code?: string | null;
  referrals_count?: number;
  points_earned?: number;
}

// Add Referral interface
export interface Referral {
  referrer: string;
  referee: string;
  date: string;
  status: 'active' | 'inactive';
  pointsEarned: number;
}

// Database schema interfaces for type safety with Supabase
export interface SupabaseUserProfile {
  id: string;
  username: string | null; 
  wallet_address: string;
  points: number;
  created_at: string;
}

// Updated to include current_market_cap in the database schema
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
