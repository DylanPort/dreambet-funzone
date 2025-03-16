
import { toast } from "sonner";

export interface TokenMetrics {
  marketCap: number | null;
  volume24h: number | null;
  priceUsd: number | null;
  priceChange24h: number | null;
  liquidity: number | null;
  timestamp: number;
}

// Singleton cache for token metrics
const tokenMetricsCache = new Map<string, TokenMetrics>();

// Cache expiry time in milliseconds (30 seconds)
const CACHE_EXPIRY = 30000;

/**
 * Get cached token metrics, returns null if not cached or expired
 */
export const getCachedTokenMetrics = (tokenId: string): TokenMetrics | null => {
  const cached = tokenMetricsCache.get(tokenId);
  
  if (!cached) return null;
  
  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    return null;
  }
  
  return cached;
};

/**
 * Set token metrics in cache
 */
export const setCachedTokenMetrics = (tokenId: string, metrics: Partial<TokenMetrics>) => {
  const existing = tokenMetricsCache.get(tokenId) || {
    marketCap: null,
    volume24h: null,
    priceUsd: null,
    priceChange24h: null,
    liquidity: null,
    timestamp: Date.now()
  };
  
  tokenMetricsCache.set(tokenId, {
    ...existing,
    ...metrics,
    timestamp: Date.now()
  });
};

/**
 * Fetch token metrics from DexScreener with optimized caching
 */
export const fetchTokenMetrics = async (tokenId: string): Promise<TokenMetrics | null> => {
  try {
    // First check cache
    const cached = getCachedTokenMetrics(tokenId);
    if (cached) {
      return cached;
    }
    
    // If not in cache or expired, fetch from API
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No pairs found for token:", tokenId);
      return null;
    }
    
    // Sort pairs by liquidity to get the most liquid one
    const sortedPairs = [...data.pairs].sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0));
    const pair = sortedPairs[0];
    
    const metrics: TokenMetrics = {
      marketCap: pair.fdv || null,
      volume24h: pair.volume?.h24 || null,
      priceUsd: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || null,
      liquidity: pair.liquidity || null,
      timestamp: Date.now()
    };
    
    // Save to cache
    setCachedTokenMetrics(tokenId, metrics);
    
    return metrics;
  } catch (error) {
    console.error("Error fetching token metrics:", error);
    toast.error("Failed to fetch token data");
    return null;
  }
};

/**
 * Optimized data subscription hook for token metrics
 */
export const subscribeToTokenMetric = (
  tokenId: string,
  metricType: keyof Omit<TokenMetrics, 'timestamp'>,
  callback: (value: number | null) => void
) => {
  // Immediately check localStorage for even faster initial render
  try {
    const storageKey = `token_${tokenId}_${metricType}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      const { value, timestamp } = JSON.parse(storedData);
      // Use cache if less than 2 minutes old
      if (Date.now() - timestamp < 120000) {
        callback(value);
      }
    }
  } catch (e) {
    console.error(`Error reading cached ${metricType} from localStorage:`, e);
  }
  
  // Then check memory cache
  const cached = getCachedTokenMetrics(tokenId);
  if (cached && cached[metricType] !== undefined && cached[metricType] !== null) {
    callback(cached[metricType]);
  }
  
  // Fetch fresh data
  const fetchData = async () => {
    const metrics = await fetchTokenMetrics(tokenId);
    if (metrics && metrics[metricType] !== undefined && metrics[metricType] !== null) {
      callback(metrics[metricType]);
      
      // Also cache in localStorage for persistence
      try {
        const storageKey = `token_${tokenId}_${metricType}`;
        localStorage.setItem(storageKey, JSON.stringify({
          value: metrics[metricType],
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error(`Error caching ${metricType} to localStorage:`, e);
      }
    }
  };
  
  // Execute initial fetch
  fetchData();
  
  // Set up interval for polling
  const intervalId = setInterval(fetchData, 30000);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
};
