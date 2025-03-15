
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

// Format bet duration
export const formatBetDuration = (duration: number) => {
  // Duration in minutes
  if (duration < 60) {
    return `${duration}m bet`;
  }
  // Duration in hours and minutes
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (minutes === 0) {
    return `${hours}h bet`;
  }
  return `${hours}h ${minutes}m bet`;
};

// Format wallet address to a shorter form
export const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Calculate early closure payout for a bet
export const calculateEarlyClosurePayout = (
  bet: Bet, 
  currentMarketCap: number, 
  elapsedTimeMs: number
) => {
  // Safety check
  if (!bet.initialMarketCap || !bet.duration) {
    return bet.amount; // Return original amount if we don't have the required data
  }

  const initialMarketCap = bet.initialMarketCap;
  const initialBet = bet.amount;
  const totalBetTimeMs = bet.duration * 60 * 1000; // Convert minutes to milliseconds
  
  // Normalized time values (t/T and (T-t)/T)
  const timeRatio = elapsedTimeMs / totalBetTimeMs; // t/T
  const remainingTimeRatio = 1 - timeRatio; // (T-t)/T
  
  // Market cap ratio
  const marketCapRatio = currentMarketCap / initialMarketCap;
  
  // Calculate payout based on bet prediction
  if (bet.prediction === 'migrate') {
    // Payout = initial_bet * (P_current / P_initial) * [(T - t)/T] + initial_bet * [t/T]
    return initialBet * marketCapRatio * remainingTimeRatio + initialBet * timeRatio;
  } else {
    // Payout = initial_bet * (P_initial / P_current) * [(T - t)/T] + initial_bet * [t/T]
    return initialBet * (1 / marketCapRatio) * remainingTimeRatio + initialBet * timeRatio;
  }
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
