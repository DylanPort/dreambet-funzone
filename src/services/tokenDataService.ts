
import { supabase } from '@/integrations/supabase/client';
import { fetchDexScreenerData } from './dexScreenerService';

export async function fetchTokenData(tokenId: string) {
  try {
    // First check if we have the token in our database
    const { data: tokenData, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_mint', tokenId)
      .single();
      
    if (!error && tokenData) {
      return {
        name: tokenData.token_name,
        symbol: tokenData.token_symbol,
        price: tokenData.last_trade_price || 0.001,
        marketCap: tokenData.current_market_cap || 0,
        volume24h: tokenData.volume_24h || 0,
        supply: tokenData.total_supply || 1000000000,
        priceChange24h: 0, // We don't store this yet
        address: tokenId
      };
    }
    
    // If not in our database, fetch from DexScreener
    const dexData = await fetchDexScreenerData(tokenId);
    
    if (dexData) {
      return {
        name: dexData.tokenName || 'Unknown Token',
        symbol: dexData.tokenSymbol || 'UNKNOWN',
        price: dexData.priceUsd || 0.001,
        marketCap: dexData.marketCap || 0,
        volume24h: dexData.volume24h || 0,
        supply: dexData.supply || 1000000000,
        priceChange24h: dexData.priceChange24h || 0,
        address: tokenId
      };
    }
    
    // Fallback to default
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      price: 0.001,
      marketCap: 0,
      volume24h: 0,
      supply: 1000000000,
      priceChange24h: 0,
      address: tokenId
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    
    // Fallback to default
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      price: 0.001,
      marketCap: 0,
      volume24h: 0,
      supply: 1000000000,
      priceChange24h: 0,
      address: tokenId
    };
  }
}

export async function fetchTokenPrice(tokenId: string) {
  try {
    // First check if we have the token in our database
    const { data: tokenData, error } = await supabase
      .from('tokens')
      .select('last_trade_price')
      .eq('token_mint', tokenId)
      .single();
      
    if (!error && tokenData && tokenData.last_trade_price) {
      return tokenData.last_trade_price;
    }
    
    // If not in our database, fetch from DexScreener
    const dexData = await fetchDexScreenerData(tokenId);
    
    if (dexData && dexData.priceUsd) {
      return dexData.priceUsd;
    }
    
    // Fallback to default
    return 0.001;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0.001; // Default price
  }
}
