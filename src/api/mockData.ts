
import { Bet } from '@/types/bet';
import { 
  fetchTokens, 
  fetchOpenBets, 
  fetchUserBets, 
  createBet as createSupabaseBet, 
  acceptBet as acceptSupabaseBet,
  fetchTokenById
} from '@/services/supabaseService';

// This file now acts as a bridge between our existing UI and the new Supabase backend
// Eventually, all these functions should directly use the Supabase service

// Mock migrating tokens data (will be replaced with real data from Supabase)
export const migratingTokens = [
  {
    id: 'token1',
    name: 'PumpRocket',
    symbol: 'PUMP',
    logo: '🚀',
    currentPrice: 0.00452,
    change24h: 15.4,
    migrationTime: new Date().getTime() - 2 * 60 * 60 * 1000, // 2 hours ago
  },
  {
    id: 'token2',
    name: 'MoonShot',
    symbol: 'MOON',
    logo: '🌙',
    currentPrice: 0.00073,
    change24h: -8.2,
    migrationTime: new Date().getTime() - 20 * 60 * 1000, // 20 minutes ago
  },
  {
    id: 'token3',
    name: 'StarGaze',
    symbol: 'STAR',
    logo: '⭐',
    currentPrice: 0.0123,
    change24h: 32.1,
    migrationTime: new Date().getTime() - 45 * 60 * 1000, // 45 minutes ago
  },
  {
    id: 'token4',
    name: 'GalaxyDoge',
    symbol: 'GDOGE',
    logo: '🐕',
    currentPrice: 0.00002,
    change24h: -4.7,
    migrationTime: new Date().getTime() - 5 * 60 * 1000, // 5 minutes ago
  },
];

// Mock open bets (will be replaced with real data from Supabase)
export const mockBets: Bet[] = [
  {
    id: 'bet1',
    tokenId: 'token1',
    tokenName: 'PumpRocket',
    tokenSymbol: 'PUMP',
    initiator: '7XgPXKC3eVLPwMbTLdqLXg8uu9C5rQyPUFwXQ7szFKAJ',
    amount: 0.5,
    prediction: 'migrate',
    timestamp: new Date().getTime() - 30 * 60 * 1000,
    expiresAt: new Date().getTime() + 23.5 * 60 * 60 * 1000,
    status: 'open',
    duration: 60, // 1 hour in minutes
    initialMarketCap: 50000, // Example value
  },
  {
    id: 'bet2',
    tokenId: 'token2',
    tokenName: 'MoonShot',
    tokenSymbol: 'MOON',
    initiator: '3KNBs4dQpAdbZZv4shLTbzWcBSfH7Xw8eKvNKHVU2iej',
    amount: 1,
    prediction: 'die',
    timestamp: new Date().getTime() - 15 * 60 * 1000,
    expiresAt: new Date().getTime() + 23.75 * 60 * 60 * 1000,
    status: 'open',
    duration: 30, // 30 minutes
    initialMarketCap: 75000, // Example value
  },
  {
    id: 'bet3',
    tokenId: 'token3',
    tokenName: 'StarGaze',
    tokenSymbol: 'STAR',
    initiator: '7XgPXKC3eVLPwMbTLdqLXg8uu9C5rQyPUFwXQ7szFKAJ',
    counterParty: '3KNBs4dQpAdbZZv4shLTbzWcBSfH7Xw8eKvNKHVU2iej',
    amount: 2,
    prediction: 'migrate',
    timestamp: new Date().getTime() - 40 * 60 * 1000,
    expiresAt: new Date().getTime() + 20 * 60 * 1000,
    status: 'matched',
    initialPrice: 0.0115,
    duration: 15, // 15 minutes
    initialMarketCap: 125000, // Example value
  },
];

// API functions that now interface with Supabase
export const fetchMigratingTokens = async () => {
  try {
    const tokens = await fetchTokens();
    
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
    // Fallback to mock data for now
    return migratingTokens;
  }
};

export const fetchBetsByToken = async (tokenId: string) => {
  try {
    // This is a mock implementation until we have a proper API for this
    // In reality, we would query bets by token ID from Supabase
    return mockBets.filter(bet => bet.tokenId === tokenId);
  } catch (error) {
    console.error('Error fetching bets by token:', error);
    return [];
  }
};

// These functions now use Supabase
export const fetchOpenBetsWrapper = async () => {
  try {
    return await fetchOpenBets();
  } catch (error) {
    console.error('Error fetching open bets:', error);
    return mockBets.filter(bet => bet.status === 'open');
  }
};

export const fetchUserBetsWrapper = async (userAddress: string) => {
  try {
    return await fetchUserBets(userAddress);
  } catch (error) {
    console.error('Error fetching user bets:', error);
    // Fallback to mock data
    return mockBets.filter(
      bet => bet.initiator === userAddress || bet.counterParty === userAddress
    );
  }
};

export const createBetWrapper = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  initiator: string,
  amount: number,
  prediction: 'migrate' | 'die'
): Promise<Bet> => {
  try {
    // Use the Supabase service to create the bet
    // Note: tokenName and tokenSymbol are not needed as they're fetched from the database
    return await createSupabaseBet(tokenId, prediction, 60, amount); // Default 1 hour duration
  } catch (error) {
    console.error('Error creating bet:', error);
    // Fallback to creating a mock bet
    const newBet: Bet = {
      id: `bet${mockBets.length + 1}`,
      tokenId,
      tokenName,
      tokenSymbol,
      initiator,
      amount,
      prediction,
      timestamp: new Date().getTime(),
      expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours from now
      status: 'open',
      duration: 60, // Default 1 hour in minutes
    };
    
    mockBets.push(newBet);
    return newBet;
  }
};

export const acceptBetWrapper = async (
  betId: string,
  counterParty: string
): Promise<Bet> => {
  try {
    // Use the Supabase service to accept the bet
    return await acceptSupabaseBet(betId);
  } catch (error) {
    console.error('Error accepting bet:', error);
    // Fallback to mock implementation
    const betIndex = mockBets.findIndex(bet => bet.id === betId);
    if (betIndex === -1) throw new Error('Bet not found');
    
    const updatedBet = {
      ...mockBets[betIndex],
      counterParty,
      status: 'matched' as const,
      initialPrice: migratingTokens.find(token => token.id === mockBets[betIndex].tokenId)?.currentPrice,
    };
    
    mockBets[betIndex] = updatedBet;
    return updatedBet;
  }
};
