
import { Bet, BetPrediction } from '@/types/bet';
import { 
  fetchTokens as fetchSupabaseTokens, 
  fetchOpenBets as fetchSupabaseOpenBets, 
  fetchUserBets as fetchSupabaseUserBets, 
  createBet as createSupabaseBet, 
  acceptBet as acceptSupabaseBet,
  fetchTokenById
} from '@/services/supabaseService';
import {
  createSolanaBet,
  acceptSolanaBet,
  getSolanaBetData
} from '@/services/solanaBetService';

// API functions that now directly use Supabase services
export const fetchMigratingTokens = async () => {
  try {
    const tokens = await fetchSupabaseTokens();
    
    // Convert to the format expected by our UI
    return tokens.map(token => ({
      id: token.token_mint,
      name: token.token_name,
      symbol: token.token_symbol || '',
      logo: '🪙', // Default logo
      currentPrice: token.last_trade_price,
      change24h: 0, // We don't have historical data yet
      migrationTime: new Date(token.last_updated_time).getTime(),
    }));
  } catch (error) {
    console.error('Error fetching tokens:', error);
    // Return empty array instead of fallback to mock data
    return [];
  }
};

export const fetchBetsByToken = async (tokenId: string): Promise<Bet[]> => {
  try {
    // Query bets by token ID from Supabase
    const openBets = await fetchSupabaseOpenBets();
    const filteredBets = openBets.filter(bet => bet.tokenId === tokenId);
    
    // Ensure status is of the correct type
    return filteredBets.map(bet => ({
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    }));
  } catch (error) {
    console.error('Error fetching bets by token:', error);
    return [];
  }
};

// Export wrapper functions that use Supabase services
export const fetchOpenBets = async (): Promise<Bet[]> => {
  try {
    const bets = await fetchSupabaseOpenBets();
    // Make sure the status is one of the allowed types in the Bet interface
    return bets.map(bet => ({
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    }));
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return [];
  }
};

export const fetchUserBets = async (userAddress: string): Promise<Bet[]> => {
  try {
    const bets = await fetchSupabaseUserBets(userAddress);
    // Make sure the status is one of the allowed types in the Bet interface
    return bets.map(bet => ({
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    }));
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }
};

export const createBet = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  initiator: string,
  amount: number,
  prediction: BetPrediction,
  wallet: any
): Promise<Bet> => {
  try {
    // Create bet on Solana blockchain first
    const { betId } = await createSolanaBet(
      wallet,
      tokenId,
      prediction,
      60, // 60 minutes duration
      amount
    );
    
    // Then create in Supabase for our frontend
    const bet = await createSupabaseBet(tokenId, prediction, 60, amount);
    
    // Update the bet with the on-chain betId
    return {
      ...bet,
      onChainBetId: betId.toString(),
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    };
  } catch (error) {
    console.error('Error creating bet:', error);
    throw error;
  }
};

export const acceptBet = async (
  betId: string,
  counterParty: string,
  wallet: any,
  onChainBetId?: string
): Promise<Bet> => {
  try {
    // If we have the on-chain betId, accept on Solana blockchain first
    if (onChainBetId) {
      await acceptSolanaBet(wallet, parseInt(onChainBetId));
    }
    
    // Then accept in Supabase for our frontend
    const bet = await acceptSupabaseBet(betId);
    
    // Ensure the status is one of the allowed types
    return {
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    };
  } catch (error) {
    console.error('Error accepting bet:', error);
    throw error;
  }
};

// New function to get bet details from Solana blockchain
export const fetchSolanaBet = async (onChainBetId: string): Promise<Bet | null> => {
  if (!onChainBetId) return null;
  
  try {
    return await getSolanaBetData(parseInt(onChainBetId));
  } catch (error) {
    console.error('Error fetching Solana bet:', error);
    return null;
  }
};
