
export type BetPrediction = 'migrate' | 'die';
export type BetStatus = 'open' | 'matched' | 'completed' | 'expired' | 'closed';

export interface Bet {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  initiator: string;
  amount?: number; // Solana amount (legacy)
  points_amount: number; // New PXB Points amount
  prediction: BetPrediction;
  timestamp: number;
  expiresAt: number;
  status: BetStatus;
  duration?: number; // in minutes
  counterParty?: string;
  winner?: string;
  onChainBetId?: string;
  transactionSignature?: string;
  initialMarketCap?: number; // Add missing property
}

export interface BetResults {
  won: number;
  lost: number;
  open: number;
  total: number;
  winRate: number;
}
