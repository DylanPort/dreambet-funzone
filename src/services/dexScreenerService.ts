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

interface TrendingToken {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  timeRemaining: number;
  volume24h: number;
  marketCap: number;
  imageUrl?: string;
}

const CACHE_EXPIRY_TIME = 30000; // 30 seconds
const TRENDING_CACHE_EXPIRY = 10000; // 10 seconds
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

export const fetchTrendingTokens = async (): Promise<TrendingToken[]> => {
  try {
    // Check cache first
    const cachedData = tokenDataCache.get('trending_tokens');
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < TRENDING_CACHE_EXPIRY) {
      console.log("Using cached trending tokens data");
      return cachedData.data;
    }
    
    console.log("Fetching 24h trending tokens from DexScreener");
    const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No trending tokens found");
      return [];
    }
    
    // Filter and sort pairs by 24h volume
    const sortedPairs = [...data.pairs]
      .filter(pair => {
        // Only include Solana pairs
        if (pair.chainId !== 'solana') return false;
        
        // Only include pairs with significant 24h volume
        if (!pair.volume?.h24 || pair.volume.h24 <= 0) return false;
        
        // Ensure there's price data
        if (!pair.priceUsd) return false;
        
        return true;
      })
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 20);
    
    console.log(`Found ${sortedPairs.length} trending tokens in the last 24h`);
    
    const tokens = sortedPairs.map(pair => {
      // Calculate minutes since this pair was updated
      const pairUpdatedAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : now;
      const minutesAgo = Math.floor((now - pairUpdatedAt) / (60 * 1000));
      
      return {
        id: pair.baseToken?.address || '',
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || '???',
        price: parseFloat(pair.priceUsd || '0'),
        priceChange: pair.priceChange?.h24 || 0, // Use 24h price change
        timeRemaining: minutesAgo > 0 ? minutesAgo : 1, // Ensure at least 1 minute
        volume24h: pair.volume?.h24 || 0,
        marketCap: pair.fdv || 0,
        imageUrl: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${pair.baseToken?.address}/logo.png`
      };
    });
    
    // Save to cache
    tokenDataCache.set('trending_tokens', {
      data: tokens,
      timestamp: now
    });
    
    console.log("24h trending tokens retrieved:", tokens.length);
    return tokens;
  } catch (error) {
    console.error("Error fetching 24h trending tokens:", error);
    return [];
  }
};

let activePollingTokens = new Set<string>();
let pollingIntervalId: number | null = null;

const tokenCallbacks = new Map<string, Function>();

const marketCapCallbacks = new Map<string, Function>();
const volumeCallbacks = new Map<string, Function>();

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
