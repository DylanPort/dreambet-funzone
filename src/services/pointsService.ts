
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserPoints {
  total: number;
  available: number;
}

export interface PointsTransaction {
  id: string;
  amount: number;
  action: string;
  created_at: string;
  reference_id?: string | null;
}

// Get current user's points
export const getUserPoints = async (): Promise<UserPoints | null> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    // Fetch user points from users table
    const { data, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user points:", error);
      return null;
    }
    
    // Also fetch points that are currently in active bets (locked)
    const { data: activeBets, error: betsError } = await supabase
      .from('bets')
      .select('points_amount')
      .eq('creator', user.id)
      .or('status.eq.open,status.eq.matched');
    
    if (betsError) {
      console.error("Error fetching active bets:", betsError);
      return null;
    }
    
    // Calculate points in active bets
    const lockedPoints = activeBets?.reduce((sum, bet) => sum + (bet.points_amount || 0), 0) || 0;
    
    return {
      total: data.points || 0,
      available: Math.max(0, (data.points || 0) - lockedPoints)
    };
  } catch (error) {
    console.error("Unexpected error in getUserPoints:", error);
    return null;
  }
};

// Get points transaction history
export const getPointsHistory = async (): Promise<PointsTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching points history:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error in getPointsHistory:", error);
    return [];
  }
};

// Process a points transaction through the edge function
export const processPointsTransaction = async (
  action: 'bet' | 'win' | 'init',
  amount: number,
  betId?: string
): Promise<{ success: boolean; currentPoints?: number; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-points', {
      method: 'POST',
      body: { action, amount, betId }
    });
    
    if (error) {
      console.error("Error processing points transaction:", error);
      toast.error(`Failed to process points: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
    
    if (!data.success) {
      console.error("Points transaction failed:", data.error);
      toast.error(`Points transaction failed: ${data.error || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
    
    if (action === 'bet') {
      toast.success(`Placed bet with ${amount} PXB Points`);
    } else if (action === 'win') {
      toast.success(`Won ${amount} PXB Points!`);
    } else if (action === 'init') {
      toast.success(`Received 50 starting PXB Points!`);
    }
    
    return { 
      success: true, 
      currentPoints: data.currentPoints 
    };
  } catch (error) {
    console.error("Unexpected error in processPointsTransaction:", error);
    toast.error("Failed to process points transaction");
    return { success: false, error: error.message };
  }
};

// Initialize user with starting points if they don't have any
export const initializeUserPoints = async (): Promise<boolean> => {
  try {
    const userPoints = await getUserPoints();
    
    // If user already has points, no need to initialize
    if (userPoints && userPoints.total > 0) {
      return true;
    }
    
    // Initialize user with starting points
    const result = await processPointsTransaction('init', 50);
    return result.success;
  } catch (error) {
    console.error("Error initializing user points:", error);
    return false;
  }
};

// Get top users by points (leaderboard)
export const getPointsLeaderboard = async (limit: number = 10): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, points')
      .order('points', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching points leaderboard:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error in getPointsLeaderboard:", error);
    return [];
  }
};
