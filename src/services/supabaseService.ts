
import { Bet } from '@/types/bet';

// Mock implementation for createBet since the real one is missing
export const createBet = async (bet: Partial<Bet>, publicKey: any, signTransaction: any) => {
  console.log('Mock createBet called with:', { bet, publicKey, signTransaction });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response
  return {
    id: 'mock-bet-id-' + Date.now(),
    ...bet,
    status: 'open',
    createdAt: Date.now(),
    transactionSignature: 'mock-transaction-signature',
  };
};

export const acceptBet = async (bet: Bet, publicKey: any) => {
  console.log('Mock acceptBet called with:', { bet, publicKey });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response
  return {
    ...bet,
    status: 'matched',
    counterParty: publicKey.toString(),
    updatedAt: Date.now(),
  };
};
