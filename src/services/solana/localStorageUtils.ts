
import { Bet } from '@/types/bet';

// Store bet in local storage
export const storeBetLocally = (bet: Bet) => {
  try {
    // Get existing bets from local storage
    const existingBetsJson = localStorage.getItem('pumpxbounty_fallback_bets');
    const existingBets = existingBetsJson ? JSON.parse(existingBetsJson) : [];
    
    // Add new bet
    existingBets.push(bet);
    
    // Save back to local storage
    localStorage.setItem('pumpxbounty_fallback_bets', JSON.stringify(existingBets));
    console.log("Bet saved to local storage");
    return true;
  } catch (err) {
    console.warn("Failed to save bet to local storage:", err);
    return false;
  }
};

// Retrieve bets from local storage
export const getLocalBets = (): Bet[] => {
  try {
    const localBetsJson = localStorage.getItem('pumpxbounty_fallback_bets');
    return localBetsJson ? JSON.parse(localBetsJson) : [];
  } catch (error) {
    console.error('Error loading local bets:', error);
    return [];
  }
};
