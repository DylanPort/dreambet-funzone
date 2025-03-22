
// Types for PXB Points system
declare module '@/types/pxb' {
  interface PXBPointsContextType {
    userProfile: UserProfile | null;
    isLoading: boolean;
    error: Error | null;
    points: number;
    bets: PXBBet[];
    totalBets: number;
    wonBets: number;
    lostBets: number;
    pendingBets: number;
    winRate: number;
    fetchUserProfile: (walletAddress: string) => Promise<UserProfile | null>;
    fetchUserBets: () => Promise<void>;
    createBet: (betData: PXBBetCreateParams) => Promise<string | null>;
    refreshBets: () => Promise<void>;
  }
  
  interface UserProfile {
    id: string;
    username: string | null;
    wallet_address: string;
    points: number;
    created_at: string;
    updated_at: string;
    referral_code: string | null;
    referred_by: string | null;
  }
  
  interface PXBBet {
    id: string;
    userId: string;
    tokenId: string;
    tokenMint: string;
    tokenName: string;
    tokenSymbol: string;
    amount: number;
    betType: 'up' | 'down';
    percentageChange: number;
    targetPrice?: number;
    initialPrice?: number;
    initialMarketCap?: number;
    currentMarketCap?: number;
    status: 'pending' | 'won' | 'lost' | 'cancelled';
    expiresAt: string;
    createdAt: string;
    resolvedAt?: string;
  }
  
  interface PXBBetCreateParams {
    tokenId: string;
    tokenMint: string;
    tokenName: string;
    tokenSymbol: string;
    amount: number;
    betType: 'up' | 'down';
    percentageChange: number;
    initialMarketCap?: number;
  }

  interface LeaderboardEntry {
    id: string;
    username: string | null;
    wallet_address: string;
    points: number;
    bets_count: number;
    wins_count: number;
  }

  interface WinRateLeaderboardEntry {
    id: string;
    username: string | null;
    wallet_address: string;
    win_rate: number;
    bets_count: number;
    wins_count: number;
  }

  interface ReferralStats {
    total_referrals: number;
    points_earned: number;
    active_referrals: number;
  }

  interface Referral {
    id: string;
    referrer_id: string;
    referee_id: string;
    referee_username: string | null;
    referee_wallet: string;
    points_earned: number;
    created_at: string;
  }
}
