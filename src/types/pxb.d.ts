// Define the PXB types
export interface PXBBet {
  id: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betType: 'up' | 'down'; // Direction of the bet
  creator: string;
  status: 'open' | 'pending' | 'won' | 'lost' | 'expired'; // Status of the bet
  createdAt: string; // ISO date string
  resolvedAt?: string; // ISO date string, when the bet was resolved
  amount: number; // Amount of PXB tokens
  initialMarketCap: number | null;
  percentageChange: number;
  timeframe?: number; // Timeframe in minutes
  currentMarketCap?: number | null;
}

export interface LeaderboardEntry {
  wallet: string;
  points: number;
  betsWon: number;
  betsLost: number;
  rank: number;
}

export interface WinRateLeaderboardEntry {
  wallet: string;
  winRate: number;
  betsWon: number;
  betsLost: number;
  rank: number;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pointsEarned: number;
}

export interface Referral {
  referrer: string;
  referee: string;
  date: string;
  status: 'active' | 'inactive';
  pointsEarned: number;
}
