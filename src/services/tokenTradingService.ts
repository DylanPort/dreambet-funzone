import { supabase } from '@/integrations/supabase/client';
import { fetchDexScreenerData } from './dexScreenerService';
import { UserProfile } from '@/types/pxb';
import { toast } from 'sonner';

export interface TokenTransaction {
  id?: string;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  price: number;
  pxbAmount: number;
  type: 'buy' | 'sell';
  timestamp?: string;
}

export interface TokenPortfolio {
  id?: string;
  userId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  averagePurchasePrice: number;
  currentValue: number;
  lastUpdated?: string;
}

/**
 * Buys a token using PXB points and records the transaction
 */
export const buyToken = async (
  userProfile: UserProfile,
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  pxbAmount: number
): Promise<{ success: boolean; transaction?: TokenTransaction; updatedPortfolio?: TokenPortfolio }> => {
  if (!userProfile || !userProfile.id || pxbAmount <= 0) {
    return { success: false };
  }

  try {
    // Get the current token price from DexScreener
    const tokenData = await fetchDexScreenerData(tokenId);
    if (!tokenData || !tokenData.priceUsd) {
      console.error('Failed to fetch token price data');
      return { success: false };
    }

    const currentPrice = tokenData.priceUsd;
    const currentMarketCap = tokenData.marketCap || 0;

    // Calculate the quantity of tokens to buy based on PXB amount and current price
    // Using a simple conversion rate: 1 PXB = 1 USD value of token
    const quantity = pxbAmount / currentPrice;
    
    // Check if user has enough PXB points
    if (userProfile.pxbPoints < pxbAmount) {
      console.error('Not enough PXB points to make this purchase');
      return { success: false };
    }

    // 1. Deduct PXB points from user
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: userProfile.pxbPoints - pxbAmount })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error('Error updating user points:', updateError);
      return { success: false };
    }

    // 2. Record the transaction
    const transaction: TokenTransaction = {
      userId: userProfile.id,
      tokenId,
      tokenName,
      tokenSymbol,
      quantity,
      price: currentPrice,
      pxbAmount,
      type: 'buy'
    };

    const { data: transactionData, error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        userid: transaction.userId,
        tokenid: transaction.tokenId,
        tokenname: transaction.tokenName,
        tokensymbol: transaction.tokenSymbol,
        quantity: transaction.quantity,
        price: transaction.price,
        pxbamount: transaction.pxbAmount,
        type: transaction.type
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return { success: false };
    }

    // 3. Update or create portfolio entry
    // First check if user already has this token in portfolio
    const { data: existingPortfolio, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userProfile.id)
      .eq('tokenid', tokenId)
      .maybeSingle();

    let updatedPortfolio: TokenPortfolio;
    
    if (existingPortfolio) {
      // Update existing portfolio entry
      const newQuantity = existingPortfolio.quantity + quantity;
      const newAvgPrice = ((existingPortfolio.quantity * existingPortfolio.averagepurchaseprice) + (quantity * currentPrice)) / newQuantity;
      
      const { data: portfolioData, error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          averagepurchaseprice: newAvgPrice,
          currentvalue: newQuantity * currentPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('id', existingPortfolio.id)
        .select()
        .single();

      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        return { success: true, transaction }; // Still return true since transaction was recorded
      }

      updatedPortfolio = {
        id: portfolioData.id,
        userId: portfolioData.userid,
        tokenId: portfolioData.tokenid,
        tokenName: portfolioData.tokenname,
        tokenSymbol: portfolioData.tokensymbol,
        quantity: portfolioData.quantity,
        averagePurchasePrice: portfolioData.averagepurchaseprice,
        currentValue: portfolioData.currentvalue,
        lastUpdated: portfolioData.lastupdated
      };
    } else {
      // Create new portfolio entry
      const { data: portfolioData, error: createPortfolioError } = await supabase
        .from('token_portfolios')
        .insert({
          userid: userProfile.id,
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: quantity,
          averagepurchaseprice: currentPrice,
          currentvalue: quantity * currentPrice
        })
        .select()
        .single();

      if (createPortfolioError) {
        console.error('Error creating portfolio:', createPortfolioError);
        return { success: true, transaction }; // Still return true since transaction was recorded
      }

      updatedPortfolio = {
        id: portfolioData.id,
        userId: portfolioData.userid,
        tokenId: portfolioData.tokenid,
        tokenName: portfolioData.tokenname,
        tokenSymbol: portfolioData.tokensymbol,
        quantity: portfolioData.quantity,
        averagePurchasePrice: portfolioData.averagepurchaseprice,
        currentValue: portfolioData.currentvalue,
        lastUpdated: portfolioData.lastupdated
      };
    }

    // 4. Record points history
    await supabase.from('points_history').insert({
      user_id: userProfile.id,
      amount: -pxbAmount,
      action: 'token_purchase',
      reference_id: tokenId,
      reference_name: `Bought ${tokenSymbol}`
    });

    return { 
      success: true, 
      transaction: {
        ...transaction,
        id: transactionData.id,
        timestamp: transactionData.timestamp
      },
      updatedPortfolio
    };
  } catch (error) {
    console.error('Error in buyToken:', error);
    return { success: false };
  }
};

