
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TokenPosition {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentValue: number;
  lastUpdated: string;
}

export interface TokenTransaction {
  id: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pxbAmount: number;
  timestamp: string;
}

// Exchange rate constants
const PXB_TO_USD_RATE = 0.001; // 1 PXB = $0.001 USD
const MIN_TRANSACTION_PXB = 100; // Minimum PXB for a transaction

/**
 * Get user's token portfolio
 */
export const getUserPortfolio = async (): Promise<TokenPosition[]> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*');
    
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      tokenId: item.tokenid,
      tokenName: item.tokenname,
      tokenSymbol: item.tokensymbol,
      quantity: item.quantity,
      averagePurchasePrice: item.averagepurchaseprice,
      currentValue: item.currentvalue,
      lastUpdated: item.lastupdated
    }));
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    toast.error('Failed to load your portfolio');
    return [];
  }
};

/**
 * Get user's token position for a specific token
 */
export const getUserTokenPosition = async (tokenId: string): Promise<TokenPosition | null> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('tokenid', tokenId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      tokenId: data.tokenid,
      tokenName: data.tokenname,
      tokenSymbol: data.tokensymbol,
      quantity: data.quantity,
      averagePurchasePrice: data.averagepurchaseprice,
      currentValue: data.currentvalue,
      lastUpdated: data.lastupdated
    };
  } catch (error) {
    console.error(`Error fetching token position for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (tokenId?: string, limit = 10): Promise<TokenTransaction[]> => {
  try {
    let query = supabase
      .from('token_transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (tokenId) {
      query = query.eq('tokenid', tokenId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      tokenId: item.tokenid,
      tokenName: item.tokenname,
      tokenSymbol: item.tokensymbol,
      type: item.type as 'buy' | 'sell', // Cast to ensure type is 'buy' | 'sell'
      quantity: item.quantity,
      price: item.price,
      pxbAmount: item.pxbamount,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transaction history');
    return [];
  }
};

/**
 * Convert USD to PXB
 */
export const usdToPXB = (usdAmount: number): number => {
  return usdAmount / PXB_TO_USD_RATE;
};

/**
 * Convert PXB to USD
 */
export const pxbToUSD = (pxbAmount: number): number => {
  return pxbAmount * PXB_TO_USD_RATE;
};

/**
 * Calculate how many tokens can be bought with given PXB at current token price
 */
export const calculateTokenQuantity = (pxbAmount: number, tokenPriceUSD: number): number => {
  const usdAmount = pxbToUSD(pxbAmount);
  return usdAmount / tokenPriceUSD;
};

/**
 * Calculate PXB value of tokens at given token price
 */
export const calculatePXBValue = (tokenQuantity: number, tokenPriceUSD: number): number => {
  const usdValue = tokenQuantity * tokenPriceUSD;
  return usdToPXB(usdValue);
};

/**
 * Buy tokens with PXB
 */
export const buyTokens = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  pxbAmount: number,
  tokenPriceUSD: number
): Promise<boolean> => {
  if (pxbAmount < MIN_TRANSACTION_PXB) {
    toast.error(`Minimum transaction amount is ${MIN_TRANSACTION_PXB} PXB`);
    return false;
  }
  
  try {
    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .single();
    
    if (userError || !userData) {
      toast.error('Failed to verify your PXB balance');
      return false;
    }
    
    if (userData.points < pxbAmount) {
      toast.error('Insufficient PXB balance');
      return false;
    }
    
    // Calculate token quantity
    const tokenQuantity = calculateTokenQuantity(pxbAmount, tokenPriceUSD);
    
    // Start transaction
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ points: userData.points - pxbAmount })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
    
    if (userUpdateError) {
      toast.error('Failed to update your PXB balance');
      return false;
    }
    
    // Get the user's ID
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }
    
    // Record transaction
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'buy',
        quantity: tokenQuantity,
        price: tokenPriceUSD,
        pxbamount: pxbAmount,
        userid: userId
      });
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Attempt to revert points
      await supabase
        .from('users')
        .update({ points: userData.points })
        .eq('id', userId);
      
      toast.error('Transaction failed');
      return false;
    }
    
    // Check if user already has a position in this token
    const { data: positionData, error: positionError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('tokenid', tokenId)
      .maybeSingle();
    
    if (positionError) {
      console.error('Error checking token position:', positionError);
      toast.error('Failed to update your portfolio');
      return false;
    }
    
    // Update or create position
    if (positionData) {
      // Calculate new average purchase price
      const totalValue = positionData.quantity * positionData.averagepurchaseprice + tokenQuantity * tokenPriceUSD;
      const newQuantity = positionData.quantity + tokenQuantity;
      const newAveragePrice = totalValue / newQuantity;
      
      const { error: updateError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          averagepurchaseprice: newAveragePrice,
          currentvalue: newQuantity * tokenPriceUSD,
          lastupdated: new Date().toISOString()
        })
        .eq('id', positionData.id);
      
      if (updateError) {
        console.error('Error updating token position:', updateError);
        toast.error('Failed to update your portfolio');
        return false;
      }
    } else {
      // Create new position
      const { error: createError } = await supabase
        .from('token_portfolios')
        .insert({
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: tokenQuantity,
          averagepurchaseprice: tokenPriceUSD,
          currentvalue: tokenQuantity * tokenPriceUSD,
          userid: userId
        });
      
      if (createError) {
        console.error('Error creating token position:', createError);
        toast.error('Failed to update your portfolio');
        return false;
      }
    }
    
    toast.success(`Successfully bought ${tokenQuantity.toFixed(6)} ${tokenSymbol} for ${pxbAmount} PXB`);
    return true;
  } catch (error) {
    console.error('Error buying tokens:', error);
    toast.error('Transaction failed');
    return false;
  }
};

/**
 * Sell tokens for PXB
 */
export const sellTokens = async (
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  tokenQuantity: number,
  tokenPriceUSD: number
): Promise<boolean> => {
  try {
    // Check if user has enough tokens
    const { data: positionData, error: positionError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('tokenid', tokenId)
      .maybeSingle();
    
    if (positionError) {
      console.error('Error checking token position:', positionError);
      toast.error('Failed to verify your token balance');
      return false;
    }
    
    if (!positionData || positionData.quantity < tokenQuantity) {
      toast.error('Insufficient token balance');
      return false;
    }
    
    // Calculate PXB amount
    const pxbAmount = calculatePXBValue(tokenQuantity, tokenPriceUSD);
    
    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .single();
    
    if (userError || !userData) {
      toast.error('Failed to verify your PXB balance');
      return false;
    }
    
    // Get the user's ID
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }
    
    // Start transaction
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ points: userData.points + pxbAmount })
      .eq('id', userId);
    
    if (userUpdateError) {
      toast.error('Failed to update your PXB balance');
      return false;
    }
    
    // Record transaction
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'sell',
        quantity: tokenQuantity,
        price: tokenPriceUSD,
        pxbamount: pxbAmount,
        userid: userId
      });
    
    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Attempt to revert points
      await supabase
        .from('users')
        .update({ points: userData.points })
        .eq('id', userId);
      
      toast.error('Transaction failed');
      return false;
    }
    
    // Update position
    const newQuantity = positionData.quantity - tokenQuantity;
    if (newQuantity > 0) {
      const { error: updateError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          currentvalue: newQuantity * tokenPriceUSD,
          lastupdated: new Date().toISOString()
        })
        .eq('id', positionData.id);
      
      if (updateError) {
        console.error('Error updating token position:', updateError);
        toast.error('Failed to update your portfolio');
        return false;
      }
    } else {
      // Delete position if selling all tokens
      const { error: deleteError } = await supabase
        .from('token_portfolios')
        .delete()
        .eq('id', positionData.id);
      
      if (deleteError) {
        console.error('Error deleting token position:', deleteError);
        toast.error('Failed to update your portfolio');
        return false;
      }
    }
    
    toast.success(`Successfully sold ${tokenQuantity.toFixed(6)} ${tokenSymbol} for ${pxbAmount.toFixed(0)} PXB`);
    return true;
  } catch (error) {
    console.error('Error selling tokens:', error);
    toast.error('Transaction failed');
    return false;
  }
};

/**
 * Update token positions with current market prices
 */
export const updateTokenPortfolioValues = async (positions: TokenPosition[], tokenPriceMap: Record<string, number>): Promise<void> => {
  try {
    for (const position of positions) {
      const currentPrice = tokenPriceMap[position.tokenId];
      if (currentPrice) {
        const currentValue = position.quantity * currentPrice;
        
        await supabase
          .from('token_portfolios')
          .update({
            currentvalue: currentValue,
            lastupdated: new Date().toISOString()
          })
          .eq('id', position.id);
      }
    }
  } catch (error) {
    console.error('Error updating token portfolio values:', error);
  }
};
