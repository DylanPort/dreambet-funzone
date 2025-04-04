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
  isActive?: boolean;
  expiresAt?: number;
}

export interface UserStats {
  totalBets: number;
  winRate: number;
  totalProfit: number;
  balance: number;
}

// Fetch the user's profile data by wallet address
export const fetchUserProfile = async (walletAddress?: string): Promise<UserProfile | null> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to fetch profile");
      return null;
    }
    
    // Fetch the user's profile data from the users table using wallet address
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      
      // If user doesn't exist, create a new profile
      if (error.code === 'PGRST116') {
        const newProfile = await createUserProfile(walletAddress);
        return newProfile;
      }
      
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in fetchUserProfile:", error);
    return null;
  }
};

// Create a new user profile if it doesn't exist
const createUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  try {
    // Generate a unique ID for the user
    const id = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: id,
        wallet_address: walletAddress,
        username: `User_${walletAddress.substring(0, 8)}`
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Unexpected error in createUserProfile:", error);
    return null;
  }
};

// Fetch the user's betting history by wallet address
export const fetchUserBettingHistory = async (walletAddress?: string): Promise<UserBet[]> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to fetch betting history");
      return [];
    }
    
    // Fetch bets created by this wallet address
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
      .eq('creator', walletAddress)
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
export const updateUsername = async (walletAddress: string, username: string): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error("Wallet address is required to update username");
      toast.error("You need to connect your wallet to update your profile");
      return false;
    }
    
    // First check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (fetchError) {
      console.error("Error fetching user profile:", fetchError);
      if (fetchError.code === 'PGRST116') {
        // User doesn't exist, create a new profile with this username
        toast.error("No profile found for this wallet address");
        return false;
      }
      toast.error("Error fetching user profile");
      return false;
    }
    
    // Update the username in the users table
    const { error } = await supabase
      .from('users')
      .update({ username })
      .eq('wallet_address', walletAddress);
    
    if (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
      return false;
    }
    
    console.log("Username updated successfully for wallet:", walletAddress);
    return true;
  } catch (error) {
    console.error("Unexpected error in updateUsername:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Fetch all users from the database
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    
    return data as unknown as UserProfile[];
  } catch (error) {
    console.error("Unexpected error in fetchAllUsers:", error);
    return [];
  }
};

// Calculate total users count
export const getTotalUsersCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("Error getting users count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Unexpected error in getTotalUsersCount:", error);
    return 0;
  }
};
