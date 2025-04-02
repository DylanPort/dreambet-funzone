
import { Bet } from '@/types/bet';
import { supabase } from '@/integrations/supabase/client';

// Mock implementation for createBet since the real one is missing
export const createBet = async (bet: Partial<Bet>, publicKey: any, signTransaction: any) => {
  console.log('Mock createBet called with:', { bet, publicKey, signTransaction });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response
  return {
    id: 'mock-bet-id-' + Date.now(),
    ...bet,
    status: 'open',
    createdAt: Date.now(),
    transactionSignature: 'mock-transaction-signature',
  };
};

export const acceptBet = async (betId: string, publicKey?: any) => {
  console.log('Mock acceptBet called with:', { betId, publicKey });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response
  return {
    id: betId,
    status: 'matched',
    counterParty: publicKey ? publicKey.toString() : 'unknown-counterparty',
    updatedAt: Date.now(),
  };
};

// Add missing exported functions
export const fetchTokens = async () => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('last_updated_time', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

export const fetchOpenBets = async () => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map database format to Bet type
    return (data || []).map(bet => ({
      id: bet.bet_id,
      tokenId: bet.token_mint,
      tokenName: bet.token_name,
      tokenSymbol: bet.token_symbol,
      tokenMint: bet.token_mint,
      initiator: bet.creator,
      amount: bet.sol_amount,
      prediction: bet.prediction_bettor1,
      timestamp: new Date(bet.created_at).getTime(),
      expiresAt: new Date(bet.end_time || Date.now() + 3600000).getTime(),
      status: bet.status,
      duration: bet.duration,
      onChainBetId: bet.on_chain_id || '',
      transactionSignature: bet.transaction_signature || '',
      initialMarketCap: bet.initial_market_cap,
      currentMarketCap: bet.current_market_cap
    }));
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return [];
  }
};

export const fetchUserBets = async (userAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('creator', userAddress)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map database format to Bet type
    return (data || []).map(bet => ({
      id: bet.bet_id,
      tokenId: bet.token_mint,
      tokenName: bet.token_name,
      tokenSymbol: bet.token_symbol,
      tokenMint: bet.token_mint,
      initiator: bet.creator,
      amount: bet.sol_amount,
      prediction: bet.prediction_bettor1,
      timestamp: new Date(bet.created_at).getTime(),
      expiresAt: new Date(bet.end_time || Date.now() + 3600000).getTime(),
      status: bet.status,
      duration: bet.duration,
      onChainBetId: bet.on_chain_id || '',
      transactionSignature: bet.transaction_signature || '',
      initialMarketCap: bet.initial_market_cap,
      currentMarketCap: bet.current_market_cap
    }));
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }
};

export const createSupabaseBet = async (
  tokenMint: string,
  tokenName: string,
  tokenSymbol: string,
  prediction: string,
  duration: number,
  solAmount: number,
  creatorAddress: string,
  onChainId: string = '',
  transactionSignature: string = ''
) => {
  try {
    // Get token details and market cap
    const { data: tokenData } = await supabase
      .from('tokens')
      .select('current_market_cap')
      .eq('token_mint', tokenMint)
      .single();
    
    const initialMarketCap = tokenData?.current_market_cap || 0;
    const endTime = new Date(Date.now() + duration * 60 * 1000);
    
    const { data, error } = await supabase
      .from('bets')
      .insert({
        token_mint: tokenMint,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        prediction_bettor1: prediction,
        duration: duration * 60, // Convert to seconds
        creator: creatorAddress,
        sol_amount: solAmount,
        initial_market_cap: initialMarketCap,
        current_market_cap: initialMarketCap,
        status: 'open',
        on_chain_id: onChainId,
        transaction_signature: transactionSignature,
        end_time: endTime.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Map database format to Bet type
    return {
      id: data.bet_id,
      tokenId: data.token_mint,
      tokenName: data.token_name,
      tokenSymbol: data.token_symbol,
      tokenMint: data.token_mint,
      initiator: data.creator,
      amount: data.sol_amount,
      prediction: data.prediction_bettor1,
      timestamp: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.end_time).getTime(),
      status: data.status,
      duration: data.duration / 60, // Convert back to minutes
      onChainBetId: data.on_chain_id || '',
      transactionSignature: data.transaction_signature || '',
      initialMarketCap: data.initial_market_cap,
      currentMarketCap: data.current_market_cap
    };
  } catch (error) {
    console.error('Error creating bet in Supabase:', error);
    throw error;
  }
};

export const fetchTokenById = async (tokenId: string) => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_mint', tokenId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching token with ID ${tokenId}:`, error);
    return null;
  }
};

export const trackTokenSearch = async (tokenMint: string, tokenName: string, tokenSymbol: string) => {
  try {
    // Check if token exists in search history
    const { data: existingSearch, error: searchError } = await supabase
      .from('token_searches')
      .select('*')
      .eq('token_mint', tokenMint)
      .single();
    
    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      throw searchError;
    }
    
    if (existingSearch) {
      // Update existing search record
      await supabase
        .from('token_searches')
        .update({
          search_count: existingSearch.search_count + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq('token_mint', tokenMint);
    } else {
      // Insert new search record
      await supabase
        .from('token_searches')
        .insert({
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol
        });
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking token search:', error);
    return false;
  }
};

export const fetchTrendingTokens = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('token_searches')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return [];
  }
};

export const fetchTopSearchedTokens = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('token_searches')
      .select('*')
      .order('search_count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching top searched tokens:', error);
    return [];
  }
};

export const fetchRecentlySearchedTokens = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('token_searches')
      .select('*')
      .order('last_searched_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recently searched tokens:', error);
    return [];
  }
};

// Export SearchedToken type
export interface SearchedToken {
  id: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  search_count: number;
  first_searched_at: string;
  last_searched_at: string;
}
