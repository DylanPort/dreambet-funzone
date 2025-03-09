
export type BetPrediction = 'migrate' | 'die';

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
  duration: number; // in minutes
  initialMarketCap?: number; // needed for payout calculations
}

export interface Token {
  token_mint: string;
  token_name: string;
  token_symbol: string;
  current_market_cap: number;
  initial_market_cap?: number;
  total_supply: number;
  last_trade_price: number;
  created_on?: string;
  last_updated_time: string;
}
