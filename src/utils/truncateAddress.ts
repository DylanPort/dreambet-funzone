
/**
 * Truncates a long address or hash to a shorter display format
 * @param address The full address or hash to truncate
 * @param visibleChars The number of characters to show at the beginning and end
 * @returns Truncated address with ellipsis in the middle
 */
const truncateAddress = (address: string, visibleChars: number = 4): string => {
  if (!address) return '';
  
  if (address.length <= visibleChars * 2) {
    return address;
  }
  
  const prefix = address.substring(0, visibleChars);
  const suffix = address.substring(address.length - visibleChars);
  
  return `${prefix}...${suffix}`;
};

export default truncateAddress;
