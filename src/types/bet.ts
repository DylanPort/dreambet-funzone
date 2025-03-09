
export type BetPrediction = 'up' | 'down';

export interface Bet {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  initiator: string;
  amount: number;
  prediction: BetPrediction;
  timestamp: number;
  expiresAt: number;
  status: 'open' | 'matched' | 'completed' | 'expired';
  counterParty?: string;
  winner?: string;
  initialPrice?: number;
  finalPrice?: number;
}
