
import { supabase } from '@/integrations/supabase/client';

interface RealTimeData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
  totalSupply: number;
}

export const fetchRealTimeData = async (tokenId: string): Promise<RealTimeData> => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_mint', tokenId)
      .single();

    if (error) {
      console.error('Error fetching token data:', error);
      throw error;
    }

    // Generate random price changes for demo
    const randomChange24h = (Math.random() * 30) - 15; // Between -15% and +15%
    const randomChange1h = (Math.random() * 10) - 5;   // Between -5% and +5%
    const randomChange6h = (Math.random() * 20) - 10;  // Between -10% and +10%

    // Calculate a rough price from market cap and supply
    const price = data.last_trade_price || (data.current_market_cap / data.total_supply);

    return {
      id: tokenId,
      name: data.token_name,
      symbol: data.token_symbol,
      price: price,
      marketCap: data.current_market_cap || 0,
      volume24h: data.volume_24h || 0,
      priceChange24h: randomChange24h,
      priceChange1h: randomChange1h,
      priceChange6h: randomChange6h,
      totalSupply: data.total_supply
    };
  } catch (error) {
    console.error('Error in fetchRealTimeData:', error);
    // Return dummy data in case of error
    return {
      id: tokenId,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      price: 0.001,
      marketCap: 100000,
      volume24h: 5000,
      priceChange24h: 0,
      priceChange1h: 0,
      priceChange6h: 0,
      totalSupply: 1000000
    };
  }
};

export const fetchDexScreenerData = async (tokenId: string) => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_mint', tokenId)
      .single();

    if (error) {
      console.error('Error fetching dexscreener data:', error);
      throw error;
    }

    // Create a simplified DexScreener-like data structure from our tokens table
    return {
      pair: {
        baseToken: {
          address: tokenId,
          name: data.token_name,
          symbol: data.token_symbol,
        },
        quoteToken: {
          address: 'PXB',
          name: 'PXB Points',
          symbol: 'PXB',
        },
        priceNative: (data.current_market_cap / data.total_supply).toString(),
        priceUsd: (data.current_market_cap / data.total_supply).toString(),
        volume: {
          h24: data.volume_24h || 0,
        },
        liquidity: {
          usd: data.current_market_cap * 0.1, // Simulated liquidity as 10% of market cap
        },
      },
    };
  } catch (error) {
    console.error('Error in fetchDexScreenerData:', error);
    // Return dummy data in case of error
    return {
      pair: {
        baseToken: {
          address: tokenId,
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
        },
        quoteToken: {
          address: 'PXB',
          name: 'PXB Points',
          symbol: 'PXB',
        },
        priceNative: '0.001',
        priceUsd: '0.001',
        volume: {
          h24: 5000,
        },
        liquidity: {
          usd: 10000,
        },
      },
    };
  }
};

// Create a dummy fetch top tokens function for the TokenBetting page
export const fetchTopTokens = async () => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('volume_24h', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching top tokens:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchTopTokens:', error);
    return [];
  }
};
