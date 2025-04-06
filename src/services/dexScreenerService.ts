
export interface DexScreenerData {
  tokenName?: string;
  tokenSymbol?: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  supply?: number;
}

interface TokenPairData {
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: number;
  volume24h?: number;
  liquidity?: number;
  fdv?: number;
}

export async function fetchDexScreenerData(tokenId: string): Promise<DexScreenerData | null> {
  try {
    // Mock implementation for now - in a real app, this would call the DexScreener API
    console.log(`Fetching DexScreener data for token: ${tokenId}`);
    
    // Return mock data
    return {
      tokenName: `Token ${tokenId.substring(0, 4)}`,
      tokenSymbol: tokenId.substring(0, 4).toUpperCase(),
      priceUsd: 0.001,
      marketCap: 1000000,
      volume24h: 50000,
      liquidity: 25000,
      priceChange24h: 2.5,
      supply: 1000000000
    };
  } catch (error) {
    console.error("Error fetching token data from DexScreener:", error);
    return null;
  }
}

export async function fetchTokenPairData(tokenId: string): Promise<TokenPairData | null> {
  try {
    console.log(`Fetching token pair data for: ${tokenId}`);
    // Mock implementation
    return {
      baseToken: {
        address: tokenId,
        name: `Token ${tokenId.substring(0, 4)}`,
        symbol: tokenId.substring(0, 4).toUpperCase()
      },
      priceUsd: 0.001,
      volume24h: 50000,
      liquidity: 25000,
      fdv: 1000000
    };
  } catch (error) {
    console.error("Error fetching token pair data:", error);
    return null;
  }
}

export function subscribeToMarketCap(tokenId: string, callback: (marketCap: number) => void, interval = 60000): () => void {
  console.log(`Starting market cap subscription for token: ${tokenId}`);
  
  // Initial call
  fetchDexScreenerData(tokenId).then(data => {
    if (data) {
      callback(data.marketCap);
    }
  });
  
  // Set up interval
  const timer = setInterval(async () => {
    const data = await fetchDexScreenerData(tokenId);
    if (data) {
      callback(data.marketCap);
    }
  }, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(timer);
    console.log(`Stopped market cap subscription for token: ${tokenId}`);
  };
}

export function subscribeToVolume(tokenId: string, callback: (volume: number) => void, interval = 60000): () => void {
  console.log(`Starting volume subscription for token: ${tokenId}`);
  
  // Initial call
  fetchDexScreenerData(tokenId).then(data => {
    if (data) {
      callback(data.volume24h);
    }
  });
  
  // Set up interval
  const timer = setInterval(async () => {
    const data = await fetchDexScreenerData(tokenId);
    if (data) {
      callback(data.volume24h);
    }
  }, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(timer);
    console.log(`Stopped volume subscription for token: ${tokenId}`);
  };
}

export function startDexScreenerPolling(tokenId: string, callback: (data: DexScreenerData) => void, interval = 60000): () => void {
  console.log(`Starting DexScreener polling for token: ${tokenId}`);
  
  // Initial call
  fetchDexScreenerData(tokenId).then(data => {
    if (data) {
      callback(data);
    }
  });
  
  // Set up interval
  const timer = setInterval(async () => {
    const data = await fetchDexScreenerData(tokenId);
    if (data) {
      callback(data);
    }
  }, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(timer);
    console.log(`Stopped DexScreener polling for token: ${tokenId}`);
  };
}
