
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string | null;
  wallet_address: string;
  created_at: string;
}

export interface UserBet {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  amount: number;
  prediction: 'moon' | 'die';
  result: 'win' | 'loss' | 'pending';
  date: string;
  profit: number;
}

export interface UserStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  balance: number;
}

// Fetch the user's profile data
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    // Get the current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Error fetching authenticated user:", authError);
      return null;
    }
    
    // Fetch the user's profile data from the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in fetchUserProfile:", error);
    return null;
  }
};

// Fetch the user's betting history
export const fetchUserBettingHistory = async (): Promise<UserBet[]> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Error fetching authenticated user:", authError);
      return [];
    }
    
    // Fetch bets created by this user
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        tokens (token_name, token_symbol),
        prediction_bettor1,
        sol_amount,
        status,
        created_at
      `)
      .eq('creator', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user bets:", error);
      return [];
    }
    
    // Transform to match our frontend UserBet type
    return data.map(bet => {
      // Determine result based on status
      let result: 'win' | 'loss' | 'pending' = 'pending';
      let profit = 0;
      
      if (bet.status === 'won') {
        result = 'win';
        profit = bet.sol_amount * 0.95; // 95% profit
      } else if (bet.status === 'lost') {
        result = 'loss';
        profit = -bet.sol_amount;
      }
      
      // Map prediction values from database to our frontend format
      let prediction: 'moon' | 'die';
      if (bet.prediction_bettor1 === 'up' || bet.prediction_bettor1 === 'migrate') {
        prediction = 'moon';
      } else {
        prediction = 'die';
      }
      
      return {
        id: bet.bet_id,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        amount: bet.sol_amount,
        prediction: prediction,
        result: result,
        date: bet.created_at,
        profit: profit,
      };
    });
  } catch (error) {
    console.error("Unexpected error in fetchUserBettingHistory:", error);
    return [];
  }
};

// Calculate user stats from betting history
export const calculateUserStats = (bets: UserBet[]): UserStats => {
  const totalBets = bets.length;
  
  const wins = bets.filter(bet => bet.result === 'win').length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;
  
  const totalProfit = bets.reduce((sum, bet) => sum + bet.profit, 0);
  
  // For this implementation, we'll set the balance to be total profit + 2500 (starting balance)
  const balance = totalProfit + 2500;
  
  return {
    totalBets,
    winRate,
    totalProfit,
    balance
  };
};

// Update the user's username
export const updateUsername = async (username: string): Promise<boolean> => {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Error fetching authenticated user:", authError);
      toast.error("You need to be logged in to update your profile");
      return false;
    }
    
    // Update the username in the users table
    const { error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id);
    
    if (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
      return false;
    }
    
    toast.success("Username updated successfully");
    return true;
  } catch (error) {
    console.error("Unexpected error in updateUsername:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
