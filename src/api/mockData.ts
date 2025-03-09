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
import { toast } from '@/hooks/use-toast';

const FALLBACK_BETS_KEY = 'pumpxbounty_fallback_bets';

const storeFallbackBet = (bet: Bet) => {
  try {
    const storedBets = localStorage.getItem(FALLBACK_BETS_KEY);
    let bets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
    
    const exists = bets.some(
      existingBet => existingBet.id === bet.id || 
      (existingBet.onChainBetId && bet.onChainBetId && existingBet.onChainBetId === bet.onChainBetId)
    );
    
    if (!exists) {
      bets.push(bet);
      localStorage.setItem(FALLBACK_BETS_KEY, JSON.stringify(bets));
      console.log("Stored fallback bet:", bet);
    }
  } catch (error) {
    console.error("Error storing fallback bet:", error);
  }
};

const getFallbackBets = (): Bet[] => {
  try {
    const storedBets = localStorage.getItem(FALLBACK_BETS_KEY);
    if (storedBets) {
      const bets: Bet[] = JSON.parse(storedBets);
      
      const now = Date.now();
      return bets.filter(bet => bet.expiresAt > now);
    }
  } catch (error) {
    console.error("Error getting fallback bets:", error);
  }
  return [];
};

export const fetchMigratingTokens = async () => {
  try {
    const tokens = await fetchSupabaseTokens();
    
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
    const openBets = await fetchSupabaseOpenBets();
    const filteredBets = openBets.filter(bet => bet.tokenId === tokenId);
    
    const fallbackBets = getFallbackBets().filter(bet => bet.tokenId === tokenId);
    
    const allBets = [...filteredBets];
    
    for (const fallbackBet of fallbackBets) {
      const exists = allBets.some(
        bet => bet.id === fallbackBet.id || 
        (bet.onChainBetId && fallbackBet.onChainBetId && bet.onChainBetId === fallbackBet.onChainBetId)
      );
      
      if (!exists) {
        allBets.push(fallbackBet);
      }
    }
    
    return allBets.map(bet => ({
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    }));
  } catch (error) {
    console.error('Error fetching bets by token:', error);
    return getFallbackBets().filter(bet => bet.tokenId === tokenId);
  }
};

export const fetchOpenBets = async (): Promise<Bet[]> => {
  try {
    console.log('Fetching open bets from Supabase...');
    const bets = await fetchSupabaseOpenBets();
    console.log('Retrieved bets from Supabase:', bets);
    
    const fallbackBets = getFallbackBets();
    console.log('Fallback bets from localStorage:', fallbackBets);
    
    const allBets = [...bets];
    
    for (const fallbackBet of fallbackBets) {
      const exists = allBets.some(
        bet => bet.id === fallbackBet.id || 
        (bet.onChainBetId && fallbackBet.onChainBetId && bet.onChainBetId === fallbackBet.onChainBetId)
      );
      
      if (!exists) {
        allBets.push(fallbackBet);
      }
    }
    
    console.log('Final combined bets:', allBets);
    
    return allBets.map(bet => ({
      ...bet,
      status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
    }));
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return getFallbackBets();
  }
};

