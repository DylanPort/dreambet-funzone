import { supabase } from "@/integrations/supabase/client";
import { Bet } from "@/types/bet";

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
    .single();
  
  if (error) throw error;
  return data;
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
        prediction,
        amount,
        duration,
        status,
        created_at,
        transaction_signature,
        on_chain_id
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching open bets:', error);
      throw error;
    }
    
    console.log('Raw open bets data from Supabase:', data);
    
    if (!data || data.length === 0) {
      console.log('No open bets found in database');
      return [];
    }
    
    // Transform to match our frontend Bet type with more detailed logging
    const transformedBets = data.map(bet => {
      // Ensure we have all required data
      if (!bet.tokens) {
        console.warn('Missing related data for bet:', bet.bet_id);
      }
      
      // Map prediction values from database to our frontend format
      let predictionValue: 'migrate' | 'die' = bet.prediction as 'migrate' | 'die';
      if (bet.prediction === 'up') predictionValue = 'migrate';
      if (bet.prediction === 'down') predictionValue = 'die';
      
      const transformedBet = {
        id: bet.bet_id,
        tokenId: bet.token_mint,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        initiator: bet.creator || 'Unknown',
        amount: bet.amount,
        prediction: predictionValue,
        timestamp: new Date(bet.created_at).getTime(),
        expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
        status: bet.status,
        duration: Math.floor(bet.duration / 60), // Convert seconds to minutes
        onChainBetId: bet.on_chain_id,
        transactionSignature: bet.transaction_signature
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
        prediction,
        amount,
        duration,
        status,
        created_at,
        transaction_signature,
        on_chain_id
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
      let predictionValue: 'migrate' | 'die' = bet.prediction as 'migrate' | 'die';
      if (bet.prediction === 'up') predictionValue = 'migrate';
      if (bet.prediction === 'down') predictionValue = 'die';
      
      return {
        id: bet.bet_id,
        tokenId: bet.token_mint,
        tokenName: bet.tokens?.token_name || 'Unknown Token',
        tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
        initiator: bet.creator,
        amount: bet.amount,
        prediction: predictionValue,
        timestamp: new Date(bet.created_at).getTime(),
        expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
        status: bet.status,
        duration: Math.floor(bet.duration / 60), // Convert seconds to minutes
        onChainBetId: bet.on_chain_id,
        transactionSignature: bet.transaction_signature
      };
    });
  } catch (error) {
    console.error('Error in fetchUserBets:', error);
    throw error;
  }
};

export const createSupabaseBet = async (
  tokenMint: string,
  prediction: 'migrate' | 'die',
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
    let dbPrediction = prediction;
    if (prediction === 'migrate') dbPrediction = 'up';
    if (prediction === 'die') dbPrediction = 'down';
    
    // Insert the bet
    const { data, error } = await supabase
      .from('bets')
      .insert({
        token_mint: tokenMint,
        creator: creatorWalletAddress,
        prediction: dbPrediction,
        duration: durationInSeconds,
        amount: amount,
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
    
    // Return in the format expected by our frontend
    const newBet = {
      id: data.bet_id,
      tokenId: tokenMint,
      tokenName: tokenData.token_name,
      tokenSymbol: tokenData.token_symbol,
      initiator: creatorWalletAddress,
      amount: amount,
      prediction: prediction,
      timestamp: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.created_at).getTime() + (durationInSeconds * 1000),
      status: 'open',
      duration: duration,
      onChainBetId: onChainId,
      transactionSignature: transactionSignature
    };
    
    console.log('Returning new bet:', newBet);
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
      prediction,
      amount,
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
      initial_market_cap: betData.tokens.current_market_cap
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
      market_cap_at_action: betData.tokens.current_market_cap
    });
  
  // Return updated bet in the format expected by our frontend
  return {
    id: data.bet_id,
    tokenId: data.token_mint,
    tokenName: betData.tokens.token_name,
    tokenSymbol: betData.tokens.token_symbol,
    initiator: betData.creator,
    counterParty: user.id,
    amount: data.amount,
    prediction: betData.prediction as 'migrate' | 'die',
    timestamp: new Date(betData.created_at).getTime(),
    expiresAt: new Date(data.end_time).getTime(),
    status: 'matched',
    initialMarketCap: data.initial_market_cap,
    duration: Math.floor(betData.duration / 60) // Convert seconds to minutes
  };
};
