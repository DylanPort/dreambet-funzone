
/**
 * Service for interacting with the GMGN.cc API
 */

// Cache for chart URLs to avoid redundant calculations
const chartUrlCache = new Map<string, { url: string, timestamp: number }>();

/**
 * Fetch a GMGN chart URL for a token
 * @param tokenId The token mint address
 * @param theme Chart theme (light or dark)
 * @param interval Chart interval
 * @returns The configured chart URL
 */
export const fetchGMGNChartUrl = (
  tokenId: string,
  theme: string = 'dark',
  interval: string = '15'
): string => {
  const cacheKey = `${tokenId}-${theme}-${interval}`;
  
  // Check if we have a cached URL that's less than 5 minutes old
  const cached = chartUrlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.url;
  }
  
  // Build a new URL
  const url = `https://www.gmgn.cc/kline/sol/${tokenId}?theme=${theme}&interval=${interval}&send_price=true`;
  
  // Cache the URL
  chartUrlCache.set(cacheKey, {
    url,
    timestamp: Date.now()
  });
  
  return url;
};

/**
 * Get the current price for a token from GMGN
 * @param tokenId The token mint address
 * @returns Promise resolving to the current price or null if not available
 */
export const fetchGMGNPrice = async (tokenId: string): Promise<number | null> => {
  try {
    const response = await fetch(`https://www.gmgn.cc/api/price/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`GMGN price fetch failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data.price) {
      return parseFloat(data.price);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching GMGN price:', error);
    return null;
  }
};

/**
 * Subscribe to price updates for a token
 * @param tokenId The token mint address
 * @param callback Function to call when a price update is received
 * @returns Function to unsubscribe
 */
export const subscribeToGMGNPriceUpdates = (
  tokenId: string,
  callback: (price: number, change24h: number) => void
): () => void => {
  // Create event handler for receiving messages from the chart iframe
  const handleMessage = (event: MessageEvent) => {
    try {
      if (event.data && typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        if (data.type === 'price_update' && data.price) {
          callback(data.price, data.change || 0);
        }
      }
    } catch (error) {
      console.error("Error handling GMGN price update:", error);
    }
  };
  
  // Add event listener
  window.addEventListener('message', handleMessage);
  
  // Return cleanup function
  return () => window.removeEventListener('message', handleMessage);
};
