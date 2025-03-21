import { supabase } from "@/integrations/supabase/client";
import { Bet, BetPrediction, BetStatus } from "@/types/bet";

// User related functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Token related functions
export const fetchTokens = async () => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .order('last_updated_time', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchTokenById = async (tokenMint: string) => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token_mint', tokenMint)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching token by ID:', error);
    throw error;
  }
  
  return data;
};

// Trending tokens function
export const fetchTrendingTokens = async (limit = 10) => {
  try {
    console.log("Fetching trending tokens from Supabase...");
    
    // Get tokens with bet counts from the bets table
    const { data, error } = await supabase
      .from('bets')
      .select(`
        token_mint,
        token_name,
        token_symbol,
        sol_amount
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching trending tokens:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No bets found for trending analysis');
      return [];
    }
    
    // Group by token and count bets
    const tokenMap = new Map();
    
    data.forEach(bet => {
      if (!bet.token_mint) return;
      
      const key = bet.token_mint;
      if (tokenMap.has(key)) {
        const token = tokenMap.get(key);
        token.betCount += 1;
        token.totalAmount += Number(bet.sol_amount) || 0;
      } else {
        tokenMap.set(key, {
          tokenMint: bet.token_mint,
          tokenName: bet.token_name || 'Unknown Token',
          tokenSymbol: bet.token_symbol || 'UNKNOWN',
          betCount: 1,
          totalAmount: Number(bet.sol_amount) || 0
        });
      }
    });
    
    // Convert to array and sort by bet count
    const trendingTokens = Array.from(tokenMap.values())
      .sort((a, b) => b.betCount - a.betCount)
      .slice(0, limit);
    
    console.log('Trending tokens:', trendingTokens);
    return trendingTokens;
  } catch (error) {
    console.error('Error in fetchTrendingTokens:', error);
    throw error;
  }
};

// Bet related functions
export const fetchOpenBets = async () => {
  try {
    console.log("Fetching open bets from Supabase...");
    
    // Explicitly request all needed fields and use appropriate joins
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        tokens (token_name, token_symbol),
        creator,
        prediction_bettor1,
        sol_amount,
        duration,
        status,
        created_at,
        on_chain_id,
        transaction_signature
      `)
      .or('status.eq.open,status.eq.matched,status.eq.expired,status.eq.pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching open bets:', error);
      throw error;
    }
    
    console.log('Raw bets data from Supabase:', data);
    
    if (!data || data.length === 0) {
      console.log('No bets found in database');
      return [];
    }
    
    // Transform to match our frontend Bet type with more detailed logging
    const transformedBets = data.map(bet => {
      // Ensure we have all required data
      if (!bet.tokens) {
        console.warn('Missing related data for bet:', bet.bet_id);
      }
      
      // Map prediction values from database to our frontend format
      let predictionValue: BetPrediction;
      if (bet.prediction_bettor1 === 'up') {
        predictionValue = 'migrate';
      } else if (bet.prediction_bettor1 === 'down') {
        predictionValue = 'die';
      } else {
        predictionValue = bet.prediction_bettor1 as BetPrediction;
      }
      
      // Convert status string to BetStatus type
      const status = bet.status as BetStatus;
      
      // Determine outcome based on status
      let outcome: 'win' | 'loss' | undefined;
      if (status === 'completed' || status === 'closed') {
        outcome = undefined;
      }
      
      // Transform bet data with enhanced status information
      const transformedBet: Bet = {
        id: bet.bet_id,
        tokenId: bet.token_mint,
        tokenMint: bet.token_mint,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        initiator: bet.creator || 'Unknown',
        amount: bet.sol_amount,
        prediction: predictionValue,
        timestamp: new Date(bet.created_at).getTime(),
        expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
        status: status,
        duration: Math.floor(bet.duration / 60), // Convert seconds to minutes
        onChainBetId: bet.on_chain_id?.toString() || '',
        transactionSignature: bet.transaction_signature || '',
        outcome: outcome
      };
      
      console.log('Transformed bet:', transformedBet);
      return transformedBet;
    });
    
    console.log('Final transformed bets:', transformedBets);
    return transformedBets;
  } catch (error) {
    console.error('Error in fetchOpenBets:', error);
    throw error;
  }
};

export const fetchUserBets = async (userWalletAddress: string) => {
  try {
    // Fetch all bets where user is the creator
    const { data, error } = await supabase
      .from('bets')
      .select(`
        bet_id,
        token_mint,
        tokens (token_name, token_symbol),
        creator,
        prediction_bettor1,
        sol_amount,
        duration,
        status,
        created_at,
        on_chain_id,
        transaction_signature
      `)
      .eq('creator', userWalletAddress)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform to match our frontend Bet type
    return data.map(bet => {
      // Map prediction values from database to our frontend format
      let predictionValue: BetPrediction;
      if (bet.prediction_bettor1 === 'up') {
        predictionValue = 'migrate';
      } else if (bet.prediction_bettor1 === 'down') {
        predictionValue = 'die';
      } else {
        predictionValue = bet.prediction_bettor1 as BetPrediction;
      }
      
      // Convert status string to BetStatus type
      const status = bet.status as BetStatus;
      
      // Determine outcome based on status
      let outcome: 'win' | 'loss' | undefined;
      if (status === 'completed' || status === 'closed') {
        outcome = undefined;
      }
      
      return {
        id: bet.bet_id,
        tokenId: bet.token_mint,
        tokenMint: bet.token_mint,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        initiator: bet.creator,
        amount: bet.sol_amount,
        prediction: predictionValue,
        timestamp: new Date(bet.created_at).getTime(),
        expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
        status: status,
        duration: Math.floor(bet.duration / 60), // Convert seconds to minutes
        onChainBetId: bet.on_chain_id?.toString() || '',
        transactionSignature: bet.transaction_signature || '',
        outcome: outcome
      };
    });
  } catch (error) {
    console.error('Error in fetchUserBets:', error);
    throw error;
  }
};

