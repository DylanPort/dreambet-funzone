
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

const CACHE_EXPIRY_TIME = 30000; // 30 seconds
const tokenDataCache = new Map<string, {
  data: any;
  timestamp: number;
}>();

export const fetchDexScreenerData = async (tokenAddress: string): Promise<{
  marketCap: number;
  volume24h: number;
  liquidity: number;
  priceUsd: number;
  priceChange24h: number;
} | null> => {
  try {
    // Check cache first
    const cachedData = tokenDataCache.get(tokenAddress);
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY_TIME) {
      return cachedData.data;
    }
    
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
    
    const result = {
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity || 0,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || 0
    };
    
    // Save to cache
    tokenDataCache.set(tokenAddress, {
      data: result,
      timestamp: now
    });
    
    console.log("DexScreener data retrieved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error fetching DexScreener data:", error);
    return null;
  }
};

// Add a polling function with better performance
let activePollingTokens = new Set<string>();
let pollingIntervalId: number | null = null;

// Store callbacks for each token
const tokenCallbacks = new Map<string, Function>();

// Add separate callback maps for specific metrics
const marketCapCallbacks = new Map<string, Function>();
const volumeCallbacks = new Map<string, Function>();

// Define the unified polling function that handles all callback types
const pollAllActiveTokens = async () => {
  const tokens = Array.from(activePollingTokens);
  for (const token of tokens) {
    const data = await fetchDexScreenerData(token);
    
    // Call the main callback
    const callbackFn = tokenCallbacks.get(token);
    if (data && callbackFn) {
      callbackFn(data);
    }
    
    // Call specific metric callbacks
    if (data) {
      const marketCapFn = marketCapCallbacks.get(token);
      if (marketCapFn) {
        marketCapFn(data.marketCap);
      }
      
      const volumeFn = volumeCallbacks.get(token);
      if (volumeFn) {
        volumeFn(data.volume24h);
      }
    }
  }
};

export const startDexScreenerPolling = (
  tokenAddress: string, 
  onData: (data: ReturnType<typeof fetchDexScreenerData> extends Promise<infer T> ? T : never) => void,
  interval = 30000 // Default 30 seconds (increased from 15s)
) => {
  // Save the callback
  tokenCallbacks.set(tokenAddress, onData);
  
  // Add token to active polling list
  activePollingTokens.add(tokenAddress);
  
  // Fetch immediately
  fetchDexScreenerData(tokenAddress).then(data => {
    if (data) onData(data);
  });
  
  // Start global polling interval if not already running
  if (!pollingIntervalId) {
    pollingIntervalId = window.setInterval(pollAllActiveTokens, interval);
  }
  
  // Return cleanup function
  return () => {
    activePollingTokens.delete(tokenAddress);
    tokenCallbacks.delete(tokenAddress);
    marketCapCallbacks.delete(tokenAddress);
    volumeCallbacks.delete(tokenAddress);
    
    // If no more tokens, clear the interval
    if (activePollingTokens.size === 0 && pollingIntervalId) {
      window.clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  };
};

// Function to only poll for market cap updates
export const subscribeToMarketCap = (
  tokenAddress: string,
  onMarketCapUpdate: (marketCap: number) => void
) => {
  marketCapCallbacks.set(tokenAddress, onMarketCapUpdate);
  
  // If we already have cached data, use it immediately
  const cachedData = tokenDataCache.get(tokenAddress);
  if (cachedData && cachedData.data && cachedData.data.marketCap !== undefined) {
    onMarketCapUpdate(cachedData.data.marketCap);
  }
  
  // Make sure the token is being polled
  if (!activePollingTokens.has(tokenAddress)) {
    activePollingTokens.add(tokenAddress);
    
    // Start polling if not already running
    if (!pollingIntervalId) {
      pollingIntervalId = window.setInterval(pollAllActiveTokens, 30000);
    }
  }
  
  // Return cleanup function
  return () => {
    marketCapCallbacks.delete(tokenAddress);
  };
};

// Function to only poll for volume updates
export const subscribeToVolume = (
  tokenAddress: string,
  onVolumeUpdate: (volume24h: number) => void
) => {
  volumeCallbacks.set(tokenAddress, onVolumeUpdate);
  
  // If we already have cached data, use it immediately
  const cachedData = tokenDataCache.get(tokenAddress);
  if (cachedData && cachedData.data && cachedData.data.volume24h !== undefined) {
    onVolumeUpdate(cachedData.data.volume24h);
  }
  
  // Make sure the token is being polled
  if (!activePollingTokens.has(tokenAddress)) {
    activePollingTokens.add(tokenAddress);
    
    // Start polling if not already running
    if (!pollingIntervalId) {
      pollingIntervalId = window.setInterval(pollAllActiveTokens, 30000);
    }
  }
  
  // Return cleanup function
  return () => {
    volumeCallbacks.delete(tokenAddress);
  };
};
