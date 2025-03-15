
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  reputation?: number; // Make reputation optional
  createdAt: string;
}

// Updated to match Supabase schema names
export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: 'up' | 'down';
  status: 'pending' | 'won' | 'lost';
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
}

// Database schema interfaces for type safety with Supabase
export interface SupabaseUserProfile {
  id: string;
  username: string; 
  wallet_address: string;
  points: number;
  reputation?: number; // Make reputation optional since it might not exist in current schema
  created_at: string;
}

export interface SupabasePXBBet {
  id: string;
  user_id: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  bet_amount: number;
  bet_type: 'up' | 'down';
  status: 'pending' | 'won' | 'lost';
  points_won: number;
  created_at: string;
  expires_at: string;
}

// Add a type definition for the tokens relation in the bets table
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
  status: string;
  points_won?: number;
  created_at: string;
  duration: number;
  tokens?: {
    token_name: string;
    token_symbol: string;
  };
}
