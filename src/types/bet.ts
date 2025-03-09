
export interface Bet {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  initiator: string;
  counterParty?: string;
  amount: number;
  prediction: 'migrate' | 'die';
  timestamp: number;
  expiresAt: number;
  status: 'open' | 'matched' | 'completed' | 'expired';
  initialMarketCap?: number;
  duration: number;
}
