
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

    console.log(`Buying tokens: userId=${userId}, tokenId=${tokenId}, pxbAmount=${pxbAmount}, marketCap=${tokenMarketCap}`);
    
    // Verify the current authenticated user matches the requested userId
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || authData.user.id !== userId) {
      console.error('Auth mismatch: Authenticated user does not match the requested user ID');
      toast.error('Authentication error. Please try again.');
      return false;
    }

    // Calculate how many tokens the user gets based on PXB and token market cap
    const pxbValue = pxbAmount * PXB_VIRTUAL_PRICE;
    const estimatedTokenQuantity = pxbValue / tokenMarketCap * 1000000; // Adjust for better precision
    
    // Get user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      toast.error('Could not verify points balance');
      return false;
    }
    
    if (userData.points < pxbAmount) {
      toast.error('Insufficient PXB points');
      return false;
    }
    
    // Start a transaction manually using multiple queries
    // 1. Deduct points from user
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: userData.points - pxbAmount })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user points:', updateError);
      toast.error('Failed to process transaction');
      return false;
    }
    
    // 2. Check if portfolio entry exists
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userId)
      .eq('tokenid', tokenId)
      .maybeSingle();
    
    if (portfolioError) {
      console.error('Error checking portfolio:', portfolioError);
      // Rollback points
      await supabase
        .from('users')
        .update({ points: userData.points })
        .eq('id', userId);
      toast.error('Failed to check portfolio status');
      return false;
    }
    
    // 3. Insert or update portfolio
    const tokenPrice = tokenMarketCap / 1000000;
    
    if (portfolioData) {
      // Update existing portfolio
      const newQuantity = portfolioData.quantity + estimatedTokenQuantity;
      const newAvgPrice = (portfolioData.quantity * portfolioData.averagepurchaseprice + 
                         estimatedTokenQuantity * tokenPrice) / newQuantity;
      
      const { error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({ 
          quantity: newQuantity,
          averagepurchaseprice: newAvgPrice,
          currentvalue: newQuantity * tokenPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('id', portfolioData.id);
        
      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        toast.error('Failed to update portfolio');
        return false;
      }
    } else {
      // Insert new portfolio entry
      console.log('Creating new portfolio entry with data:', {
        userid: userId,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        quantity: estimatedTokenQuantity,
        averagepurchaseprice: tokenPrice,
        currentvalue: estimatedTokenQuantity * tokenPrice
      });
      
      const { data, error: insertPortfolioError } = await supabase
        .from('token_portfolios')
        .insert({
          userid: userId,
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: estimatedTokenQuantity,
          averagepurchaseprice: tokenPrice,
          currentvalue: estimatedTokenQuantity * tokenPrice
        })
        .select()
        .single();
        
      if (insertPortfolioError) {
        console.error('Error creating portfolio:', insertPortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        toast.error('Failed to create portfolio: ' + insertPortfolioError.message);
        return false;
      }
      
      console.log('Created portfolio entry:', data);
    }
    
    // 4. Record transaction
    const { error: txError } = await supabase
      .from('token_transactions')
      .insert({
        userid: userId,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        quantity: estimatedTokenQuantity,
        price: tokenPrice,
        pxbamount: pxbAmount,
        type: 'buy'
      });
      
    if (txError) {
      console.error('Error recording transaction:', txError);
      // Note: We don't rollback here as the purchase succeeded
    }
    
    // 5. Record points history
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        amount: -pxbAmount,
        action: 'token_purchase',
        reference_id: tokenId
      });

    if (historyError) {
      console.error('Error recording points history:', historyError);
      // Note: We don't rollback here as the purchase succeeded
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

    // Verify the current authenticated user matches the requested userId
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || authData.user.id !== userId) {
      console.error('Auth mismatch: Authenticated user does not match the requested user ID');
      toast.error('Authentication error. Please try again.');
      return false;
    }

    // Calculate how many PXB points the user gets based on token quantity and market cap
    const tokenValue = tokenQuantity * (tokenMarketCap / 1000000);
    const estimatedPxbAmount = Math.floor(tokenValue / PXB_VIRTUAL_PRICE);
    
    // Check if user has enough tokens
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('userid', userId)
      .eq('tokenid', tokenId)
      .single();
    
    if (portfolioError || !portfolioData) {
      console.error('Error fetching portfolio:', portfolioError);
      toast.error('Could not find your token holdings');
      return false;
    }
    
    if (portfolioData.quantity < tokenQuantity) {
      toast.error(`You only have ${portfolioData.quantity} ${tokenSymbol}`);
      return false;
    }
    
    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      toast.error('Could not verify points balance');
      return false;
    }
    
    // Start manual transaction
    // 1. Add points to user
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: userData.points + estimatedPxbAmount })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user points:', updateError);
      toast.error('Failed to process transaction');
      return false;
    }
    
    // 2. Update portfolio
    const newQuantity = portfolioData.quantity - tokenQuantity;
    const tokenPrice = tokenMarketCap / 1000000;
    
    if (newQuantity > 0) {
      // Update existing portfolio
      const { error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({ 
          quantity: newQuantity,
          currentvalue: newQuantity * tokenPrice,
          lastupdated: new Date().toISOString()
        })
        .eq('id', portfolioData.id);
        
      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        toast.error('Failed to update portfolio');
        return false;
      }
    } else {
      // Delete portfolio entry if quantity is 0
      const { error: deletePortfolioError } = await supabase
        .from('token_portfolios')
        .delete()
        .eq('id', portfolioData.id);
        
      if (deletePortfolioError) {
        console.error('Error deleting portfolio:', deletePortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        toast.error('Failed to update portfolio');
        return false;
      }
    }
    
    // 3. Record transaction
    const { error: txError } = await supabase
      .from('token_transactions')
      .insert({
        userid: userId,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        quantity: tokenQuantity,
        price: tokenPrice,
        pxbamount: estimatedPxbAmount,
        type: 'sell'
      });
      
    if (txError) {
      console.error('Error recording transaction:', txError);
      // Note: We don't rollback here as the sale succeeded
    }
    
    // 4. Record points history
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        amount: estimatedPxbAmount,
        action: 'token_sale',
        reference_id: tokenId
      });

    if (historyError) {
      console.error('Error recording points history:', historyError);
      // Note: We don't rollback here as the sale succeeded
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
    // Verify the current authenticated user matches the requested userId
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || authData.user.id !== userId) {
      console.error('Auth mismatch: Authenticated user does not match the requested user ID');
      return [];
    }

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
    // Verify the current authenticated user matches the requested userId
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || authData.user.id !== userId) {
      console.error('Auth mismatch: Authenticated user does not match the requested user ID');
      return [];
    }
    
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
