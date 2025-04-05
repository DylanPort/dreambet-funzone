
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Constants for PXB token
export const PXB_VIRTUAL_LIQUIDITY = 50000; // 50k liquidity
export const PXB_VIRTUAL_MARKET_CAP = 300000; // 300k market cap
export const PXB_VIRTUAL_PRICE = PXB_VIRTUAL_MARKET_CAP / PXB_VIRTUAL_LIQUIDITY; // Price per PXB

export interface TokenPortfolio {
  id: string;
  wallet_address: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  quantity: number;
  avg_price: number;
  current_value: number;
  updated_at: string;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  wallet_address: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  quantity: number;
  price: number;
  pxb_amount: number;
  type: 'buy' | 'sell';
  created_at: string;
}

// Helper function to get wallet address from localStorage
const getWalletAddress = (): string => {
  try {
    const walletData = localStorage.getItem('wallet_auth_data');
    if (!walletData) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const parsedData = JSON.parse(walletData);
    if (!parsedData.publicKey) {
      throw new Error('Wallet address not found. Please reconnect your wallet.');
    }
    
    return parsedData.publicKey;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw new Error('Please connect your wallet to continue.');
  }
};

// Helper function to ensure user exists
const ensureUserExists = async (walletAddress: string): Promise<string> => {
  try {
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, points')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    
    if (userError) {
      console.error('Error checking user:', userError);
      throw new Error('Error checking user account');
    }
    
    // If user exists, return the ID
    if (existingUser) {
      return existingUser.id;
    }
    
    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: walletAddress,
        username: `User_${walletAddress.substring(0, 8)}`,
        points: 5000 // Start with 5000 points
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating user:', createError);
      throw new Error('Failed to create user account');
    }
    
    console.log('Created new user account');
    return newUser.id;
    
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    throw error;
  }
};

// Get user points balance
export const getUserPoints = async (): Promise<number> => {
  try {
    const walletAddress = getWalletAddress();
    
    const { data, error } = await supabase
      .from('users')
      .select('points')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching points:', error);
      return 0;
    }
    
    return data?.points || 0;
  } catch (error) {
    console.error('Error in getUserPoints:', error);
    return 0;
  }
};

// Buy tokens
export const buyTokensWithPXB = async (
  tokenMint: string,
  tokenName: string,
  tokenSymbol: string,
  pxbAmount: number
): Promise<boolean> => {
  try {
    if (isNaN(pxbAmount) || pxbAmount <= 0) {
      throw new Error('Please enter a valid amount');
    }
    
    const walletAddress = getWalletAddress();
    console.log(`Processing purchase for ${walletAddress}`);
    
    // Get or create user
    const userId = await ensureUserExists(walletAddress);
    
    // Get current points
    const { data: userData, error: pointsError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
    
    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      throw new Error('Could not verify your PXB balance');
    }
    
    const currentPoints = userData.points;
    
    if (currentPoints < pxbAmount) {
      throw new Error(`Insufficient PXB balance. You have ${currentPoints} PXB.`);
    }
    
    // Calculate token amount from PXB
    const pxbValue = pxbAmount * PXB_VIRTUAL_PRICE;
    const estimatedTokenQty = pxbValue / (tokenMint.length * 0.01); // Simple formula for token valuation
    const tokenPrice = pxbValue / estimatedTokenQty;
    
    // Start transaction
    // 1. Deduct points
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: currentPoints - pxbAmount })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating points:', updateError);
      throw new Error('Transaction failed');
    }
    
    // 2. Update portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('token_mint', tokenMint)
      .maybeSingle();
      
    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('Error checking portfolio:', portfolioError);
      // Rollback points
      await supabase
        .from('users')
        .update({ points: currentPoints })
        .eq('id', userId);
      throw new Error('Transaction failed');
    }
    
    if (portfolioData) {
      // Update existing portfolio
      const newQuantity = parseFloat(portfolioData.quantity) + estimatedTokenQty;
      const avgPrice = ((parseFloat(portfolioData.quantity) * parseFloat(portfolioData.avg_price)) + 
                      (estimatedTokenQty * tokenPrice)) / newQuantity;
      
      const { error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          avg_price: avgPrice,
          current_value: newQuantity * tokenPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioData.id);
        
      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: currentPoints })
          .eq('id', userId);
        throw new Error('Transaction failed');
      }
    } else {
      // Create new portfolio entry
      const { error: createPortfolioError } = await supabase
        .from('token_portfolios')
        .insert({
          wallet_address: walletAddress,
          token_mint: tokenMint,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          quantity: estimatedTokenQty,
          avg_price: tokenPrice,
          current_value: estimatedTokenQty * tokenPrice
        });
        
      if (createPortfolioError) {
        console.error('Error creating portfolio:', createPortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: currentPoints })
          .eq('id', userId);
        throw new Error('Failed to update portfolio');
      }
    }
    
    // 3. Record transaction
    const { error: txError } = await supabase
      .from('token_transactions')
      .insert({
        wallet_address: walletAddress,
        token_mint: tokenMint,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        quantity: estimatedTokenQty,
        price: tokenPrice,
        pxb_amount: pxbAmount,
        type: 'buy'
      });
      
    if (txError) {
      console.error('Error recording transaction:', txError);
      // We don't rollback here as the purchase succeeded
    }
    
    toast.success(`Successfully bought ${estimatedTokenQty.toFixed(6)} ${tokenSymbol}`);
    return true;
    
  } catch (error) {
    console.error('Error in buyTokensWithPXB:', error);
    toast.error(error.message || 'Transaction failed');
    return false;
  }
};

