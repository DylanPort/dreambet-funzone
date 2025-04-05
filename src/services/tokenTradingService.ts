
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Constants for PXB token
const PXB_VIRTUAL_LIQUIDITY = 50000; // 50k liquidity
const PXB_VIRTUAL_MARKET_CAP = 300000; // 300k market cap
const PXB_VIRTUAL_PRICE = PXB_VIRTUAL_MARKET_CAP / PXB_VIRTUAL_LIQUIDITY; // Price per PXB

export interface TokenPortfolio {
  id: string;
  userid: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  quantity: number;
  averagepurchaseprice: number;
  currentvalue: number;
  lastupdated: string;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  userid: string;
  tokenid: string;
  tokenname: string;
  tokensymbol: string;
  quantity: number;
  price: number;
  pxbamount: number;
  timestamp: string;
  created_at: string;
  type: 'buy' | 'sell';
}

// Buy tokens with PXB points
export const buyTokensWithPXB = async (
  userId: string,
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  pxbAmount: number,
  tokenMarketCap: number
): Promise<boolean> => {
  try {
    if (!tokenMarketCap) {
      toast.error('Token market cap data not available');
      return false;
    }

    // Calculate how many tokens the user gets based on PXB and token market cap
    const pxbValue = pxbAmount * PXB_VIRTUAL_PRICE;
    const estimatedTokenQuantity = pxbValue / tokenMarketCap * 1000000; // Adjust for better precision

    // Call RPC function to handle the transaction
    const { data, error } = await supabase.rpc('buy_token_with_pxb', {
      user_id: userId,
      token_id: tokenId,
      token_name: tokenName,
      token_symbol: tokenSymbol,
      pxb_amount: pxbAmount,
      token_quantity: estimatedTokenQuantity,
      token_price: tokenMarketCap / 1000000 // Price per token
    });

    if (error) {
      console.error('Error buying tokens:', error);
      toast.error(`Failed to buy tokens: ${error.message}`);
      return false;
    }

    toast.success(`Successfully bought ${estimatedTokenQuantity.toFixed(6)} ${tokenSymbol}`);
    return true;
  } catch (error) {
    console.error('Error in buyTokensWithPXB:', error);
    toast.error('Failed to process transaction');
    return false;
  }
};

// Sell tokens for PXB points
export const sellTokensForPXB = async (
  userId: string,
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  tokenQuantity: number,
  tokenMarketCap: number
): Promise<boolean> => {
  try {
    if (!tokenMarketCap) {
      toast.error('Token market cap data not available');
      return false;
    }

    // Calculate how many PXB points the user gets based on token quantity and market cap
    const tokenValue = tokenQuantity * (tokenMarketCap / 1000000);
    const estimatedPxbAmount = Math.floor(tokenValue / PXB_VIRTUAL_PRICE);

    // Call RPC function to handle the transaction
    const { data, error } = await supabase.rpc('sell_token_for_pxb', {
      user_id: userId,
      token_id: tokenId,
      token_name: tokenName,
      token_symbol: tokenSymbol,
      pxb_amount: estimatedPxbAmount,
      token_quantity: tokenQuantity,
      token_price: tokenMarketCap / 1000000 // Price per token
    });

    if (error) {
      console.error('Error selling tokens:', error);
      toast.error(`Failed to sell tokens: ${error.message}`);
      return false;
    }

    toast.success(`Successfully sold ${tokenQuantity} ${tokenSymbol} for ${estimatedPxbAmount} PXB`);
    return true;
  } catch (error) {
    console.error('Error in sellTokensForPXB:', error);
    toast.error('Failed to process transaction');
    return false;
  }
};

// Get user's token portfolio
export const getUserPortfolio = async (userId: string): Promise<TokenPortfolio[]> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userId);

    if (error) {
      console.error('Error fetching portfolio:', error);
      return [];
    }

    return data as TokenPortfolio[];
  } catch (error) {
    console.error('Error in getUserPortfolio:', error);
    return [];
  }
};

// Get token trading transactions history
export const getTokenTransactions = async (userId: string, tokenId?: string): Promise<TokenTransaction[]> => {
  try {
    let query = supabase
      .from('token_transactions')
      .select('*')
      .eq('userid', userId)
      .order('timestamp', { ascending: false });

    if (tokenId) {
      query = query.eq('tokenid', tokenId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data.map(tx => ({
      ...tx,
      type: tx.type as 'buy' | 'sell'
    }));
  } catch (error) {
    console.error('Error in getTokenTransactions:', error);
    return [];
  }
};
