
import { Bet } from '@/types/bet';
import { 
  fetchTokens as fetchSupabaseTokens, 
  fetchOpenBets as fetchSupabaseOpenBets, 
  fetchUserBets as fetchSupabaseUserBets, 
  createBet as createSupabaseBet, 
  acceptBet as acceptSupabaseBet,
  fetchTokenById
} from '@/services/supabaseService';

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

export const fetchBetsByToken = async (tokenId: string) => {
  try {
    // Query bets by token ID from Supabase
    const openBets = await fetchSupabaseOpenBets();
    return openBets.filter(bet => bet.tokenId === tokenId);
  } catch (error) {
    console.error('Error fetching bets by token:', error);
    return [];
  }
};

// Export wrapper functions that use Supabase services
export const fetchOpenBets = async () => {
  try {
    return await fetchSupabaseOpenBets();
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return [];
  }
};

export const fetchUserBets = async (userAddress: string) => {
  try {
    return await fetchSupabaseUserBets(userAddress);
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
  prediction: 'migrate' | 'die'
): Promise<Bet> => {
  try {
    // Use the Supabase service to create the bet
    return await createSupabaseBet(tokenId, prediction, 60, amount); // Default 1 hour duration
  } catch (error) {
    console.error('Error creating bet:', error);
    throw error; // Don't create mock bets, just throw the error
  }
};

export const acceptBet = async (
  betId: string,
  counterParty: string
): Promise<Bet> => {
  try {
    // Use the Supabase service to accept the bet
    return await acceptSupabaseBet(betId);
  } catch (error) {
    console.error('Error accepting bet:', error);
    throw error; // Don't use mock, just throw the error
  }
};