/**
 * Sells a token for PXB points and records the transaction
 */
export const sellToken = async (
  userProfile: UserProfile,
  tokenId: string,
  tokenName: string,
  tokenSymbol: string,
  quantity: number
): Promise<{ success: boolean; transaction?: TokenTransaction; updatedPortfolio?: TokenPortfolio }> => {
  if (!userProfile || !userProfile.id || quantity <= 0) {
    return { success: false };
  }

  try {
    // Check if user has the token in portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userProfile.id)
      .eq('tokenid', tokenId)
      .single();

    if (portfolioError || !portfolioData) {
      console.error('Token not found in portfolio:', portfolioError);
      return { success: false };
    }

    // Check if user has enough quantity to sell
    if (portfolioData.quantity < quantity) {
      console.error('Not enough tokens to sell');
      return { success: false };
    }

    // Get the current token price from DexScreener
    const tokenData = await fetchDexScreenerData(tokenId);
    if (!tokenData || !tokenData.priceUsd) {
      console.error('Failed to fetch token price data');
      return { success: false };
    }

    const currentPrice = tokenData.priceUsd;
    
    // Calculate PXB amount from sale (1 PXB = 1 USD value of token)
    const pxbAmount = quantity * currentPrice;

    // 1. Add PXB points to user
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: userProfile.pxbPoints + pxbAmount })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error('Error updating user points:', updateError);
      return { success: false };
    }

    // 2. Record the transaction
    const transaction: TokenTransaction = {
      userId: userProfile.id,
      tokenId,
      tokenName,
      tokenSymbol,
      quantity,
      price: currentPrice,
      pxbAmount,
      type: 'sell'
    };

    const { data: transactionData, error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        userid: transaction.userId,
        tokenid: transaction.tokenId,
        tokenname: transaction.tokenName,
        tokensymbol: transaction.tokenSymbol,
        quantity: transaction.quantity,
        price: transaction.price,
        pxbamount: transaction.pxbAmount,
        type: transaction.type
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return { success: false };
    }

    // 3. Update portfolio entry
    let updatedPortfolio: TokenPortfolio;
    const newQuantity = portfolioData.quantity - quantity;
    
    if (newQuantity > 0) {
      // Update existing portfolio entry
      const { data: updatedData, error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          currentvalue: newQuantity * currentPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('id', portfolioData.id)
        .select()
        .single();

      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        return { success: true, transaction }; // Still return true since transaction was recorded
      }

      updatedPortfolio = {
        id: updatedData.id,
        userId: updatedData.userid,
        tokenId: updatedData.tokenid,
        tokenName: updatedData.tokenname,
        tokenSymbol: updatedData.tokensymbol,
        quantity: updatedData.quantity,
        averagePurchasePrice: updatedData.averagepurchaseprice,
        currentValue: updatedData.currentvalue,
        lastUpdated: updatedData.lastupdated
      };
    } else {
      // Remove portfolio entry if quantity is zero
      const { error: deleteError } = await supabase
        .from('token_portfolios')
        .delete()
        .eq('id', portfolioData.id);

      if (deleteError) {
        console.error('Error deleting portfolio:', deleteError);
      }

      updatedPortfolio = {
        userId: portfolioData.userid,
        tokenId: portfolioData.tokenid,
        tokenName: portfolioData.tokenname,
        tokenSymbol: portfolioData.tokensymbol,
        quantity: 0,
        averagePurchasePrice: portfolioData.averagepurchaseprice,
        currentValue: 0
      };
    }

    // 4. Record points history
    await supabase.from('points_history').insert({
      user_id: userProfile.id,
      amount: pxbAmount,
      action: 'token_sale',
      reference_id: tokenId,
      reference_name: `Sold ${tokenSymbol}`
    });

    return { 
      success: true, 
      transaction: {
        ...transaction,
        id: transactionData.id,
        timestamp: transactionData.timestamp
      },
      updatedPortfolio
    };
  } catch (error) {
    console.error('Error in sellToken:', error);
    return { success: false };
  }
};

