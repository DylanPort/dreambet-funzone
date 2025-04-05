
export const formatLargeNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return "N/A";
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return `${num.toFixed(3)}`;
};
