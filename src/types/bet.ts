
export type BetPrediction = 'moon' | 'die' | 'migrate' | 'buy' | 'sell';
export type BetStatus = 'open' | 'matched' | 'pending' | 'completed' | 'cancelled' | 'expired';

export interface Bet {
  id: string;
  tokenId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  initiator: string;
  counterParty?: string;
  amount: number;
  prediction: BetPrediction;
  timestamp: number;
  expiresAt: number;
  status: BetStatus;
  duration: number;
  initialMarketCap?: number;
  currentMarketCap?: number;
  percentageChange?: number;
  onChainBetId?: string;
  transactionSignature?: string;
  outcome?: 'win' | 'loss';
  pointsWon?: number;
}
