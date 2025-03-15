
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PointsTransaction {
  success: boolean;
  points?: number;
  previous?: number;
  change?: number;
  error?: string;
}

// Initialize user points to default value if they don't exist
export const initializeUserPoints = async (): Promise<boolean> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }
    
    // Check if user already has points
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();
    
    if (userError) {
      if (userError.code !== "PGRST116") {  // PGRST116 is "no rows returned"
        console.error("Error checking user points:", userError);
        return false;
      }
    }
    
    // If user already has points, no need to initialize
    if (userData && userData.points > 0) {
      return true;
    }
    
    // Call our edge function to initialize points
    const response = await supabase.functions.invoke("update-user-points", {
      method: "POST",
      body: {
        userId: user.id,
        action: "initialize",
        amount: 50
      }
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error("Failed to initialize user points:", result.error);
      return false;
    }
    
    console.log("User points initialized:", result.points);
    return true;
  } catch (error) {
    console.error("Error initializing user points:", error);
    return false;
  }
};

// Get current user points
export const getUserPoints = async (): Promise<{ total: number; available: number } | null> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }
    
    // Get user points from the database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();
    
    if (userError) {
      console.error("Error fetching user points:", userError);
      return null;
    }
    
    // Get points in active bets
    const { data: activeBets, error: betsError } = await supabase
      .from("bets")
      .select("points_amount")
      .or(`creator.eq.${user.id},counterparty.eq.${user.id}`)
      .in("status", ["open", "matched"]);
    
    if (betsError) {
      console.error("Error fetching active bets:", betsError);
      return null;
    }
    
    // Calculate points in active bets
    const pointsInBets = activeBets?.reduce((total, bet) => total + bet.points_amount, 0) || 0;
    
    // Return total and available points
    return { 
      total: userData.points || 0,
      available: Math.max(0, (userData.points || 0) - pointsInBets)
    };
  } catch (error) {
    console.error("Error getting user points:", error);
    return null;
  }
};

// Process a points transaction
export const processPointsTransaction = async (
  action: 'bet' | 'win' | 'refund', 
  amount: number, 
  referenceId?: string
): Promise<PointsTransaction> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        success: false, 
        error: "No authenticated user found" 
      };
    }
    
    // Call our edge function to process the transaction
    const response = await supabase.functions.invoke("update-user-points", {
      method: "POST",
      body: {
        userId: user.id,
        action: action,
        amount: amount,
        referenceId: referenceId
      }
    });
    
    const result = await response.json();
    
    if (!result.success) {
      toast.error(`Points transaction failed: ${result.error}`);
      return { 
        success: false, 
        error: result.error 
      };
    }
    
    // Dispatch points updated event
    const event = new CustomEvent('pointsUpdated', { 
      detail: { 
        points: result.points,
        previous: result.previous,
        change: result.change
      } 
    });
    window.dispatchEvent(event);
    
    return {
      success: true,
      points: result.points,
      previous: result.previous,
      change: result.change
    };
  } catch (error) {
    console.error("Error processing points transaction:", error);
    return { 
      success: false, 
      error: "Unexpected error processing transaction" 
    };
  }
};

// For admin or testing purposes: set user points directly
export const setUserPoints = async (userId: string, points: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ points: points })
      .eq("id", userId);
    
    if (error) {
      console.error("Error setting user points:", error);
      return false;
    }
    
    // Create a history record
    const { error: historyError } = await supabase
      .from("points_history")
      .insert({
        user_id: userId,
        amount: points,
        action: "admin_set"
      });
    
    if (historyError) {
      console.error("Error recording points history:", historyError);
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error setting user points:", error);
    return false;
  }
};
