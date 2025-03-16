
import { toast } from '@/hooks/use-toast';

interface GMGNTokenData {
  marketCap?: number;
  volume24h?: number;
  price?: number;
  change24h?: number;
}

interface GMGNChartResponse {
  data: {
    market_cap?: number;
    volume_24h?: number;
    price?: number;
    price_change_24h?: number;
    last_price?: number;
  };
}

const CACHE_EXPIRY = 60 * 1000; // 1 minute
const tokenCache: Record<string, { data: GMGNTokenData; timestamp: number }> = {};

export const fetchGMGNTokenData = async (tokenId: string): Promise<GMGNTokenData> => {
  // Check cache first
  if (tokenCache[tokenId] && Date.now() - tokenCache[tokenId].timestamp < CACHE_EXPIRY) {
    return tokenCache[tokenId].data;
  }

  try {
    // Fetch data directly from GMGN chart data API
    const response = await fetch(`https://www.gmgn.cc/api/token/sol/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status}`);
    }
    
    const chartData = await response.json() as GMGNChartResponse;
    
    // Extract relevant data
    const tokenData: GMGNTokenData = {
      marketCap: chartData.data.market_cap,
      volume24h: chartData.data.volume_24h,
      price: chartData.data.price || chartData.data.last_price,
      change24h: chartData.data.price_change_24h
    };
    
    // Cache the result
    tokenCache[tokenId] = {
      data: tokenData,
      timestamp: Date.now()
    };
    
    return tokenData;
  } catch (error) {
    console.error('Error fetching GMGN chart data:', error);
    
    // Try the original API as fallback
    try {
      const fallbackResponse = await fetch(`https://api.gmgn.cc/v1/tokens/sol/${tokenId}`);
      
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch fallback token data: ${fallbackResponse.status}`);
      }
      
      const data = await fallbackResponse.json();
      
      // Extract relevant data
      const tokenData: GMGNTokenData = {
        marketCap: data.marketCap || data.market_cap,
        volume24h: data.volume24h || data.volume || data.volume_24h,
        price: data.price || data.lastPrice || data.last_price,
        change24h: data.priceChange24h || data.price_change_24h
      };
      
      // Cache the result
      tokenCache[tokenId] = {
        data: tokenData,
        timestamp: Date.now()
      };
      
      return tokenData;
    } catch (fallbackError) {
      console.error('Error fetching fallback GMGN token data:', fallbackError);
      return {};
    }
  }
};

// Update token data in the background and trigger callback when done
export const subscribeToGMGNTokenData = (
  tokenId: string, 
  callback: (data: GMGNTokenData) => void
): (() => void) => {
  let isActive = true;
  let timeoutId: number | null = null;
  
  const fetchData = async () => {
    if (!isActive) return;
    
    try {
      const data = await fetchGMGNTokenData(tokenId);
      if (isActive && data) {
        callback(data);
      }
    } catch (error) {
      console.error('Error in GMGN subscription:', error);
    }
    
    if (isActive) {
      timeoutId = window.setTimeout(fetchData, 15000); // Poll every 15 seconds
    }
  };
  
  // Start fetching
  fetchData();
  
  // Return cleanup function
  return () => {
    isActive = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
};