// Sell tokens
export const sellTokensForPXB = async (
  tokenMint: string,
  tokenName: string,
  tokenSymbol: string,
  tokenQuantity: number
): Promise<boolean> => {
  try {
    if (isNaN(tokenQuantity) || tokenQuantity <= 0) {
      throw new Error('Please enter a valid amount');
    }
    
    const walletAddress = getWalletAddress();
    
    // Get or create user
    const userId = await ensureUserExists(walletAddress);
    
    // Check if user has enough tokens
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('token_mint', tokenMint)
      .maybeSingle();
      
    if (portfolioError) {
      console.error('Error checking portfolio:', portfolioError);
      throw new Error('Could not verify your token balance');
    }
    
    if (!portfolioData) {
      throw new Error(`You don't own any ${tokenSymbol}`);
    }
    
    if (parseFloat(portfolioData.quantity) < tokenQuantity) {
      throw new Error(`You only have ${portfolioData.quantity} ${tokenSymbol}`);
    }
    
    // Calculate PXB value
    const tokenPrice = portfolioData.current_value / portfolioData.quantity;
    const tokenValue = tokenQuantity * tokenPrice;
    const pxbAmount = Math.floor(tokenValue / PXB_VIRTUAL_PRICE);
    
    // Get current points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user:', userError);
      throw new Error('Could not verify your account');
    }
    
    // Start transaction
    // 1. Add points
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: userData.points + pxbAmount })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating points:', updateError);
      throw new Error('Transaction failed');
    }
    
    // 2. Update portfolio
    const newQuantity = parseFloat(portfolioData.quantity) - tokenQuantity;
    
    if (newQuantity > 0.000001) { // Keep small threshold to avoid floating point issues
      // Update portfolio
      const { error: updatePortfolioError } = await supabase
        .from('token_portfolios')
        .update({
          quantity: newQuantity,
          current_value: newQuantity * tokenPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioData.id);
        
      if (updatePortfolioError) {
        console.error('Error updating portfolio:', updatePortfolioError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        throw new Error('Failed to update portfolio');
      }
    } else {
      // Delete portfolio entry if quantity is effectively zero
      const { error: deleteError } = await supabase
        .from('token_portfolios')
        .delete()
        .eq('id', portfolioData.id);
        
      if (deleteError) {
        console.error('Error deleting portfolio:', deleteError);
        // Rollback points
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', userId);
        throw new Error('Failed to update portfolio');
      }
    }
    
    // 3. Record transaction
    const { error: txError } = await supabase
      .from('token_transactions')
      .insert({
        wallet_address: walletAddress,
        token_mint: tokenMint,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        quantity: tokenQuantity,
        price: tokenPrice,
        pxb_amount: pxbAmount,
        type: 'sell'
      });
      
    if (txError) {
      console.error('Error recording transaction:', txError);
      // We don't rollback here as the sale succeeded
    }
    
    toast.success(`Successfully sold ${tokenQuantity} ${tokenSymbol} for ${pxbAmount} PXB`);
    return true;
    
  } catch (error) {
    console.error('Error in sellTokensForPXB:', error);
    toast.error(error.message || 'Transaction failed');
    return false;
  }
};

// Get portfolio
export const getTokenPortfolio = async (walletAddress?: string): Promise<TokenPortfolio[]> => {
  try {
    const address = walletAddress || getWalletAddress();
    
    const { data, error } = await supabase
      .from('token_portfolios')
      .select('*')
      .eq('wallet_address', address);
      
    if (error) {
      console.error('Error fetching portfolio:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTokenPortfolio:', error);
    return [];
  }
};

// Get transaction history
export const getTradeHistory = async (walletAddress?: string, tokenMint?: string): Promise<TokenTransaction[]> => {
  try {
    const address = walletAddress || getWalletAddress();
    
    let query = supabase
      .from('token_transactions')
      .select('*')
      .eq('wallet_address', address)
      .order('created_at', { ascending: false });
      
    if (tokenMint) {
      query = query.eq('token_mint', tokenMint);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTradeHistory:', error);
    return [];
  }
};
