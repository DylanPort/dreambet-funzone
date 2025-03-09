
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
    console.log(`Using Devnet for transaction`);
    
    // Improved, more thorough wallet validation
    if (!wallet) {
      console.error("Wallet object is null or undefined");
      throw new Error("Wallet not connected. Please connect your wallet and try again.");
    }
    
    if (!wallet.publicKey) {
      console.error("Wallet not properly connected - missing publicKey");
      throw new Error("Wallet not properly connected. Please reconnect your wallet.");
    }
    
    // Check that the wallet adapter is also properly connected
    if (!wallet.adapter || !wallet.adapter.publicKey) {
      console.error("Wallet adapter not properly initialized");
      throw new Error("Wallet adapter not ready. Please refresh the page and try again.");
    }
    
    // Check that public keys match - critical for proper wallet operation
    if (wallet.adapter.publicKey.toString() !== wallet.publicKey.toString()) {
      console.error("Public key mismatch between wallet adapter and wallet connection");
      console.error(`Adapter: ${wallet.adapter.publicKey.toString()}`);
      console.error(`Wallet: ${wallet.publicKey.toString()}`);
      throw new Error("Wallet connection issue detected. Please disconnect and reconnect your wallet.");
    }
    
    // Verify wallet has needed signing capabilities
    if (!wallet.signTransaction || !wallet.signAllTransactions) {
      console.error("Wallet missing required signing capabilities");
      throw new Error("Your wallet doesn't support the required signing methods.");
    }
    
    // Extra validation check for adapter connection status
    if (!wallet.adapter.connected) {
      console.error("Wallet adapter shows as disconnected");
      throw new Error("Wallet appears disconnected. Please reconnect your wallet and try again.");
    }
    
    // Check that publicKey can be accessed as a safety check
    try {
      const publicKeyString = wallet.publicKey.toString();
      console.log(`Wallet public key verified: ${publicKeyString.slice(0, 8)}...`);
    } catch (keyError) {
      console.error("Failed to access wallet public key:", keyError);
      throw new Error("Could not access wallet public key. Please try reconnecting your wallet.");
    }
    
    // Create bet on Solana blockchain first
    console.log("Wallet adapter ready:", wallet.adapter?.publicKey ? "Yes" : "No");
    console.log("Initiating Solana transaction on Devnet...");
    
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
      amount
    );
    
    console.log(`Supabase bet created: ${bet.id}`);
    
    // Return complete bet object
    return {
      ...bet,
      onChainBetId: betId.toString(),
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    };
  } catch (error: any) {
    console.error('Error creating bet:', error);
    
    // Enhanced error reporting for Devnet
    if (error.name === 'WalletSignTransactionError') {
      throw new Error("Transaction signing failed. Please check your wallet connection.");
    } else if (error.name === 'WalletNotConnectedError') {
      throw new Error("Wallet not connected. Please reconnect your wallet.");
    } else if (error.message?.includes('User rejected')) {
      throw new Error("Transaction rejected. Please approve the transaction in your wallet.");
    } else if (error.message?.includes('Blockhash not found')) {
      throw new Error("Network error: Blockhash not found. Devnet may be experiencing issues, please try again.");
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error("Insufficient funds in your Devnet wallet. Please request SOL from the Devnet faucet.");
    }
    
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
    
    // Enhanced wallet validation
    if (!wallet || !wallet.publicKey) {
      console.error("Wallet not properly connected - missing publicKey");
      throw new Error("Wallet not properly connected. Please reconnect your wallet.");
    }
    
    if (!wallet.signTransaction || !wallet.signAllTransactions) {
      console.error("Wallet missing required signing capabilities");
      throw new Error("Your wallet doesn't support the required signing methods.");
    }
    
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
