
// Define the PXB types
export interface PXBBet {
  id: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betType: 'up' | 'down'; // Direction of the bet
  creator?: string;
  status: 'open' | 'pending' | 'won' | 'lost' | 'expired'; // Status of the bet
  createdAt: string; // ISO date string
  resolvedAt?: string; // ISO date string, when the bet was resolved
  betAmount: number; // Amount of PXB tokens
  initialMarketCap: number | null;
  percentageChange: number;
  timeframe?: number; // Timeframe in minutes
  currentMarketCap?: number | null;
  pointsWon?: number; // Points won from the bet
  expiresAt: string; // ISO date string, when the bet expires
  timestamp?: number; // Timestamp in milliseconds
  userId?: string; // The user who made the bet
  userRole?: 'creator' | 'participant'; // The role of the user in this bet
}

export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt?: string;
  walletAddress?: string;
  referrals?: number;
  pointsEarned?: number;
  isTemporary?: boolean; // Flag to identify temporary profiles
  referralCode?: string; // Added to store user's referral code
}

export interface LeaderboardEntry {
  id?: string;
  user_id?: string;
  wallet: string;
  username?: string;
  points: number;
  pxbPoints?: number;
  betsWon: number;
  betsLost: number;
  rank: number;
  isSpecial?: boolean;
}

export interface WinRateLeaderboardEntry {
  id?: string;
  user_id?: string;
  wallet: string;
  username?: string;
  winRate: number;
  pxbPoints?: number;
  betsWon: number;
  betsLost: number;
  rank: number;
  isSpecial?: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
  totalPointsEarned?: number;
  referrals_count?: number;
  points_earned?: number;
  referral_code?: string | null;
  referrals?: Referral[];
}

export interface Referral {
  id?: string;
  referrer: string;
  referee: string;
  referred_id?: string;
  date: string;
  createdAt?: string;
  status: 'active' | 'inactive';
  pointsEarned: number;
  pointsAwarded?: number;
  referredUsername?: string;
}

// Database schema interfaces for type safety with Supabase
export interface SupabaseUserProfile {
  id: string;
  username: string | null; 
  wallet_address: string;
  points: number;
  created_at: string;
  referral_code?: string | null;
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
  on_chain_id?: string;
  transaction_signature?: string;
  end_time?: string;
  start_time?: string;
}
