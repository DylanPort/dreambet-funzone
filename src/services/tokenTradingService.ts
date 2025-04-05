
import { supabase } from "@/integrations/supabase/client";

// Constants for PXB token valuation (virtual)
export const PXB_VIRTUAL_LIQUIDITY = 50000;
export const PXB_VIRTUAL_MARKET_CAP = 300000;
export const PXB_VIRTUAL_PRICE = PXB_VIRTUAL_MARKET_CAP / PXB_VIRTUAL_LIQUIDITY;

interface TokenPortfolio {
  id: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  quantity: number;
  averagepurchaseprice: number;
  currentvalue: number;
  lastupdated: string;
}

interface TokenTransaction {
  id: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pxbamount: number;
  timestamp: string;
}

// Calculate PXB amount based on token price and quantity
export const calculatePXBAmount = (tokenPrice: number, tokenQuantity: number): number => {
  return tokenPrice * tokenQuantity;
};

// Calculate token quantity based on PXB amount and token price
export const calculateTokenQuantity = (pxbAmount: number, tokenPrice: number): number => {
  if (tokenPrice === 0) return 0;
  return pxbAmount / tokenPrice;
};

// Buy token with PXB points
export const buyTokenWithPXB = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  pxbAmount: number,
  tokenPrice: number,
  tokenQuantity: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('buy_token_with_pxb', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      token_id: tokenId,
      token_name: tokenName,
      token_symbol: tokenSymbol,
      pxb_amount: pxbAmount,
      token_price: tokenPrice,
      token_quantity: tokenQuantity
    });

    if (error) {
      console.error('Error buying token:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Exception when buying token:', error);
    return false;
  }
};

// Sell token for PXB points
export const sellTokenForPXB = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  tokenQuantity: number,
  tokenPrice: number,
  pxbAmount: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('sell_token_for_pxb', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      token_id: tokenId,
      token_name: tokenName,
      token_symbol: tokenSymbol,
      token_quantity: tokenQuantity,
      token_price: tokenPrice,
      pxb_amount: pxbAmount
    });

    if (error) {
      console.error('Error selling token:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Exception when selling token:', error);
    return false;
  }
};

// Get user's token portfolio
export const getUserTokenPortfolio = async (): Promise<TokenPortfolio[]> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .order('tokenname', { ascending: true });

    if (error) {
      console.error('Error fetching portfolio:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception when fetching portfolio:', error);
    return [];
  }
};

// Get specific token in portfolio
export const getUserTokenInPortfolio = async (tokenId: string): Promise<TokenPortfolio | null> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('tokenid', tokenId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching token from portfolio:', error);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception when fetching token from portfolio:', error);
    return null;
  }
};

// Get user's token transactions
export const getUserTokenTransactions = async (tokenId?: string): Promise<TokenTransaction[]> => {
  try {
    let query = supabase
      .from('token_transactions')
      .select('*')
      .order('timestamp', { ascending: false });
      
    if (tokenId) {
      query = query.eq('tokenid', tokenId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception when fetching transactions:', error);
    return [];
  }
};
