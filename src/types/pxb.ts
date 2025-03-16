
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  createdAt: string;
}

// Updated to match Supabase schema names and include percentage prediction
export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: 'up' | 'down';
  percentageChange: number;
  status: 'pending' | 'won' | 'lost';
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
  initialMarketCap?: number;
  currentMarketCap?: number;
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