/**
 * Gets token portfolio for a user
 */
export const getUserTokenPortfolio = async (
  userId: string
): Promise<TokenPortfolio[]> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userId);

    if (error) {
      console.error('Error fetching user portfolio:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      userId: item.userid,
      tokenId: item.tokenid,
      tokenName: item.tokenname,
      tokenSymbol: item.tokensymbol,
      quantity: item.quantity,
      averagePurchasePrice: item.averagepurchaseprice,
      currentValue: item.currentvalue,
      lastUpdated: item.lastupdated
    }));
  } catch (error) {
    console.error('Error in getUserTokenPortfolio:', error);
    return [];
  }
};

/**
 * Gets token transactions for a user
 */
export const getUserTokenTransactions = async (
  userId: string,
  tokenId?: string
): Promise<TokenTransaction[]> => {
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
      console.error('Error fetching user transactions:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      userId: item.userid,
      tokenId: item.tokenid,
      tokenName: item.tokenname,
      tokenSymbol: item.tokensymbol,
      quantity: item.quantity,
      price: item.price,
      pxbAmount: item.pxbamount,
      type: item.type as 'buy' | 'sell',
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error in getUserTokenTransactions:', error);
    return [];
  }
};

/**
 * Gets a specific token portfolio for a user
 */
export const getUserTokenHolding = async (
  userId: string,
  tokenId: string
): Promise<TokenPortfolio | null> => {
  try {
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userId)
      .eq('tokenid', tokenId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.userid,
      tokenId: data.tokenid,
      tokenName: data.tokenname,
      tokenSymbol: data.tokensymbol,
      quantity: data.quantity,
      averagePurchasePrice: data.averagepurchaseprice,
      currentValue: data.currentvalue,
      lastUpdated: data.lastupdated
    };
  } catch (error) {
    console.error('Error in getUserTokenHolding:', error);
    return null;
  }
};

/**
 * Updates the current value of a token portfolio based on current market price
 */
export const updateTokenPortfolioValue = async (
  userId: string,
  tokenId: string
): Promise<TokenPortfolio | null> => {
  try {
    // Get current portfolio
    const portfolio = await getUserTokenHolding(userId, tokenId);
    if (!portfolio) return null;

    // Get current price
    const tokenData = await fetchDexScreenerData(tokenId);
    if (!tokenData || !tokenData.priceUsd) return portfolio;

    const currentPrice = tokenData.priceUsd;
    const newValue = portfolio.quantity * currentPrice;

    // Update current value
    const { data, error } = await supabase
      .from('token_portfolios')
      .update({
        currentvalue: newValue,
        lastupdated: new Date().toISOString()
      })
      .eq('userid', userId)
      .eq('tokenid', tokenId)
      .select()
      .single();

    if (error) {
      console.error('Error updating portfolio value:', error);
      return portfolio;
    }

    return {
      id: data.id,
      userId: data.userid,
      tokenId: data.tokenid,
      tokenName: data.tokenname,
      tokenSymbol: data.tokensymbol,
      quantity: data.quantity,
      averagePurchasePrice: data.averagepurchaseprice,
      currentValue: data.currentvalue,
      lastUpdated: data.lastupdated
    };
  } catch (error) {
    console.error('Error in updateTokenPortfolioValue:', error);
    return null;
  }
};
