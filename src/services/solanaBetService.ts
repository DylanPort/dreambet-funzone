
// Note: This is a mock implementation for the Solana bet service
// It will be replaced with actual Solana program integration

// Function to mock creating a bet on Solana
export const createSolanaBet = async (
  wallet: any,
  tokenMint: string,
  prediction: 'migrate' | 'die',
  duration: number, // in minutes
  amount: number
): Promise<{ betId: number, txSignature: string }> => {
  // Convert prediction to Solana program expected format
  const solPrediction = prediction === 'migrate' ? 'up' : 'down';
  
  console.log(`Creating Solana bet: token=${tokenMint}, prediction=${solPrediction}, duration=${duration}, amount=${amount}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a random bet ID and transaction signature
  const betId = Math.floor(Math.random() * 1000000);
  const txSignature = `mock_tx_${Date.now().toString(36)}`;
  
  console.log(`Mock Solana bet created: ID=${betId}, tx=${txSignature}`);
  return { betId, txSignature };
};

// Function to mock accepting a bet on Solana
export const acceptSolanaBet = async (
  wallet: any,
  betId: number
): Promise<{ txSignature: string }> => {
  console.log(`Accepting Solana bet: ID=${betId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a random transaction signature
  const txSignature = `mock_accept_tx_${Date.now().toString(36)}`;
  
  console.log(`Mock Solana bet accepted: tx=${txSignature}`);
  return { txSignature };
};

// Function to mock getting bet data from Solana
export const getSolanaBetData = async (betId: number) => {
  console.log(`Fetching Solana bet data: ID=${betId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Use consistent mock data based on bet ID
  const randomSeed = betId % 5;
  
  const tokenNames = ['Pump Token', 'Moon Coin', 'Rocket Finance', 'Dream DAO', 'Solana Fork'];
  const tokenSymbols = ['PUMP', 'MOON', 'RCKT', 'DREAM', 'SFORK'];
  const tokenMints = [
    'So11111111111111111111111111111111111111112',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs'
  ];
  
  const predictions: ('migrate' | 'die')[] = ['migrate', 'die', 'migrate', 'die', 'migrate'];
  const amounts = [1, 0.5, 2, 0.1, 5];
  const durations = [60, 120, 30, 180, 240]; // in minutes
  
  // Mock creator and counterparty addresses
  const creators = [
    'Hk6hRxnQzkbK8tGzLtKTAWvuQQQutJ9VYyNZQXUWTVVk',
    '8rRRcoRGBBiKLNYAkR9mWtyQmJUZjMPm1yPM9vVPRU9h',
    'G5SgQKMnxFRkxY5KBhKixNHmzxXJgqyx2iVLXkXEqtiJ',
    '9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g',
    'GK2zqSsXLA2rwVZk347RYhh6jJpRsCA69FjLW93ZGi3B'
  ];
  
  const counterParties = [
    '3YVfCzem8Z4VuZxA8xXpgcc9JqUP9ucBqnrMzg2Kd6AS',
    'JBCwMWBGBE8XrGMXFYbKTe1sH54QYtpcqXiodXvX7t1h',
    '2pGEG6MwRxrZW3jwgMhQmT8kZzWr9M3N431aQ9v9HdRh',
    'FfHZBJX8c5Y7XCCnYcDWLbJxKNVZdRzEqRAt3g1LpzWY',
    'Cey6KidGrFZqL7yRSBtTYfGUfXAd2rhRqrQNTQzto1de'
  ];
  
  // Create a deterministic timestamp based on bet ID
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const timestamp = now - (betId % 5) * oneDay;
  
  // Create expiry time based on timestamp and duration
  const expiresAt = timestamp + durations[randomSeed] * 60 * 1000;
  
  return {
    id: `mock-solana-${betId}`,
    tokenId: tokenMints[randomSeed],
    tokenName: tokenNames[randomSeed],
    tokenSymbol: tokenSymbols[randomSeed],
    initiator: creators[randomSeed],
    amount: amounts[randomSeed],
    points_amount: amounts[randomSeed] * 10, // Convert SOL to points with a 10x multiplier
    prediction: predictions[randomSeed],
    timestamp,
    expiresAt,
    status: 'open' as const,
    duration: durations[randomSeed],
    counterParty: Math.random() > 0.5 ? counterParties[randomSeed] : undefined,
    onChainBetId: betId.toString(),
    transactionSignature: `mock_tx_${betId}_${Date.now().toString(36)}`
  };
};
