
/**
 * Truncates an address to show only the beginning and end parts
 * @param address The full address to truncate
 * @param length The number of characters to show at each end
 * @returns The truncated address
 */
export default function truncateAddress(address: string, length: number = 4): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  
  return `${address.substring(0, length)}...${address.substring(
    address.length - length,
    address.length
  )}`;
}