export const fetchUserBets = async (userAddress: string): Promise<Bet[]> => {
  try {
    const bets = await fetchSupabaseUserBets(userAddress);
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
    
    if (!wallet) {
      console.error("Wallet object is null or undefined");
      throw new Error("Wallet not connected. Please connect your wallet and try again.");
    }
    
    const walletAdapter = wallet.adapter;
    const adapterConnected = walletAdapter?.connected || false;
    const adapterPublicKey = walletAdapter?.publicKey;
    const walletPublicKey = wallet.publicKey;
    
    console.log("Detailed wallet status:", {
      hasAdapter: !!walletAdapter,
      adapterConnected,
      hasAdapterPublicKey: !!adapterPublicKey,
      adapterPublicKeyString: adapterPublicKey?.toString(),
      hasWalletPublicKey: !!walletPublicKey,
      walletPublicKeyString: walletPublicKey?.toString()
    });
    
    const effectivePublicKey = walletPublicKey || adapterPublicKey;
    
    if (!effectivePublicKey) {
      console.error("No public key found in wallet or adapter");
      throw new Error("Wallet connection issue: No public key found. Please reconnect your wallet.");
    }
    
    console.log(`Initiating Solana transaction on Devnet...`);
    
    let betId;
    try {
      const result = await createSolanaBet(
        wallet,
        tokenId,
        prediction,
        duration,
        amount
      );
      betId = result.betId;
      console.log(`Solana bet created with ID: ${betId}`);
      
      toast({
        title: `New ${prediction.toUpperCase()} Bet Created!`,
        description: `${amount} SOL bet on ${tokenSymbol || 'token'} is now active for ${duration} minutes`,
      });
    } catch (solanaBetError: any) {
      console.error("Error creating bet on Solana:", solanaBetError);
      if (solanaBetError.message && solanaBetError.message.includes("'emit'")) {
        throw new Error("Wallet adapter error: Please refresh the page and reconnect your wallet.");
      }
      throw solanaBetError;
    }
    
    const fallbackBet: Bet = {
      id: `local-${Date.now()}`,
      tokenId,
      tokenName,
      tokenSymbol,
      initiator: effectivePublicKey.toString(),
      amount,
      prediction,
      timestamp: Date.now(),
      expiresAt: Date.now() + (duration * 60 * 1000),
      status: "open",
      duration,
      onChainBetId: betId.toString()
    };
    
    storeFallbackBet(fallbackBet);
    
    const eventData = {
      amount,
      prediction,
      tokenId,
      tokenName,
      tokenSymbol,
      bet: fallbackBet
    };
    
    try {
      const event = new CustomEvent('newBetCreated', { detail: eventData });
      window.dispatchEvent(event);
      console.log("Dispatched newBetCreated event:", eventData);
    } catch (eventError) {
      console.error("Error dispatching newBetCreated event:", eventError);
    }
    
    try {
      const bet = await createSupabaseBet(
        tokenId, 
        prediction, 
        duration, 
        amount
      );
      
      console.log(`Supabase bet created: ${bet.id}`);
      
      return {
        ...bet,
        onChainBetId: betId.toString(),
        status: bet.status as "open" | "matched" | "completed" | "expired" | "closed"
      };
    } catch (supabaseError) {
      console.warn("Failed to create bet in Supabase, using fallback data:", supabaseError);
      
      return fallbackBet;
    }
  } catch (error: any) {
    console.error('Error creating bet:', error);
    
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
    
    if (!wallet || !wallet.publicKey) {
      console.error("Wallet not properly connected - missing publicKey");
      throw new Error("Wallet not properly connected. Please reconnect your wallet.");
    }
    
    if (!wallet.signTransaction || !wallet.signAllTransactions) {
      console.error("Wallet missing required signing capabilities");
      throw new Error("Your wallet doesn't support the required signing methods.");
    }
    
    if (bet.onChainBetId) {
      await acceptSolanaBet(wallet, parseInt(bet.onChainBetId));
      console.log(`Solana bet accepted: ${bet.onChainBetId}`);
      
      toast({
        title: "Bet Accepted!",
        description: `A ${bet.amount} SOL bet on ${bet.tokenSymbol || 'a token'} is now active!`,
      });
    } else {
      throw new Error("Missing on-chain bet ID");
    }
    
    const updatedBet = await acceptSupabaseBet(bet.id);
    console.log(`Supabase bet updated: ${updatedBet.id}`);
    
    return {
      ...updatedBet,
      status: updatedBet.status as "open" | "matched" | "completed" | "expired" | "closed"
    };
  } catch (error) {
    console.error('Error accepting bet:', error);
    throw error;
  }
};

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
