import { Bet } from '@/types/bet';
import { fetchTrendingTokensFromApify } from '@/services/apifyService';

export const fetchTrendingBets = async (): Promise<Bet[]> => {
  // Mock data for trending bets
  const trendingBets: Bet[] = [
    {
      id: '1',
      tokenId: '1',
      tokenMint: 'EPjFWdd5AufqALUs2vL433mW813sgCpG45GRm1CaWvgP',
      tokenName: 'Wrapped SOL',
      tokenSymbol: 'SOL',
      initiator: 'wallet1',
      amount: 10,
      prediction: 'migrate',
      timestamp: Date.now() - 86400000, // 24 hours ago
      expiresAt: Date.now() + 3600000, // Expires in 1 hour
      status: 'open',
      duration: 24,
      initialMarketCap: 500000000,
      currentMarketCap: 550000000,
      percentageChange: 10,
      onChainBetId: '12345',
      transactionSignature: 'signature1'
    },
    {
      id: '2',
      tokenId: '2',
      tokenMint: 'Es9xMvGepamkVMwnwQingv5FG6gES24vQLgJv7Ve8fEX',
      tokenName: 'Bonk',
      tokenSymbol: 'BONK',
      initiator: 'wallet2',
      amount: 5,
      prediction: 'die',
      timestamp: Date.now() - 43200000, // 12 hours ago
      expiresAt: Date.now() + 1800000, // Expires in 30 minutes
      status: 'matched',
      duration: 24,
      initialMarketCap: 25000000,
      currentMarketCap: 20000000,
      percentageChange: -20,
      onChainBetId: '67890',
      transactionSignature: 'signature2'
    },
    {
      id: '3',
      tokenId: '3',
      tokenMint: '7xKXtg2CWj7X5EcQnFcYpEkzgczdVsLMnA8jYwiA9W6P',
      tokenName: 'Dogwifhat',
      tokenSymbol: 'WIF',
      initiator: 'wallet3',
      amount: 8,
      prediction: 'migrate',
      timestamp: Date.now() - 21600000, // 6 hours ago
      expiresAt: Date.now() + 7200000, // Expires in 2 hours
      status: 'completed',
      duration: 24,
      initialMarketCap: 100000000,
      currentMarketCap: 110000000,
      percentageChange: 10,
      onChainBetId: 'abcde',
      transactionSignature: 'signature3'
    },
    {
      id: '4',
      tokenId: '4',
      tokenMint: 'DezXAZ8z7PnzjzU6zUq6z5MumWNWMLrqv7nJphXXvnEH',
      tokenName: 'Popcat',
      tokenSymbol: 'POPCAT',
      initiator: 'wallet4',
      amount: 3,
      prediction: 'die',
      timestamp: Date.now() - 10800000, // 3 hours ago
      expiresAt: Date.now() + 3600000, // Expires in 1 hour
      status: 'expired',
      duration: 24,
      initialMarketCap: 5000000,
      currentMarketCap: 4000000,
      percentageChange: -20,
      onChainBetId: 'fghij',
      transactionSignature: 'signature4'
    },
    {
      id: '5',
      tokenId: '5',
      tokenMint: 'mSoLzYCxHdYgdzU16g5QShvWztf3zQz4tigerVHyjojv6KrtnnzU6zUq6z5MumWNWMLrqv7nJphXXvnEH',
      tokenName: 'Marinade Staked SOL',
      tokenSymbol: 'mSOL',
      initiator: 'wallet5',
      amount: 12,
      prediction: 'migrate',
      timestamp: Date.now() - 5400000, // 1.5 hours ago
      expiresAt: Date.now() + 1800000, // Expires in 30 minutes
      status: 'open',
      duration: 24,
      initialMarketCap: 750000000,
      currentMarketCap: 825000000,
      percentageChange: 10,
      onChainBetId: 'klmno',
      transactionSignature: 'signature5'
    },
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return trendingBets;
};

export const fetchTokenDetails = async (tokenId: string) => {
  try {
    // Try to get real data from Apify first
    const trendingTokens = await fetchTrendingTokensFromApify();
    const token = trendingTokens.find(t => t.address === tokenId);
    
    if (token) {
      return {
        name: token.name,
        symbol: token.symbol,
        price: token.priceUsd,
        volume: token.volume24h,
        change: token.priceChange24h,
      };
    }
  } catch (error) {
    console.error('Error fetching token details from Apify:', error);
  }

  // Fallback to mock data if Apify fails or token not found
  const tokenDetails = {
    '1': {
      name: 'Wrapped SOL',
      symbol: 'SOL',
      price: 190,
      volume: 1000000,
      change: 5.2,
    },
    '2': {
      name: 'Bonk',
      symbol: 'BONK',
      price: 0.00002,
      volume: 50000000,
      change: -8.5,
    },
    '3': {
      name: 'Dogwifhat',
      symbol: 'WIF',
      price: 3.10,
      volume: 7500000,
      change: 12.3,
    },
    '4': {
      name: 'Popcat',
      symbol: 'POPCAT',
      price: 0.05,
      volume: 2000000,
      change: -2.0,
    },
    '5': {
      name: 'Marinade Staked SOL',
      symbol: 'mSOL',
      price: 195.50,
      volume: 3000000,
      change: 2.8,
    },
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return tokenDetails[tokenId] || null;
};

export const fetchUserBets = async (walletAddress: string): Promise<Bet[]> => {
  console.log(`Fetching bets for wallet: ${walletAddress}`);
  
  // Mock data - in a real application this would be fetched from an API
  const userBets: Bet[] = [
    {
      id: 'user-1',
      tokenId: '1',
      tokenMint: 'EPjFWdd5AufqALUs2vL433mW813sgCpG45GRm1CaWvgP',
      tokenName: 'Wrapped SOL',
      tokenSymbol: 'SOL',
      initiator: walletAddress,
      amount: 5,
      prediction: 'buy',
      timestamp: Date.now() - 72000000, // 20 hours ago
      expiresAt: Date.now() + 18000000, // Expires in 5 hours
      status: 'open',
      duration: 24,
      initialMarketCap: 500000000,
      currentMarketCap: 520000000,
      percentageChange: 4,
      onChainBetId: 'user-bet-1',
      transactionSignature: 'user-tx-1'
    },
    {
      id: 'user-2',
      tokenId: '3',
      tokenMint: '7xKXtg2CWj7X5EcQnFcYpEkzgczdVsLMnA8jYwiA9W6P',
      tokenName: 'Dogwifhat',
      tokenSymbol: 'WIF',
      initiator: walletAddress,
      amount: 2,
      prediction: 'sell',
      timestamp: Date.now() - 36000000, // 10 hours ago
      expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      status: 'completed',
      duration: 8,
      initialMarketCap: 100000000,
      currentMarketCap: 95000000,
      percentageChange: -5,
      onChainBetId: 'user-bet-2',
      transactionSignature: 'user-tx-2',
      outcome: 'win'
    }
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return userBets;
};

export const fetchMigratingTokens = async () => {
  const tokens = [
    {
      id: '1',
      name: 'Wrapped SOL',
      symbol: 'SOL',
      logo: '☀️',
      currentPrice: 190.25,
      change24h: 5.2,
      migrationTime: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: '2',
      name: 'Bonk',
      symbol: 'BONK',
      logo: '🐕',
      currentPrice: 0.00002,
      change24h: -8.5,
      migrationTime: Date.now() - 7200000 // 2 hours ago
    },
    {
      id: '3',
      name: 'Dogwifhat',
      symbol: 'WIF',
      logo: '🐶',
      currentPrice: 3.10,
      change24h: 12.3,
      migrationTime: Date.now() - 1800000 // 30 minutes ago
    },
    {
      id: '4',
      name: 'Popcat',
      symbol: 'POPCAT',
      logo: '🐱',
      currentPrice: 0.05,
      change24h: -2.0,
      migrationTime: Date.now() - 5400000 // 1.5 hours ago
    },
    {
      id: '5',
      name: 'Marinade Staked SOL',
      symbol: 'mSOL',
      logo: '☀️',
      currentPrice: 195.50,
      change24h: 2.8,
      migrationTime: Date.now() - 900000 // 15 minutes ago
    }
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return tokens;
};

export const fetchBetsByToken = async (tokenId: string): Promise<Bet[]> => {
  console.log(`Fetching bets for token: ${tokenId}`);
  
  // Filter the trending bets to only include bets for the specified token
  const trendingBets = await fetchTrendingBets();
  const tokenBets = trendingBets.filter(bet => bet.tokenId === tokenId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return tokenBets;
};

export const acceptBet = async (bet: Bet, counterPartyAddress: string, wallet: any): Promise<Bet> => {
  console.log(`Accepting bet ${bet.id} by ${counterPartyAddress}`);
  
  // Simulate blockchain transaction delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return the updated bet with the counter party
  const updatedBet: Bet = {
    ...bet,
    counterParty: counterPartyAddress,
    status: 'matched'
  };
  
  // Dispatch a custom event to notify other components
  const betAcceptedEvent = new CustomEvent('betAccepted', { 
    detail: { 
      betId: bet.id,
      counterParty: counterPartyAddress
    } 
  });
  
  window.dispatchEvent(betAcceptedEvent);
  
  return updatedBet;
};
