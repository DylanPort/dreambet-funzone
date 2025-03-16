
import { toast } from '@/hooks/use-toast';

// Cache to store API responses and reduce redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_EXPIRY = 60000; // 1 minute

// Base URLs for API requests
const API_BASE_URL = 'https://api.coingecko.com/api/v3';
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetch token price from Coingecko by contract address
 * @param contractAddress Solana token address
 */
export async function fetchTokenPrice(contractAddress: string): Promise<{
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
} | null> {
  // Check cache first
  const cacheKey = `price_${contractAddress}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_EXPIRY) {
    return cache[cacheKey].data;
  }

  try {
    // Format URL with contract address
    const apiUrl = `${API_BASE_URL}/simple/token_price/solana?contract_addresses=${contractAddress}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;
    const encodedUrl = encodeURIComponent(apiUrl);
    const proxyUrl = `${CORS_PROXY}${encodedUrl}`;
    
    console.log(`Fetching Coingecko data for token: ${contractAddress}`);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coingecko API error:', errorText);
      
      if (response.status === 429) {
        toast({
          title: "Rate limited by Coingecko",
          description: "Too many requests to price API",
          variant: "destructive",
        });
      }
      
      return null;
    }
    
    const data = await response.json();
    
    // Return null if the token is not found
    if (!data[contractAddress]) {
      console.log('Token not found in Coingecko:', contractAddress);
      return null;
    }
    
    const result = {
      usd: data[contractAddress].usd || 0,
      usd_24h_change: data[contractAddress].usd_24h_change || 0,
      last_updated_at: data[contractAddress].last_updated_at || Date.now()/1000
    };
    
    // Cache the result
    cache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching Coingecko price:', error);
    return null;
  }
}

/**
 * Subscribe to periodic token price updates from Coingecko
 */
export function subscribeToCoingeckoPrice(
  contractAddress: string,
  onUpdate: (data: { price: number, change24h: number, timestamp: number } | null) => void,
  interval = 60000 // 1 minute by default
): () => void {
  let isActive = true;
  
  const fetchPrice = async () => {
    if (!isActive) return;
    
    try {
      const priceData = await fetchTokenPrice(contractAddress);
      
      if (isActive && priceData) {
        onUpdate({
          price: priceData.usd,
          change24h: priceData.usd_24h_change,
          timestamp: priceData.last_updated_at * 1000 // Convert to milliseconds
        });
      }
    } catch (error) {
      console.error('Error in Coingecko subscription:', error);
    }
    
    if (isActive) {
      setTimeout(fetchPrice, interval);
    }
  };
  
  // Start fetching immediately
  fetchPrice();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
}
