
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Processes a points transaction for a user
 * @param action The type of transaction: "bet", "win", "refund", "initialize"
 * @param amount The number of points involved in the transaction
 * @param referenceId Optional reference ID for tracking (e.g., bet ID)
 * @returns Object containing success status and updated points info
 */
export const processPointsTransaction = async (
  action: "bet" | "win" | "refund" | "initialize",
  amount: number,
  referenceId?: string
) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast("Please sign in to perform this action");
      return { success: false, error: "User not authenticated" };
    }
    
    console.log(`Processing ${action} transaction for ${amount} points`);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke("update-user-points", {
      body: {
        userId: user.id,
        action,
        amount,
        referenceId
      }
    });
    
    if (error) {
      console.error("Error processing points transaction:", error);
      
      if (action === "bet") {
        toast(`Failed to process bet: ${error.message || "Insufficient points"}`);
      } else {
        toast(`Error processing points: ${error.message || "Unknown error"}`);
      }
      
      return { success: false, error: error.message || "Failed to process transaction" };
    }
    
    // Handle response
    try {
      if (!data) {
        throw new Error("No data returned from function");
      }
      
      // For functions.invoke, we don't need to call .json()
      const result = data;
      
      if (!result.success) {
        if (action === "bet" && result.error === "Insufficient points") {
          toast("You don't have enough points for this bet");
        } else {
          toast(`Transaction failed: ${result.error || "Unknown error"}`);
        }
        return { success: false, error: result.error || "Transaction failed" };
      }
      
      // Show success message
      if (action === "bet") {
        toast(`Placed bet for ${amount} points`);
      } else if (action === "win") {
        toast(`Congratulations! You won ${amount * 2} points!`);
      }
      
      // Dispatch an event to update any components displaying points
      try {
        const pointsUpdatedEvent = new CustomEvent('pointsUpdated', {
          detail: { points: result.points, change: result.change }
        });
        window.dispatchEvent(pointsUpdatedEvent);
      } catch (eventError) {
        console.error("Error dispatching pointsUpdated event:", eventError);
      }
      
      return {
        success: true,
        points: {
          available: result.points,
          previous: result.previous,
          change: result.change
        }
      };
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      toast("Error processing transaction");
      return { success: false, error: "Failed to parse response" };
    }
  } catch (error) {
    console.error("Unexpected error in processPointsTransaction:", error);
    toast("An unexpected error occurred");
    return { success: false, error: "Unexpected error" };
  }
};

/**
 * Gets all bets with their points for a user
 * @param userId The user ID to get bets for
 * @returns Array of bets with point values
 */
export const getUserPointsBets = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        tokens (token_name, token_symbol),
        creator,
        counterparty,
        prediction_bettor1,
        points_amount,
        status,
        created_at,
        expires_at,
        winner
      `)
      .or(`creator.eq.${userId},counterparty.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user points bets:", error);
      return [];
    }
    
    return data.map(bet => ({
      id: bet.bet_id,
      points: bet.points_amount || 0,
      tokenName: bet.tokens?.token_name || 'Unknown',
      tokenSymbol: bet.tokens?.token_symbol || '???',
      timestamp: new Date(bet.created_at).getTime(),
      status: bet.status,
      // Determine if the user won this bet
      userWon: bet.winner === userId
    }));
  } catch (error) {
    console.error("Error in getUserPointsBets:", error);
    return [];
  }
};

/**
 * Gets the user's current points balance
 * @returns The user's points balance or null if not authenticated
 */
export const getUserPoints = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user points:", error);
      return null;
    }
    
    return data.points;
  } catch (error) {
    console.error("Error in getUserPoints:", error);
    return null;
  }
};

/**
 * Gets points leaderboard data
 * @param limit Number of top users to return
 * @returns Array of users with their points, sorted by highest points first
 */
export const getPointsLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, points, wallet_address')
      .order('points', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching points leaderboard:", error);
      return [];
    }
    
    return data.map(user => ({
      id: user.id,
      username: user.username || user.wallet_address?.substring(0, 6) + '...' + user.wallet_address?.substring(user.wallet_address.length - 4) || 'Unknown',
      points: user.points,
      walletAddress: user.wallet_address
    }));
  } catch (error) {
    console.error("Error in getPointsLeaderboard:", error);
    return [];
  }
};

/**
 * Updates a user's points from a server function response
 * No need to use .json() with supabase.functions.invoke
 */
export const handlePointsUpdateResponse = (data: any) => {
  if (!data || !data.success) {
    return { success: false, error: data?.error || "Failed to update points" };
  }
  
  return {
    success: true,
    points: {
      available: data.points,
      previous: data.previous,
      change: data.change
    }
  };
};
