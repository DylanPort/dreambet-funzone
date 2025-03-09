
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
  wallet: any,
  duration: number = 60 // Default to 60 minutes if not provided
): Promise<Bet> => {
  try {
    console.log(`Creating bet with tokenId=${tokenId}, amount=${amount}, prediction=${prediction}, duration=${duration}`);
    
    // Create bet on Solana blockchain first
    const { betId } = await createSolanaBet(
      wallet,
      tokenId,
      prediction,
      duration,
      amount
    );
    
    console.log(`Solana bet created with ID: ${betId}`);
    
    // Then create in Supabase for our frontend
    const bet = await createSupabaseBet(
      tokenId, 
      prediction, 
      duration, 
      amount, 
      betId.toString()
    );
    
    console.log(`Supabase bet created: ${bet.id}`);
    
    // Return complete bet object
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
  bet: Bet,
  counterParty: string,
  wallet: any
): Promise<Bet> => {
  try {
    console.log(`Accepting bet: ${bet.id}, onChainBetId: ${bet.onChainBetId}`);
    
    // Accept on Solana blockchain first
    if (bet.onChainBetId) {
      await acceptSolanaBet(wallet, parseInt(bet.onChainBetId));
      console.log(`Solana bet accepted: ${bet.onChainBetId}`);
    } else {
      throw new Error("Missing on-chain bet ID");
    }
    
    // Then update in Supabase for our frontend
    const updatedBet = await acceptSupabaseBet(bet.id);
    console.log(`Supabase bet updated: ${updatedBet.id}`);
    
    // Ensure the status is one of the allowed types
    return {
      ...updatedBet,
      status: updatedBet.status as "open" | "matched" | "completed" | "expired" | "closed"
    };
  } catch (error) {
    console.error('Error accepting bet:', error);
    throw error;
  }
};

// Fetch bet details from Solana blockchain
export const fetchSolanaBet = async (onChainBetId: string): Promise<Bet | null> => {
  if (!onChainBetId) return null;
  
  try {
    console.log(`Fetching Solana bet data for ID: ${onChainBetId}`);
    return await getSolanaBetData(parseInt(onChainBetId));
  } catch (error) {
    console.error('Error fetching Solana bet:', error);
    return null;
  }
};
