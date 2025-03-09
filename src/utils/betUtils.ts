
import { Bet } from '@/types/bet';

// Format time remaining for a bet
export const formatTimeRemaining = (expiresAt: number) => {
  const now = new Date().getTime();
  const diffMs = expiresAt - now;
  if (diffMs <= 0) return 'Expired';
  
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHrs}h ${diffMins}m left`;
};

// Format wallet address to a shorter form
export const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Sort bets based on different criteria
export const getSortedBets = (bets: Bet[], sortBy: 'newest' | 'expiring' | 'amount') => {
  switch(sortBy) {
    case 'newest':
      return [...bets].sort((a, b) => b.timestamp - a.timestamp);
    case 'expiring':
      return [...bets].sort((a, b) => a.expiresAt - b.expiresAt);
    case 'amount':
      return [...bets].sort((a, b) => b.amount - a.amount);
    default:
      return bets;
  }
};

// Get bets that are expiring soon (within the next hour)
export const getExpiringBets = (bets: Bet[], sortBy: 'newest' | 'expiring' | 'amount') => {
  const oneHourFromNow = new Date().getTime() + 60 * 60 * 1000;
  return getSortedBets(bets, sortBy).filter(bet => bet.expiresAt < oneHourFromNow).slice(0, 10);
};

// Get public bets (not created by the current user)
export const getPublicBets = (bets: Bet[], sortBy: 'newest' | 'expiring' | 'amount', publicKey: string | null) => {
  return getSortedBets(bets, sortBy)
    .filter(bet => !publicKey || bet.initiator !== publicKey)
    .slice(0, 10);
};
