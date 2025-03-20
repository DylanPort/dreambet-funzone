
interface DexScreenerPair {
  liquidity: number;
  volume: {
    h24: number;
    h1: number;
    h6: number;
  };
  priceUsd: string;
  fdv: number;
  priceChange: {
    h24: number;
    h1: number;
    h6: number;
  };
  chainId: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  pairCreatedAt: string;
  pairAddress: string;
  dexId: string;
  url: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    }
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
  priceChange1h: number;
  priceChange6h: number;
  timeRemaining: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  transactions: number;
  age: string;
  pairAddress: string;
  dexId: string;
  url: string;
  imageUrl?: string;
}

// Define callback types for the subscription functions
type PriceCallback = (price: number) => void;

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
  // Note: We're not adding name and symbol to the return type
  // as they should be accessed through baseToken in the response,
  // not directly in the return object
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
      priceChange24h: pair.priceChange?.h24 || 0,
      // Store baseToken info in the cache but don't include in the typed return value
      baseToken: pair.baseToken
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
    
    console.log("Fetching trending tokens from DexScreener");
    // Use the rankBy=trendingScoreH24 parameter to get actual trending tokens
    const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana?rankBy=trendingScoreH24&order=desc');
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No trending tokens found");
      return [];
    }
    
    // Filter pairs by Solana chain and take top 20
    const sortedPairs = data.pairs
      .filter(pair => pair.chainId === 'solana')
      .slice(0, 20);
    
    console.log(`Found ${sortedPairs.length} trending tokens on DexScreener`);
    
    const tokens = sortedPairs.map(pair => {
      // Calculate time since creation for age display
      const pairCreatedAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : now;
      const minutesAgo = Math.floor((now - pairCreatedAt) / (60 * 1000));
      const hoursAgo = Math.floor(minutesAgo / 60);
      const daysAgo = Math.floor(hoursAgo / 24);
      
      // Format age string based on time elapsed
      let age = '';
      if (daysAgo > 0) {
        age = `${daysAgo}d`;
      } else if (hoursAgo > 0) {
        age = `${hoursAgo}h`;
      } else {
        age = `${minutesAgo}m`;
      }
      
      return {
        id: pair.baseToken?.address || '',
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || '???',
        price: parseFloat(pair.priceUsd || '0'),
        priceChange: pair.priceChange?.h24 || 0, // 24h price change
        priceChange1h: pair.priceChange?.h1 || 0, // 1h price change
        priceChange6h: pair.priceChange?.h6 || 0, // 6h price change
        timeRemaining: minutesAgo > 0 ? minutesAgo : 1,
        volume24h: pair.volume?.h24 || 0,
        marketCap: pair.fdv || 0,
        liquidity: pair.liquidity || 0,
        transactions: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
        age: age,
        pairAddress: pair.pairAddress || '',
        dexId: pair.dexId || '',
        url: pair.url || '',
        imageUrl: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${pair.baseToken?.address}/logo.png`
      };
    });
    
    // Save to cache
    tokenDataCache.set('trending_tokens', {
      data: tokens,
      timestamp: now
    });
    
    console.log("Trending tokens retrieved:", tokens.length);
    return tokens;
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
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