export const createSupabaseBet = async (
  tokenMint: string,
  tokenName: string,
  tokenSymbol: string,
  prediction: BetPrediction,
  duration: number, // in minutes
  amount: number,
  creatorWalletAddress: string,
  onChainId?: string,
  transactionSignature?: string
) => {
  try {
    console.log(`Creating bet in Supabase: tokenMint=${tokenMint}, prediction=${prediction}, duration=${duration}, amount=${amount}, creator=${creatorWalletAddress}`);
    
    // Convert duration to seconds for database
    const durationInSeconds = duration * 60;
    
    // Get token data to store initial market cap
    const { data: tokenData } = await supabase
      .from('tokens')
      .select('current_market_cap, token_name, token_symbol')
      .eq('token_mint', tokenMint)
      .single();
    
    if (!tokenData) throw new Error('Token not found');
    
    console.log('Token data for bet:', tokenData);
    
    // Map frontend prediction to database format
    let dbPrediction: string;
    if (prediction === 'migrate') dbPrediction = 'up';
    else if (prediction === 'die') dbPrediction = 'down';
    else dbPrediction = prediction;
    
    // Insert the bet
    const { data, error } = await supabase
      .from('bets')
      .insert({
        token_mint: tokenMint,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        creator: creatorWalletAddress,
        bettor1_id: creatorWalletAddress,
        prediction_bettor1: dbPrediction,
        duration: durationInSeconds,
        sol_amount: amount,
        status: 'open',
        on_chain_id: onChainId,
        transaction_signature: transactionSignature
      })
      .select('bet_id, created_at')
      .single();
    
    if (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
    
    console.log('Bet created successfully in Supabase:', data);
    
    // Create history record in bet_history table
    if (data && data.bet_id) {
      try {
        await supabase
          .from('bet_history')
          .insert({
            bet_id: data.bet_id,
            action: 'created',
            user_id: creatorWalletAddress,
            details: { prediction: dbPrediction, amount: amount },
            market_cap_at_action: tokenData.current_market_cap || 0
          });
      } catch (historyError) {
        console.error('Error creating bet history:', historyError);
        // Continue even if history creation fails
      }
    }
    
    // Return in the format expected by our frontend
    const newBet = {
      id: data.bet_id,
      tokenId: tokenMint,
      tokenMint: tokenMint,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      initiator: creatorWalletAddress,
      amount: amount,
      prediction: prediction,
      timestamp: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.created_at).getTime() + (durationInSeconds * 1000),
      status: 'open' as BetStatus,
      duration: duration,
      onChainBetId: onChainId || '',
      transactionSignature: transactionSignature || ''
    };
    
    console.log('Returning new bet:', newBet);
    
    // Dispatch a custom event for the BetReel to pick up
    const newBetCreatedEvent = new CustomEvent('newBetCreated', {
      detail: { bet: newBet }
    });
    window.dispatchEvent(newBetCreatedEvent);
    
    return newBet;
  } catch (error) {
    console.error('Error in createSupabaseBet:', error);
    throw error;
  }
};

export const acceptBet = async (betId: string) => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  // First get the bet details
  const { data: betData, error: betError } = await supabase
    .from('bets')
    .select(`
      bet_id,
      token_mint,
      tokens (token_name, token_symbol, current_market_cap),
      creator,
      prediction_bettor1,
      sol_amount,
      duration,
      created_at
    `)
    .eq('bet_id', betId)
    .eq('status', 'open')
    .single();
  
  if (betError) throw betError;
  if (betData.creator === user.id) throw new Error('Cannot accept your own bet');
  
  // Calculate start and end times
  const now = new Date();
  const endTime = new Date(now.getTime() + betData.duration * 1000);
  
  // Update the bet with counter-party info
  const { data, error } = await supabase
    .from('bets')
    .update({
      bettor2_id: user.id,
      status: 'matched',
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      initial_market_cap: betData.tokens?.current_market_cap || 0
    })
    .eq('bet_id', betId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create a history record
  await supabase
    .from('bet_history')
    .insert({
      bet_id: betId,
      action: 'matched',
      user_id: user.id,
      details: { counter_party: user.id },
      market_cap_at_action: betData.tokens?.current_market_cap || 0
    });
  
  // Map prediction values from database to our frontend format
  let predictionValue: BetPrediction;
  if (betData.prediction_bettor1 === 'up') predictionValue = 'migrate';
  else if (betData.prediction_bettor1 === 'down') predictionValue = 'die';
  else predictionValue = betData.prediction_bettor1 as BetPrediction;
  
  // Convert status string to BetStatus type
  const status = 'matched' as BetStatus;
  
  // Return updated bet in the format expected by our frontend
  return {
    id: data.bet_id,
    tokenId: data.token_mint,
    tokenMint: data.token_mint,
    tokenName: betData.tokens?.token_name || 'Unknown',
    tokenSymbol: betData.tokens?.token_symbol || 'UNKNOWN',
    initiator: betData.creator,
    counterParty: user.id,
    amount: data.sol_amount,
    prediction: predictionValue,
    timestamp: new Date(betData.created_at).getTime(),
    expiresAt: new Date(data.end_time).getTime(),
    status: status,
    initialMarketCap: data.initial_market_cap,
    duration: Math.floor(betData.duration / 60), // Convert seconds to minutes
    onChainBetId: data.on_chain_id || '',
    transactionSignature: data.transaction_signature || ''
  };
};
