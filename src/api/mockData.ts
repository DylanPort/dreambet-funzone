
import { Bet } from '@/types/bet';

// Mock migrating tokens data
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

// Mock open bets
export const mockBets: Bet[] = [
  {
    id: 'bet1',
    tokenId: 'token1',
    tokenName: 'PumpRocket',
    tokenSymbol: 'PUMP',
    initiator: '7XgPXKC3eVLPwMbTLdqLXg8uu9C5rQyPUFwXQ7szFKAJ',
    amount: 0.5,
    prediction: 'up',
    timestamp: new Date().getTime() - 30 * 60 * 1000,
    expiresAt: new Date().getTime() + 23.5 * 60 * 60 * 1000,
    status: 'open',
  },
  {
    id: 'bet2',
    tokenId: 'token2',
    tokenName: 'MoonShot',
    tokenSymbol: 'MOON',
    initiator: '3KNBs4dQpAdbZZv4shLTbzWcBSfH7Xw8eKvNKHVU2iej',
    amount: 1,
    prediction: 'down',
    timestamp: new Date().getTime() - 15 * 60 * 1000,
    expiresAt: new Date().getTime() + 23.75 * 60 * 60 * 1000,
    status: 'open',
  },
  {
    id: 'bet3',
    tokenId: 'token3',
    tokenName: 'StarGaze',
    tokenSymbol: 'STAR',
    initiator: '7XgPXKC3eVLPwMbTLdqLXg8uu9C5rQyPUFwXQ7szFKAJ',
    counterParty: '3KNBs4dQpAdbZZv4shLTbzWcBSfH7Xw8eKvNKHVU2iej',
    amount: 2,
    prediction: 'up',
    timestamp: new Date().getTime() - 40 * 60 * 1000,
    expiresAt: new Date().getTime() + 20 * 60 * 1000,
    status: 'matched',
    initialPrice: 0.0115,
  },
];

// Mock API functions
let bets = [...mockBets];

export const fetchMigratingTokens = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return migratingTokens;
};

export const fetchOpenBets = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return bets.filter(bet => bet.status === 'open');
};

export const fetchBetsByToken = async (tokenId: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return bets.filter(bet => bet.tokenId === tokenId);
};

export const fetchUserBets = async (userAddress: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return bets.filter(
    bet => bet.initiator === userAddress || bet.counterParty === userAddress
  );
};

export const createBet = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  initiator: string,
  amount: number,
  prediction: 'up' | 'down'
): Promise<Bet> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newBet: Bet = {
    id: `bet${bets.length + 1}`,
    tokenId,
    tokenName,
    tokenSymbol,
    initiator,
    amount,
    prediction,
    timestamp: new Date().getTime(),
    expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours from now
    status: 'open',
  };
  
  bets = [...bets, newBet];
  return newBet;
};

export const acceptBet = async (
  betId: string,
  counterParty: string
): Promise<Bet> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const betIndex = bets.findIndex(bet => bet.id === betId);
  if (betIndex === -1) throw new Error('Bet not found');
  
  const updatedBet = {
    ...bets[betIndex],
    counterParty,
    status: 'matched' as const,
    initialPrice: migratingTokens.find(token => token.id === bets[betIndex].tokenId)?.currentPrice,
  };
  
  bets = [
    ...bets.slice(0, betIndex),
    updatedBet,
    ...bets.slice(betIndex + 1),
  ];
  
  return updatedBet;
};
