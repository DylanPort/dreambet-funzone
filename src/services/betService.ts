
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bet, BetPrediction, BetStatus } from "@/types/bet";
import { processPointsTransaction } from "./pointsService";

// Create a new points-based bet
export const createPointsBet = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  pointsAmount: number,
  prediction: BetPrediction,
  duration: number = 60 // Default to 60 minutes
): Promise<Bet | null> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be signed in to create a bet");
      return null;
    }
    
    console.log(`Creating points bet: ${pointsAmount} points on ${tokenSymbol} to ${prediction} within ${duration} minutes`);
    
    // Process points transaction for the bet
    const pointsResult = await processPointsTransaction('bet', pointsAmount);
    
    if (!pointsResult.success) {
      toast.error(`Failed to process points for bet: ${pointsResult.error}`);
      return null;
    }
    
    const initiator = user.id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (duration * 60 * 1000));
    
    // Create bet in Supabase
    const { data, error } = await supabase
      .from('bets')
      .insert({
        token_mint: tokenId,
        creator: initiator,
        bettor1_id: initiator,
        prediction_bettor1: prediction,
        points_amount: pointsAmount,
        duration: duration * 60, // Convert to seconds for storage
        status: 'open',
        expires_at: expiresAt.toISOString(),
        sol_amount: 0 // Set to 0 for legacy compatibility
      })
      .select(`
        bet_id,
        token_mint,
        creator,
        prediction_bettor1,
        points_amount,
        status,
        created_at,
        expires_at,
        duration,
        tokens (token_name, token_symbol)
      `)
      .single();
    
    if (error) {
      console.error("Error creating bet in Supabase:", error);
      toast.error("Failed to create bet. Please try again.");
      return null;
    }
    
    const bet: Bet = {
      id: data.bet_id,
      tokenId: data.token_mint,
      tokenName: data.tokens?.token_name || tokenName,
      tokenSymbol: data.tokens?.token_symbol || tokenSymbol,
      initiator: data.creator,
      points_amount: data.points_amount,
      prediction: data.prediction_bettor1 as BetPrediction,
      timestamp: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.expires_at).getTime(),
      status: data.status as BetStatus,
      duration: Math.floor(data.duration / 60), // Convert back to minutes
      onChainBetId: '',
      transactionSignature: ''
    };
    
    // Dispatch event for real-time updates
    try {
      const eventData = {
        points_amount: pointsAmount,
        prediction,
        tokenId,
        tokenName,
        tokenSymbol,
        bet
      };
      
      const event = new CustomEvent('newBetCreated', { detail: eventData });
      window.dispatchEvent(event);
      console.log("Dispatched newBetCreated event:", eventData);
    } catch (eventError) {
      console.error("Error dispatching newBetCreated event:", eventError);
    }
    
    toast.success(`Successfully placed a ${pointsAmount} points bet on ${tokenSymbol}!`);
    return bet;
  } catch (error) {
    console.error("Unexpected error in createPointsBet:", error);
    toast.error("An unexpected error occurred while creating the bet");
    return null;
  }
};

