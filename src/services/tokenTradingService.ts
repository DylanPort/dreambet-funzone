
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
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return false;
    
    const { data, error } = await supabase.from('token_transactions')
      .insert({
        userid: userId,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'buy',
        quantity: tokenQuantity,
        price: tokenPrice,
        pxbamount: pxbAmount
      })
      .select();

    if (error) {
      console.error('Error buying token:', error);
      return false;
    }

    // Update user's points
    const { error: pointsError } = await supabase.from('users')
      .update({ points: supabase.rpc('decrement', { x: pxbAmount }) })
      .eq('id', userId);
    
    if (pointsError) {
      console.error('Error updating points:', pointsError);
      return false;
    }

    // Update or create portfolio entry
    const existingEntry = await getUserTokenInPortfolio(tokenId);
    
    if (existingEntry) {
      // Calculate new average purchase price
      const newQuantity = existingEntry.quantity + tokenQuantity;
      const newAvgPrice = (
        (existingEntry.quantity * existingEntry.averagepurchaseprice) + 
        (tokenQuantity * tokenPrice)
      ) / newQuantity;
      
      const { error: portfolioError } = await supabase.from('token_portfolios')
        .update({
          quantity: newQuantity,
          averagepurchaseprice: newAvgPrice,
          currentvalue: newQuantity * tokenPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('userid', userId)
        .eq('tokenid', tokenId);
      
      if (portfolioError) {
        console.error('Error updating portfolio:', portfolioError);
        return false;
      }
    } else {
      // Create new portfolio entry
      const { error: portfolioError } = await supabase.from('token_portfolios')
        .insert({
          userid: userId,
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: tokenQuantity,
          averagepurchaseprice: tokenPrice,
          currentvalue: tokenQuantity * tokenPrice
        });
      
      if (portfolioError) {
        console.error('Error creating portfolio entry:', portfolioError);
        return false;
      }
    }

    return true;
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
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return false;
    
    // Check if user has enough tokens
    const portfolioEntry = await getUserTokenInPortfolio(tokenId);
    if (!portfolioEntry || portfolioEntry.quantity < tokenQuantity) {
      return false;
    }
    
    // Record transaction
    const { error } = await supabase.from('token_transactions')
      .insert({
        userid: userId,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'sell',
        quantity: tokenQuantity,
        price: tokenPrice,
        pxbamount: pxbAmount
      });

    if (error) {
      console.error('Error recording sale transaction:', error);
      return false;
    }

    // Update user's points
    const { error: pointsError } = await supabase.from('users')
      .update({ points: supabase.rpc('increment', { x: pxbAmount }) })
      .eq('id', userId);
    
    if (pointsError) {
      console.error('Error updating points:', pointsError);
      return false;
    }

    // Update portfolio
    const newQuantity = portfolioEntry.quantity - tokenQuantity;
    
    if (newQuantity <= 0) {
      // Delete the portfolio entry if no tokens left
      const { error: deleteError } = await supabase.from('token_portfolios')
        .delete()
        .eq('userid', userId)
        .eq('tokenid', tokenId);
      
      if (deleteError) {
        console.error('Error deleting portfolio entry:', deleteError);
        return false;
      }
    } else {
      // Update the portfolio entry
      const { error: updateError } = await supabase.from('token_portfolios')
        .update({
          quantity: newQuantity,
          currentvalue: newQuantity * tokenPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('userid', userId)
        .eq('tokenid', tokenId);
      
      if (updateError) {
        console.error('Error updating portfolio after sale:', updateError);
        return false;
      }
    }

    return true;
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

    return data as TokenPortfolio[] || [];
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

    return data as TokenPortfolio;
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

    return (data || []).map(item => ({
      ...item,
      type: item.type as 'buy' | 'sell'
    }));
  } catch (error) {
    console.error('Exception when fetching transactions:', error);
    return [];
  }
};
