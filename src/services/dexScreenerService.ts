
/**
 * Service for interacting with the DexScreener API
 */

// Cache for DexScreener data to reduce API calls
const dexScreenerCache = new Map<string, { data: any, timestamp: number }>();

/**
 * Fetch token data from DexScreener API
 * @param tokenMint - The token mint address
 * @returns Token data including price, market cap, volume, and liquidity
 */
export const fetchDexScreenerData = async (tokenMint: string) => {
  try {
    // Check cache first (valid for 5 minutes)
    const cachedData = dexScreenerCache.get(tokenMint);
    if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
      console.log("Using cached DexScreener data for:", tokenMint);
      return cachedData.data;
    }

    console.log("Fetching DexScreener data for:", tokenMint);
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const json = await response.json();
    
    if (!json.pairs || json.pairs.length === 0) {
      console.log("No pairs found for token:", tokenMint);
      return null;
    }
    
    // Sort pairs by liquidity (highest first)
    const sortedPairs = [...json.pairs].sort((a, b) => {
      const liquidityA = a.liquidity?.usd || 0;
      const liquidityB = b.liquidity?.usd || 0;
      return liquidityB - liquidityA;
    });
    
    // Get the pair with the highest liquidity
    const pair = sortedPairs[0];
    
    const result = {
      name: pair.baseToken?.name || 'Unknown',
      symbol: pair.baseToken?.symbol || '',
      priceUsd: parseFloat(pair.priceUsd) || 0,
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.fdv || pair.marketCap || 0,
      pairAddress: pair.pairAddress,
      dexId: pair.dexId
    };
    
    // Cache the result
    dexScreenerCache.set(tokenMint, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching DexScreener data:", error);
    return null;
  }
};

/**
 * Start polling DexScreener for token data
 * @param tokenMint - The token mint address
 * @param callback - Function to call with updated data
 * @param interval - Polling interval in milliseconds
 * @returns Function to stop polling
 */
export const startDexScreenerPolling = (
  tokenMint: string,
  callback: (data: any) => void,
  interval: number = 60000
) => {
  // Fetch initial data
  fetchDexScreenerData(tokenMint).then(data => {
    if (data) callback(data);
  });
  
  // Set up polling interval
  const intervalId = setInterval(async () => {
    try {
      const data = await fetchDexScreenerData(tokenMint);
      if (data) callback(data);
    } catch (error) {
      console.error("Error in DexScreener polling:", error);
    }
  }, interval);
  
  // Return function to stop polling
  return () => clearInterval(intervalId);
};
