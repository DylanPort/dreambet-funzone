import { Bet, BetPrediction } from '@/types/bet';
import { 
  fetchTokens as fetchSupabaseTokens, 
  fetchTokenById as fetchSupabaseTokenById 
} from '@/services/supabaseService';
import { createSolanaBet } from '@/services/solanaBetService';
import { toast } from '@/hooks/use-toast';

export const fetchMockTokens = async () => {
  // Simulate fetching tokens from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTokens = [
        {
          id: 'mock-token-1',
          name: 'MockToken1',
          symbol: 'MTK1',
          price: 0.001,
          priceChange: 0.05,
          timeRemaining: 30,
        },
        {
          id: 'mock-token-2',
          name: 'MockToken2',
          symbol: 'MTK2',
          price: 0.002,
          priceChange: -0.03,
          timeRemaining: 60,
        },
        {
          id: 'mock-token-3',
          name: 'MockToken3',
          symbol: 'MTK3',
          price: 0.003,
          priceChange: 0.10,
          timeRemaining: 120,
        },
      ];
      resolve(mockTokens);
    }, 500);
  });
};

export const fetchMockTokenById = async (id: string) => {
  // Simulate fetching a single token by ID from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = {
        id: id,
        name: `MockToken${id.split('-').pop()}`,
        symbol: `MTK${id.split('-').pop()}`,
        price: 0.001,
        priceChange: 0.05,
        timeRemaining: 30,
      };
      resolve(mockToken);
    }, 500);
  });
};

export const createMockBet = async (
  wallet: any,
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  prediction: BetPrediction,
  duration: number,
  amount: number
) => {
  console.log('Creating mock bet...');
  let betId = 0;
  let txSignature = '';
  
  if (!wallet) {
    toast({
      title: "Wallet Not Connected",
      description: "Please connect your wallet to create a bet.",
      variant: "destructive",
    });
    return null;
  }
  
  try {
    // Get token details for validation
    const token = await fetchSupabaseTokenById(tokenId);
    if (!token) {
      console.error(`Token not found: ${tokenId}`);
      toast({
        title: "Token Not Found",
        description: "The selected token could not be found.",
        variant: "destructive",
      });
      return null;
    }
    
    console.log('Creating bet with token:', token.token_name);
    
    // For development/testing: Create a bet on the blockchain (or simulated)
    try {
      const result = await createSolanaBet(
        wallet,
        tokenId,
        tokenName,
        tokenSymbol,
        prediction,
        duration,
        amount
      );
      betId = result.betId;
      txSignature = result.txSignature;
    } catch (error: any) {
      console.error('Error creating bet on blockchain:', error);
      toast({
        title: "Blockchain Error",
        description: error.message || "Failed to create bet on the blockchain.",
        variant: "destructive",
      });
      return null;
    }
    
    console.log(`Created bet with ID: ${betId}`);
    
    // Return the new bet object
    const newBet: Bet = {
      id: `local-${Date.now()}`,
      tokenId: tokenId,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      initiator: wallet.publicKey.toString(),
      amount: amount,
      prediction: prediction,
      timestamp: Date.now(),
      expiresAt: Date.now() + (duration * 60 * 1000),
      status: 'open',
      duration: duration,
      onChainBetId: betId.toString(),
      transactionSignature: txSignature
    };
    
    return newBet;
  } catch (error) {
    console.error('Error creating mock bet:', error);
    toast({
      title: "Error",
      description: "Failed to create bet. Please try again.",
      variant: "destructive",
    });
    return null;
  }
};

export const fetchMockBets = async () => {
  // Simulate fetching bets from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockBets = [
        {
          id: 'mock-bet-1',
          tokenId: 'mock-token-1',
          tokenName: 'MockToken1',
          tokenSymbol: 'MTK1',
          initiator: 'user123',
          amount: 1,
          prediction: 'up',
          timestamp: Date.now() - 3600000, // 1 hour ago
          expiresAt: Date.now() + 3600000, // 1 hour from now
          status: 'open',
          duration: 60,
          onChainBetId: '12345',
          transactionSignature: 'tx123',
        },
        {
          id: 'mock-bet-2',
          tokenId: 'mock-token-2',
          tokenName: 'MockToken2',
          tokenSymbol: 'MTK2',
          initiator: 'user456',
          amount: 0.5,
          prediction: 'down',
          timestamp: Date.now() - 7200000, // 2 hours ago
          expiresAt: Date.now() + 1800000, // 30 minutes from now
          status: 'open',
          duration: 90,
          onChainBetId: '67890',
          transactionSignature: 'tx456',
        },
        {
          id: 'mock-bet-3',
          tokenId: 'mock-token-3',
          tokenName: 'MockToken3',
          tokenSymbol: 'MTK3',
          initiator: 'user789',
          amount: 0.25,
          prediction: 'up',
          timestamp: Date.now() - 10800000, // 3 hours ago
          expiresAt: Date.now() - 1800000, // 30 minutes ago (expired)
          status: 'expired',
          duration: 120,
          onChainBetId: '13579',
          transactionSignature: 'tx789',
        },
      ];
      resolve(mockBets);
    }, 500);
  });
};
