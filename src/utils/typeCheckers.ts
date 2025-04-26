
/**
 * Type checker utilities for the PumpXBounty application
 */

/**
 * Checks if the provided data is payout data
 * @param data - The data to check
 * @returns True if the data is payout data, false otherwise
 */
export const isPayoutData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    'amount' in data &&
    'timestamp' in data &&
    'type' in data
  );
};

/**
 * Checks if the provided data is bet data
 * @param data - The data to check
 * @returns True if the data is bet data, false otherwise
 */
export const isBetData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    'id' in data &&
    'tokenName' in data &&
    'timestamp' in data
  );
};
