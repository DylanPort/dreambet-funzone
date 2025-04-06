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
} | null> => {
  try {
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
    
    const sortedPairs = [...data.pairs].sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
    const pair = sortedPairs[0];
    
    const result = {
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity || 0,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || 0,
      baseToken: pair.baseToken
    };
    
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
    const cachedData = tokenDataCache.get('trending_tokens');
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < TRENDING_CACHE_EXPIRY) {
      console.log("Using cached trending tokens data");
      return cachedData.data;
    }
    
    console.log("Fetching trending tokens from DexScreener");
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
    
    const sortedPairs = data.pairs
      .filter(pair => pair.chainId === 'solana')
      .slice(0, 20);
    
    console.log(`Found ${sortedPairs.length} trending tokens on DexScreener`);
    
    const tokens = sortedPairs.map(pair => {
      const pairCreatedAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : now;
      const minutesAgo = Math.floor((now - pairCreatedAt) / (60 * 1000));
      const hoursAgo = Math.floor(minutesAgo / 60);
      const daysAgo = Math.floor(hoursAgo / 24);
      
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
        priceChange: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
        priceChange6h: pair.priceChange?.h6 || 0,
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
    
    const callbackFn = tokenCallbacks.get(token);
    if (data && callbackFn) {
      callbackFn(data);
    }
    
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
  interval = 10000 // Changed from 30000 to 10000 (10 seconds)
) => {
  tokenCallbacks.set(tokenAddress, onData);
  
  activePollingTokens.add(tokenAddress);
  
  fetchDexScreenerData(tokenAddress).then(data => {
    if (data) onData(data);
  });
  
  if (!pollingIntervalId) {
    pollingIntervalId = window.setInterval(pollAllActiveTokens, interval);
  }
  
  return () => {
    activePollingTokens.delete(tokenAddress);
    tokenCallbacks.delete(tokenAddress);
    marketCapCallbacks.delete(tokenAddress);
    volumeCallbacks.delete(tokenAddress);
    
    if (activePollingTokens.size === 0 && pollingIntervalId) {
      window.clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  };
};

export const subscribeToMarketCap = (tokenId: string, callback: (marketCap: number) => void, refreshInterval = 10000) => {
  let isActive = true;
  
  const fetchData = async () => {
    if (!isActive) return;
    
    try {
      const data = await fetchDexScreenerData(tokenId);
      if (data && data.marketCap !== undefined && isActive) {
        callback(data.marketCap);
      }
    } catch (error) {
      console.error('Error fetching market cap:', error);
    }
    
    if (isActive) {
      setTimeout(fetchData, refreshInterval);
    }
  };
  
  fetchData();
  
  return () => {
    isActive = false;
  };
};

export const subscribeToVolume = (tokenId: string, callback: (volume: number) => void, refreshInterval = 10000) => {
  let isActive = true;
  
  const fetchData = async () => {
    if (!isActive) return;
    
    try {
      const data = await fetchDexScreenerData(tokenId);
      if (data && data.volume24h !== undefined && isActive) {
        callback(data.volume24h);
      }
    } catch (error) {
      console.error('Error fetching volume:', error);
    }
    
    if (isActive) {
      setTimeout(fetchData, refreshInterval);
    }
  };
  
  fetchData();
  
  return () => {
    isActive = false;
  };
};

/**
 * Fetches token pair data by pair address
 * This is useful for getting token images and additional metadata
 */
export const fetchTokenPairData = async (pairAddress: string) => {
  try {
    console.log("Fetching pair data for:", pairAddress);
    
    // Check cache first
    const cacheKey = `pair_data_${pairAddress}`;
    const cachedData = tokenDataCache.get(cacheKey);
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY_TIME) {
      console.log("Using cached pair data for:", pairAddress);
      return cachedData.data;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`DexScreener API error for pair ${pairAddress}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No pair data found for:", pairAddress);
      return null;
    }
    
    // Cache the result
    tokenDataCache.set(cacheKey, {
      data: data.pairs[0],
      timestamp: now
    });
    
    return data.pairs[0];
  } catch (error) {
    console.error("Error fetching token pair data:", error);
    return null;
  }
};
