
/**
 * Calculates the percentage change between two values
 * @param oldValue The initial value
 * @param newValue The current value
 * @returns The percentage change, positive for increase, negative for decrease
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

/**
 * Formats a number to a compact representation (e.g., 1.2k, 3.4M)
 * @param value The number to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export const formatCompactNumber = (value: number, decimals = 2): string => {
  if (value < 1000) {
    return value.toFixed(decimals);
  }
  
  if (value >= 1000 && value < 1000000) {
    return (value / 1000).toFixed(decimals) + 'K';
  }
  
  if (value >= 1000000 && value < 1000000000) {
    return (value / 1000000).toFixed(decimals) + 'M';
  }
  
  return (value / 1000000000).toFixed(decimals) + 'B';
};

/**
 * Formats currency values with appropriate precision
 * @param value The value to format
 * @returns Formatted string with appropriate decimal places
 */
export const formatCurrency = (value: number): string => {
  if (value < 0.000001) return value.toExponential(2);
  if (value < 0.001) return value.toFixed(9);
  if (value < 0.01) return value.toFixed(6);
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  return formatCompactNumber(value);
};
