
interface DexScreenerPair {
  liquidity: number;
  volume: {
    h24: number;
  };
  priceUsd: string;
  fdv: number;
  priceChange: {
    h24: number;
  };
}

interface DexScreenerTokenData {
  pairs: DexScreenerPair[];
}

export const fetchDexScreenerData = async (tokenAddress: string): Promise<{
  marketCap: number;
  volume24h: number;
  liquidity: number;
  priceUsd: number;
  priceChange24h: number;
} | null> => {
  try {
    console.log("Fetching DexScreener data for token:", tokenAddress);
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json() as DexScreenerTokenData;
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No pairs found for token:", tokenAddress);
      return null;
    }
    
    // Sort pairs by liquidity to get the most liquid one
    const sortedPairs = [...data.pairs].sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
    const pair = sortedPairs[0];
    
    console.log("DexScreener data retrieved successfully:", {
      marketCap: pair.fdv,
      volume24h: pair.volume?.h24,
      liquidity: pair.liquidity,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || 0
    });
    
    return {
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity || 0,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || 0
    };
  } catch (error) {
    console.error("Error fetching DexScreener data:", error);
    return null;
  }
};

// Add a polling function to continuously fetch updated data
export const startDexScreenerPolling = (
  tokenAddress: string, 
  onData: (data: ReturnType<typeof fetchDexScreenerData> extends Promise<infer T> ? T : never) => void,
  interval = 30000 // Default 30 seconds
) => {
  let timeoutId: number;
  
  const fetchData = async () => {
    const data = await fetchDexScreenerData(tokenAddress);
    if (data) {
      onData(data);
    }
    timeoutId = window.setTimeout(fetchData, interval);
  };
  
  // Initial fetch
  fetchData();
  
  // Return cleanup function
  return () => {
    window.clearTimeout(timeoutId);
  };
};
