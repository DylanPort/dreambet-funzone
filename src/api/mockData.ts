import { Bet } from '@/types/bet';

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
  // Mock data for token details
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
