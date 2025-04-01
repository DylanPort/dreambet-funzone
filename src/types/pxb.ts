
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt: string;
  isTemporary?: boolean; // Add this flag to identify temporary profiles
  referral_code?: string; // Added to match database field name
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
  timeframe?: number; // In minutes
  resolvedAt?: string; // Timestamp when the bet was resolved
}

// Add LeaderboardEntry interface with all required fields
export interface LeaderboardEntry {
  id?: string;          // Added to match usage in PXBProfilePanel
  user_id?: string;     // Added to match usage in PXBProfilePanel
  wallet: string;
  username?: string;    // Added to match component implementation
  points: number;
  pxbPoints?: number;   // For compatibility with both naming conventions
  betsWon: number;
  betsLost: number;
  rank: number;
}

// Add WinRateLeaderboardEntry interface with all required fields
export interface WinRateLeaderboardEntry {
  id?: string;          // Added to match usage in PXBProfilePanel
  user_id?: string;     // Added to match usage in PXBProfilePanel
  wallet: string;
  username?: string;    // Added to match component implementation
  winRate: number;
  pxbPoints?: number;   // For compatibility with both naming conventions
  betsWon: number;
  betsLost: number;
  rank: number;
}

// Update ReferralStats interface with all required fields
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
  totalPointsEarned?: number; // Alias for pointsEarned for compatibility
  referral_code?: string | null;
  referrals_count?: number;
  points_earned?: number;
  referrals?: Referral[]; // Added to match usage in PXBWallet
}

// Update Referral interface with additional fields needed by the component
export interface Referral {
  id?: string; // Added for compatibility with PXBWallet
  referrer: string;
  referee: string; 
  referred_id?: string; // Added for backend compatibility
  date: string;
  createdAt?: string; // Added for compatibility with PXBWallet
  status: 'active' | 'inactive';
  pointsEarned: number;
  pointsAwarded?: number; // Added as an alias for pointsEarned
  referredUsername?: string; // Added for PXBWallet display
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
