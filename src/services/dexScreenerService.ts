
interface DexScreenerTokenData {
  pairs: {
    liquidity: number;
    volume: {
      h24: number;
    };
    priceUsd: string;
    fdv: number;
  }[];
}

export const fetchDexScreenerData = async (tokenAddress: string): Promise<{
  marketCap: number;
  volume24h: number;
  liquidity: number;
  priceUsd: number;
} | null> => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json() as DexScreenerTokenData;
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No pairs found for token:", tokenAddress);
      return null;
    }
    
    // Use the first pair for now (usually the most liquid one)
    const pair = data.pairs[0];
    
    return {
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity || 0,
      priceUsd: parseFloat(pair.priceUsd || '0'),
    };
  } catch (error) {
    console.error("Error fetching DexScreener data:", error);
    return null;
  }
};
