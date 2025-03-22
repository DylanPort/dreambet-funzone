
export interface UserProfile {
  id: string;
  pxb_id: string;
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  created_at: string;
  updated_at: string;
  twitter_username: string | null;
  instagram_username: string | null;
  website_url: string | null;
  bio: string | null;
}

export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: "up" | "down";
  percentageChange: number;
  status: "open" | "pending" | "won" | "lost";
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
  initialMarketCap: number | null;
  currentMarketCap: number | null;
  userRole: 'creator' | 'participant';
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
}

export interface WinRateLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_bets: number;
  won_bets: number;
  win_rate: number;
  rank: number;
}

export interface ReferralStats {
  referrals_count: number;
  points_earned: number;
  referral_code: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
  points_awarded: number;
}
