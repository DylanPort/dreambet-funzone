
export type BetPrediction = 'migrate' | 'die' | 'moon' | 'up' | 'down';

export type BetStatus = 'open' | 'matched' | 'completed' | 'expired' | 'closed';

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
  status: BetStatus;
  initialMarketCap?: number;
  duration: number;
  winner?: string;
  onChainBetId: string; // Changed from optional to required
  transactionSignature: string; // Changed from optional to required
}

// Smart contract state types to match the Rust program
export enum SolanaContractPrediction {
  Migrate = 0,
  Die = 1,
  Up = 2,
  Down = 3,
}

export enum SolanaContractStatus {
  Open = 0,
  Confirmed = 1,
  Closed = 2,
  Resolved = 3,
  Expired = 4,
}

export interface SolanaBetData {
  betId: number;
  tokenMint: string;
  bettor1: string;
  bettor2: string | null;
  predictionBettor1: SolanaContractPrediction;
  duration: number;
  creationTime: number;
  startTime: number;
  endTime: number;
  initialMarketCap: number;
  solAmount: number;
  status: SolanaContractStatus;
}
