
/**
 * Utility functions for bet-related operations
 */

/**
 * Formats an address to show only the first and last few characters
 * @param address The full address to format
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns The formatted address string
 */
export const formatAddress = (address: string, startChars: number = 4, endChars: number = 4): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

/**
 * Formats a number with commas as thousands separators
 * @param num The number to format
 * @returns The formatted number string
 */
export const formatNumberWithCommas = (num: number): string => {
  if (num === undefined || num === null) return '0';
  
  // Handle very large numbers by abbreviating them
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  // For smaller numbers, use commas
  return num.toLocaleString('en-US');
};

/**
 * Formats the time remaining until expiry
 * @param expiresAt Timestamp when the bet expires
 * @returns Formatted time remaining string
 */
export const formatTimeRemaining = (expiresAt: number): string => {
  const now = Date.now();
  const timeRemaining = expiresAt - now;
  
  if (timeRemaining <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
};

/**
 * Formats bet duration from seconds to a human readable string
 * @param durationInSeconds Duration in seconds
 * @returns Formatted duration string
 */
export const formatBetDuration = (durationInSeconds: number): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} days`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes} minutes`;
};