// Accept an existing points-based bet
export const acceptPointsBet = async (betId: string): Promise<Bet | null> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be signed in to accept a bet");
      return null;
    }
    
    // Get bet details
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        creator,
        prediction_bettor1,
        points_amount,
        status,
        tokens (token_name, token_symbol)
      `)
      .eq('bet_id', betId)
      .single();
    
    if (betError || !betData) {
      console.error("Error fetching bet details:", betError);
      toast.error("Failed to get bet details");
      return null;
    }
    
    // Check if bet is still open
    if (betData.status !== 'open') {
      toast.error("This bet is no longer available");
      return null;
    }
    
    // Check if user is trying to accept their own bet
    if (betData.creator === user.id) {
      toast.error("You cannot accept your own bet");
      return null;
    }
    
    // Process points transaction for accepting the bet
    const pointsResult = await processPointsTransaction('bet', betData.points_amount);
    
    if (!pointsResult.success) {
      toast.error(`Failed to process points for bet: ${pointsResult.error}`);
      return null;
    }
    
    // Update bet status to matched
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update({
        status: 'matched',
        bettor2_id: user.id,
        counterparty: user.id,
        prediction_bettor2: betData.prediction_bettor1 === 'migrate' ? 'die' : 'migrate' // Opposite of initiator's prediction
      })
      .eq('bet_id', betId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating bet status:", updateError);
      toast.error("Failed to accept bet");
      return null;
    }
    
    toast.success(`Successfully accepted bet for ${betData.points_amount} points!`);
    
    // Dispatch event for real-time updates
    try {
      const event = new CustomEvent('betAccepted', { 
        detail: { betId: betId }
      });
      window.dispatchEvent(event);
    } catch (eventError) {
      console.error("Error dispatching betAccepted event:", eventError);
    }
    
    return {
      id: updatedBet.bet_id,
      tokenId: updatedBet.token_mint,
      tokenName: betData.tokens?.token_name || 'Unknown Token',
      tokenSymbol: betData.tokens?.token_symbol || 'UNKNOWN',
      initiator: updatedBet.creator,
      points_amount: updatedBet.points_amount,
      prediction: updatedBet.prediction_bettor1 as BetPrediction,
      timestamp: new Date(updatedBet.created_at).getTime(),
      expiresAt: new Date(updatedBet.expires_at).getTime(),
      status: updatedBet.status as BetStatus,
      duration: Math.floor(updatedBet.duration / 60),
      counterParty: updatedBet.counterparty,
      onChainBetId: '',
      transactionSignature: ''
    };
  } catch (error) {
    console.error("Unexpected error in acceptPointsBet:", error);
    toast.error("An unexpected error occurred while accepting the bet");
    return null;
  }
};

// Fetch open bets from Supabase
export const fetchOpenBets = async (): Promise<Bet[]> => {
  try {
    console.log("Fetching open bets from Supabase");
    
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        creator,
        prediction_bettor1,
        points_amount,
        status,
        created_at,
        expires_at,
        duration,
        tokens (token_name, token_symbol)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching open bets:", error);
      return [];
    }
    
    // Map Supabase data to Bet type
    return (data || []).map(bet => ({
      id: bet.bet_id,
      tokenId: bet.token_mint,
      tokenName: bet.tokens?.token_name || 'Unknown Token',
      tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
      initiator: bet.creator,
      points_amount: bet.points_amount || 0,
      prediction: bet.prediction_bettor1 as BetPrediction,
      timestamp: new Date(bet.created_at).getTime(),
      expiresAt: new Date(bet.expires_at).getTime(),
      status: bet.status as BetStatus,
      duration: Math.floor(bet.duration / 60),
      onChainBetId: '',
      transactionSignature: ''
    }));
  } catch (error) {
    console.error("Unexpected error in fetchOpenBets:", error);
    return [];
  }
};

// Fetch user's bets
export const fetchUserBets = async (userId: string): Promise<Bet[]> => {
  try {
    console.log(`Fetching bets for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        creator,
        counterparty,
        prediction_bettor1,
        prediction_bettor2,
        points_amount,
        status,
        created_at,
        expires_at,
        duration,
        winner,
        tokens (token_name, token_symbol)
      `)
      .or(`creator.eq.${userId},counterparty.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching user bets:", error);
      return [];
    }
    
    // Map Supabase data to Bet type
    return (data || []).map(bet => {
      // Determine the user's prediction based on whether they're the creator or counterparty
      const isCreator = bet.creator === userId;
      const userPrediction = isCreator ? bet.prediction_bettor1 : bet.prediction_bettor2;
      
      return {
        id: bet.bet_id,
        tokenId: bet.token_mint,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        initiator: bet.creator,
        points_amount: bet.points_amount || 0,
        prediction: userPrediction as BetPrediction,
        timestamp: new Date(bet.created_at).getTime(),
        expiresAt: new Date(bet.expires_at).getTime(),
        status: bet.status as BetStatus,
        duration: Math.floor(bet.duration / 60),
        counterParty: bet.counterparty || undefined,
        winner: bet.winner || undefined,
        onChainBetId: '',
        transactionSignature: ''
      };
    });
  } catch (error) {
    console.error("Unexpected error in fetchUserBets:", error);
    return [];
  }
};

// Get bet results/statistics for a user
export const getUserBetResults = async (userId: string): Promise<BetResults> => {
  try {
    const bets = await fetchUserBets(userId);
    
    const results: BetResults = {
      won: 0,
      lost: 0,
      open: 0,
      total: bets.length,
      winRate: 0
    };
    
    bets.forEach(bet => {
      if (bet.status === 'completed') {
        if (bet.winner === userId) {
          results.won++;
        } else {
          results.lost++;
        }
      } else if (bet.status === 'open' || bet.status === 'matched') {
        results.open++;
      }
    });
    
    // Calculate win rate
    results.winRate = results.won + results.lost > 0 
      ? Math.round((results.won / (results.won + results.lost)) * 100) 
      : 0;
    
    return results;
  } catch (error) {
    console.error("Error getting user bet results:", error);
    return { won: 0, lost: 0, open: 0, total: 0, winRate: 0 };
  }
};
