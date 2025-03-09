
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
  const { data, error } = await supabase
    .from('bets')
    .select(`
      bet_id,
      token_mint,
      tokens (token_name, token_symbol),
      bettor1_id,
      users!bets_bettor1_id_fkey (wallet_address),
      prediction_bettor1,
      duration,
      sol_amount,
      created_at,
      status
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Transform to match our frontend Bet type
  return data.map(bet => ({
    id: bet.bet_id,
    tokenId: bet.token_mint,
    tokenName: bet.tokens.token_name,
    tokenSymbol: bet.tokens.token_symbol,
    initiator: bet.users.wallet_address,
    amount: bet.sol_amount,
    prediction: bet.prediction_bettor1 as 'migrate' | 'die',
    timestamp: new Date(bet.created_at).getTime(),
    expiresAt: new Date(bet.created_at).getTime() + (bet.duration * 1000),
    status: bet.status,
    duration: Math.floor(bet.duration / 60) // Convert seconds to minutes
  }));
};

export const fetchUserBets = async (userWalletAddress: string) => {
  // First get the user id from the wallet address
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', userWalletAddress)
    .single();
  
  if (userError) throw userError;
  
  // Then fetch all bets where user is either bettor1 or bettor2
  const { data, error } = await supabase
    .from('bets')
    .select(`
      bet_id,
      token_mint,
      tokens (token_name, token_symbol),
      bettor1_id,
      bettor2_id,
      users!bets_bettor1_id_fkey (wallet_address),
      prediction_bettor1,
      duration,
      sol_amount,
      start_time,
      end_time,
      initial_market_cap,
      status,
      created_at
    `)
    .or(`bettor1_id.eq.${userData.id},bettor2_id.eq.${userData.id}`)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Transform to match our frontend Bet type
  return data.map(bet => {
    const isBettor1 = bet.bettor1_id === userData.id;
    const prediction = isBettor1 ? bet.prediction_bettor1 : (bet.prediction_bettor1 === 'migrate' ? 'die' : 'migrate');
    
    return {
      id: bet.bet_id,
      tokenId: bet.token_mint,
      tokenName: bet.tokens.token_name,
      tokenSymbol: bet.tokens.token_symbol,
      initiator: bet.users.wallet_address,
      counterParty: bet.bettor2_id ? 'Opponent' : undefined, // Simplified for now
      amount: bet.sol_amount,
      prediction: prediction as 'migrate' | 'die',
      timestamp: new Date(bet.created_at).getTime(),
      expiresAt: bet.end_time ? new Date(bet.end_time).getTime() : new Date(bet.created_at).getTime() + (bet.duration * 1000),
      status: bet.status,
      initialMarketCap: bet.initial_market_cap,
      duration: Math.floor(bet.duration / 60) // Convert seconds to minutes
    };
  });
};

export const createBet = async (
  tokenMint: string,
  prediction: 'migrate' | 'die',
  duration: number, // in minutes
  solAmount: number
) => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  // Convert duration to seconds for database
  const durationInSeconds = duration * 60;
  
  // Get token data to store initial market cap
  const { data: tokenData } = await supabase
    .from('tokens')
    .select('current_market_cap, token_name, token_symbol')
    .eq('token_mint', tokenMint)
    .single();
  
  if (!tokenData) throw new Error('Token not found');
  
  // Insert the bet
  const { data, error } = await supabase
    .from('bets')
    .insert({
      token_mint: tokenMint,
      bettor1_id: user.id,
      prediction_bettor1: prediction,
      duration: durationInSeconds,
      sol_amount: solAmount,
      initial_market_cap: tokenData.current_market_cap,
      status: 'open'
    })
    .select('bet_id, created_at')
    .single();
  
  if (error) throw error;
  
  // Create a history record
  await supabase
    .from('bet_history')
    .insert({
      bet_id: data.bet_id,
      action: 'created',
      user_id: user.id,
      details: { prediction, duration: durationInSeconds, sol_amount: solAmount },
      market_cap_at_action: tokenData.current_market_cap
    });
  
  // Return in the format expected by our frontend
  return {
    id: data.bet_id,
    tokenId: tokenMint,
    tokenName: tokenData.token_name,
    tokenSymbol: tokenData.token_symbol,
    initiator: user.id,
    amount: solAmount,
    prediction: prediction,
    timestamp: new Date(data.created_at).getTime(),
    expiresAt: new Date(data.created_at).getTime() + (durationInSeconds * 1000),
    status: 'open',
    duration: duration
  };
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
      bettor1_id,
      prediction_bettor1,
      duration,
      sol_amount,
      created_at
    `)
    .eq('bet_id', betId)
    .eq('status', 'open')
    .single();
  
  if (betError) throw betError;
  if (betData.bettor1_id === user.id) throw new Error('Cannot accept your own bet');
  
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
    initiator: betData.bettor1_id,
    counterParty: user.id,
    amount: data.sol_amount,
    prediction: betData.prediction_bettor1 as 'migrate' | 'die',
    timestamp: new Date(betData.created_at).getTime(),
    expiresAt: new Date(data.end_time).getTime(),
    status: 'matched',
    initialMarketCap: data.initial_market_cap,
    duration: Math.floor(betData.duration / 60) // Convert seconds to minutes
  };
};
