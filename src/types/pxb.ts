
export interface UserProfile {
  id: string;
  username: string;
  pxbPoints: number;
  reputation: number;
  createdAt: string;
}

export interface PXBBet {
  id: string;
  userId: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  betAmount: number;
  betType: 'up' | 'down';
  status: 'pending' | 'won' | 'lost';
  pointsWon: number;
  createdAt: string;
  expiresAt: string;
}
