// This file is kept for backward compatibility
// It re-exports all functionality from the new modular structure
export { PXBPointsProvider, usePXBPoints } from './pxb/PXBPointsContext';

export interface UserContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  pointsBalance: number;
  refreshPoints: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  createTemporaryProfile: () => Promise<UserProfile>;
  stakePoints: (amount: number) => Promise<boolean>;
  unstakePoints: (amount: number) => Promise<boolean>;
  stakedPoints: number;
  stakingRewards: number;
  claimStakingRewards: () => Promise<boolean>;
  isStakingEnabled: boolean;
  connectWallet: () => Promise<void>;
  calculateStakingReward: (amount: number, days: number) => number;
  calculateAPY: () => number;
  refreshStakingData: () => Promise<void>;
}
