
export type BetPrediction = 'migrate' | 'die';

export interface Bet {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  initiator: string;
  counterParty?: string;
  amount: number;
  prediction: BetPrediction;
  timestamp: number;
  expiresAt: number;
  status: 'open' | 'matched' | 'completed' | 'expired';
  initialMarketCap?: number;
  duration: number;
  winner?: string; // Adding winner property
}
