
/**
 * Truncates an address or string to a specified length showing the beginning and end
 * @param address The full address or string to truncate
 * @param visibleChars The number of characters to show at the beginning and end
 * @returns The truncated string
 */
const truncateAddress = (address?: string, visibleChars: number = 4): string => {
  if (!address) return '';
  
  if (address.length <= visibleChars * 2) {
    return address;
  }
  
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
};

export default truncateAddress;
