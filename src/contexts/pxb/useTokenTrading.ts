
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { TokenPortfolio, TokenTransaction } from './types';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { toast } from 'sonner';

export const useTokenTrading = (
  userProfile: any,
  setUserProfile: React.Dispatch<React.SetStateAction<any>>,
  fetchUserProfile: () => Promise<void>
) => {
  const { publicKey } = useWallet();
  const [tokenPortfolios, setTokenPortfolios] = useState<TokenPortfolio[]>([]);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch user's token portfolios
  const fetchTokenPortfolios = useCallback(async () => {
    if (!userProfile || !userProfile.id) return;
    
    try {
      setIsLoadingPortfolios(true);
      
      const { data, error } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('userid', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching token portfolios:', error);
        toast.error('Failed to load your token holdings');
        return;
      }
      
      // Update current values
      const updatedPortfolios = await Promise.all((data || []).map(async (portfolio) => {
        try {
          const metrics = await fetchTokenMetrics(portfolio.tokenid);
          if (metrics && metrics.marketCap !== null) {
            const totalSupply = metrics.marketCap / (metrics.priceUsd || 0.001); // Estimate if not available
            const currentPrice = metrics.marketCap / totalSupply;
            const currentValue = portfolio.quantity * currentPrice;
            
            // Update portfolio in database if value has changed significantly
            if (Math.abs(currentValue - portfolio.currentvalue) / portfolio.currentvalue > 0.01) {
              await supabase
                .from('token_portfolios')
                .update({ 
                  currentvalue: currentValue, 
                  lastupdated: new Date().toISOString() 
                })
                .eq('id', portfolio.id);
            }
            
            return {
              ...portfolio,
              currentValue: currentValue,
              // Map DB column names to our interface properties
              userId: portfolio.userid,
              tokenId: portfolio.tokenid,
              tokenName: portfolio.tokenname,
              tokenSymbol: portfolio.tokensymbol,
              averagePurchasePrice: portfolio.averagepurchaseprice,
              lastUpdated: portfolio.lastupdated
            };
          }
          return {
            ...portfolio,
            // Map DB column names to our interface properties
            userId: portfolio.userid,
            tokenId: portfolio.tokenid,
            tokenName: portfolio.tokenname,
            tokenSymbol: portfolio.tokensymbol,
            currentValue: portfolio.currentvalue,
            averagePurchasePrice: portfolio.averagepurchaseprice,
            lastUpdated: portfolio.lastupdated
          };
        } catch (err) {
          console.error(`Error updating portfolio value for ${portfolio.tokenname}:`, err);
          return {
            ...portfolio,
            // Map DB column names to our interface properties
            userId: portfolio.userid,
            tokenId: portfolio.tokenid,
            tokenName: portfolio.tokenname,
            tokenSymbol: portfolio.tokensymbol,
            currentValue: portfolio.currentvalue,
            averagePurchasePrice: portfolio.averagepurchaseprice,
            lastUpdated: portfolio.lastupdated
          };
        }
      }));
      
      setTokenPortfolios(updatedPortfolios);
    } catch (error) {
      console.error('Error in fetchTokenPortfolios:', error);
    } finally {
      setIsLoadingPortfolios(false);
    }
  }, [userProfile]);

  // Fetch user's token transactions
  const fetchTokenTransactions = useCallback(async () => {
    if (!userProfile || !userProfile.id) return;
    
    try {
      setIsLoadingTransactions(true);
      
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('userid', userProfile.id)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching token transactions:', error);
        toast.error('Failed to load your transaction history');
        return;
      }
      
      // Map DB column names to our interface properties
      const mappedTransactions = (data || []).map(tx => ({
        ...tx,
        userId: tx.userid,
        tokenId: tx.tokenid,
        tokenName: tx.tokenname,
        tokenSymbol: tx.tokensymbol,
        pxbAmount: tx.pxbamount
      }));
      
      setTokenTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error in fetchTokenTransactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userProfile]);

  // Purchase token with PXB points
  const purchaseToken = useCallback(async (
    tokenId: string,
    tokenName: string,
    tokenSymbol: string,
    pxbAmount: number
  ): Promise<boolean> => {
    if (!userProfile || !publicKey) {
      toast.error('Please connect your wallet to purchase tokens');
      return false;
    }

    if (pxbAmount <= 0) {
      toast.error('Purchase amount must be greater than zero');
      return false;
    }

    if (pxbAmount > userProfile.pxbPoints) {
      toast.error('Insufficient PXB points for this purchase');
      return false;
    }

    try {
      // First get token metrics to calculate token quantity
      const metrics = await fetchTokenMetrics(tokenId);
      if (!metrics || metrics.marketCap === null) {
        toast.error('Could not fetch token metrics');
        return false;
      }

      const totalSupply = metrics.marketCap / (metrics.priceUsd || 0.001); // Estimate if not available
      const tokenPrice = metrics.marketCap / totalSupply;
      const tokenQuantity = pxbAmount / tokenPrice;

      if (tokenQuantity <= 0) {
        toast.error('Invalid token quantity calculated');
        return false;
      }

      // Start transaction
      // 1. Deduct PXB points from user
      const newPointsBalance = userProfile.pxbPoints - pxbAmount;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPointsBalance })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error deducting points for token purchase:', updateError);
        toast.error('Failed to process token purchase');
        return false;
      }

      // 2. Record the transaction
      const { error: transactionError } = await supabase.from('token_transactions').insert({
        userid: userProfile.id,
        tokenid: tokenId,
        tokenname: tokenName,
        tokensymbol: tokenSymbol,
        type: 'buy',
        quantity: tokenQuantity,
        price: tokenPrice,
        pxbamount: pxbAmount,
        timestamp: new Date().toISOString()
      });

      if (transactionError) {
        console.error('Error recording token transaction:', transactionError);
        // Revert points deduction
        await supabase
          .from('users')
          .update({ points: userProfile.pxbPoints })
          .eq('id', userProfile.id);
        toast.error('Failed to record transaction');
        return false;
      }

      // 3. Add to or update portfolio
      // Check if user already owns this token
      const { data: existingPortfolio } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('userid', userProfile.id)
        .eq('tokenid', tokenId)
        .maybeSingle();

      if (existingPortfolio) {
        // Update existing portfolio
        const newQuantity = existingPortfolio.quantity + tokenQuantity;
        const newAveragePrice = ((existingPortfolio.quantity * existingPortfolio.averagepurchaseprice) + 
          (tokenQuantity * tokenPrice)) / newQuantity;
        const newValue = newQuantity * tokenPrice;

        const { error: updatePortfolioError } = await supabase
          .from('token_portfolios')
          .update({
            quantity: newQuantity,
            averagepurchaseprice: newAveragePrice,
            currentvalue: newValue,
            lastupdated: new Date().toISOString()
          })
          .eq('id', existingPortfolio.id);

        if (updatePortfolioError) {
          console.error('Error updating portfolio:', updatePortfolioError);
          toast.error('Failed to update portfolio');
          return false;
        }
      } else {
        // Create new portfolio entry
        const { error: createPortfolioError } = await supabase
          .from('token_portfolios')
          .insert({
            userid: userProfile.id,
            tokenid: tokenId,
            tokenname: tokenName,
            tokensymbol: tokenSymbol,
            quantity: tokenQuantity,
            averagepurchaseprice: tokenPrice,
            currentvalue: tokenQuantity * tokenPrice
          });

        if (createPortfolioError) {
          console.error('Error creating portfolio:', createPortfolioError);
          toast.error('Failed to create portfolio');
          return false;
        }
      }

      // 4. Add to points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: -pxbAmount,
        action: 'token_purchase',
        reference_id: tokenId,
        reference_name: tokenName
      });

      // 5. Update user profile in state
      setUserProfile({
        ...userProfile,
        pxbPoints: newPointsBalance
      });

      // 6. Refresh token portfolios and transactions
      fetchTokenPortfolios();
      fetchTokenTransactions();
      
      toast.success(`Successfully purchased ${tokenName} tokens!`);
      return true;
    } catch (error) {
      console.error('Error purchasing token:', error);
      toast.error('Failed to complete token purchase');
      return false;
    }
  }, [userProfile, publicKey, setUserProfile, fetchTokenPortfolios, fetchTokenTransactions]);

  // Sell token to receive PXB points
  const sellToken = useCallback(async (
    portfolioId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!userProfile || !publicKey) {
      toast.error('Please connect your wallet to sell tokens');
      return false;
    }

    try {
      // 1. Get the portfolio data
      const { data: portfolio, error: portfolioError } = await supabase
        .from('token_portfolios')
        .select('*')
        .eq('id', portfolioId)
        .eq('userid', userProfile.id)
        .single();

      if (portfolioError || !portfolio) {
        console.error('Error fetching portfolio for sale:', portfolioError);
        toast.error('Could not find the specified token portfolio');
        return false;
      }

      if (quantity <= 0 || quantity > portfolio.quantity) {
        toast.error(`Invalid quantity. You can sell up to ${portfolio.quantity} tokens`);
        return false;
      }

      // 2. Get current token price
      const metrics = await fetchTokenMetrics(portfolio.tokenid);
      if (!metrics || metrics.marketCap === null) {
        toast.error('Could not fetch current token price');
        return false;
      }

      const totalSupply = metrics.marketCap / (metrics.priceUsd || 0.001); // Estimate if not available
      const currentPrice = metrics.marketCap / totalSupply;
      const pxbAmount = quantity * currentPrice;

      // 3. Add PXB points to user
      const newPointsBalance = userProfile.pxbPoints + pxbAmount;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPointsBalance })
        .eq('id', userProfile.id);

      if (updateError) {
        console.error('Error adding points from token sale:', updateError);
        toast.error('Failed to process token sale');
        return false;
      }

      // 4. Record the transaction
      const { error: transactionError } = await supabase.from('token_transactions').insert({
        userid: userProfile.id,
        tokenid: portfolio.tokenid,
        tokenname: portfolio.tokenname,
        tokensymbol: portfolio.tokensymbol,
        type: 'sell',
        quantity,
        price: currentPrice,
        pxbamount: pxbAmount,
        timestamp: new Date().toISOString()
      });

      if (transactionError) {
        console.error('Error recording token sale transaction:', transactionError);
        // Revert points addition
        await supabase
          .from('users')
          .update({ points: userProfile.pxbPoints })
          .eq('id', userProfile.id);
        toast.error('Failed to record transaction');
        return false;
      }

      // 5. Update or remove portfolio
      if (quantity === portfolio.quantity) {
        // Remove portfolio if selling all tokens
        const { error: deleteError } = await supabase
          .from('token_portfolios')
          .delete()
          .eq('id', portfolioId);

        if (deleteError) {
          console.error('Error removing portfolio after full sale:', deleteError);
          toast.error('Failed to update your portfolio');
          return false;
        }
      } else {
        // Update portfolio if partial sale
        const remainingQuantity = portfolio.quantity - quantity;
        const newValue = remainingQuantity * currentPrice;

        const { error: updatePortfolioError } = await supabase
          .from('token_portfolios')
          .update({
            quantity: remainingQuantity,
            currentvalue: newValue,
            lastupdated: new Date().toISOString()
          })
          .eq('id', portfolioId);

        if (updatePortfolioError) {
          console.error('Error updating portfolio after partial sale:', updatePortfolioError);
          toast.error('Failed to update your portfolio');
          return false;
        }
      }

      // 6. Add to points history
      await supabase.from('points_history').insert({
        user_id: userProfile.id,
        amount: pxbAmount,
        action: 'token_sale',
        reference_id: portfolio.tokenid,
        reference_name: portfolio.tokenname
      });

      // 7. Update user profile in state
      setUserProfile({
        ...userProfile,
        pxbPoints: newPointsBalance
      });

      // 8. Refresh token portfolios and transactions
      fetchTokenPortfolios();
      fetchTokenTransactions();
      
      toast.success(`Successfully sold ${portfolio.tokenname} tokens for ${pxbAmount.toFixed(2)} PXB!`);
      return true;
    } catch (error) {
      console.error('Error selling token:', error);
      toast.error('Failed to complete token sale');
      return false;
    }
  }, [userProfile, publicKey, setUserProfile, fetchTokenPortfolios, fetchTokenTransactions]);

  return {
    tokenPortfolios,
    tokenTransactions,
    isLoadingPortfolios,
    isLoadingTransactions,
    fetchTokenPortfolios,
    fetchTokenTransactions,
    purchaseToken,
    sellToken
  };
};
