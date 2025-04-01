
import { useState, useCallback, useEffect } from 'react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { 
  buyToken, 
  sellToken, 
  getUserTokenHolding, 
  updateTokenPortfolioValue,
  TokenPortfolio,
  TokenTransaction
} from '@/services/tokenTradingService';
import { toast } from 'sonner';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

interface TokenTradingState {
  isLoading: boolean;
  portfolio: TokenPortfolio | null;
  currentPrice: number;
  currentMarketCap: number | null;
  buyAmount: number;
  sellQuantity: number;
  pnl: number;
  pnlPercentage: number;
  transactions: TokenTransaction[];
  hasTransactions: boolean;
}

export const useTokenTrading = (tokenId: string, tokenName: string, tokenSymbol: string) => {
  const { userProfile, fetchUserProfile } = usePXBPoints();
  const [state, setState] = useState<TokenTradingState>({
    isLoading: true,
    portfolio: null,
    currentPrice: 0,
    currentMarketCap: null,
    buyAmount: 100, // Default PXB amount to buy
    sellQuantity: 0,
    pnl: 0,
    pnlPercentage: 0,
    transactions: [],
    hasTransactions: false
  });

  // Load user's token holding and current price
  const loadData = useCallback(async () => {
    if (!userProfile) return;
    
    setState(prevState => ({ ...prevState, isLoading: true }));
    
    try {
      // Get token market data
      console.log(`Fetching data for token: ${tokenId}`);
      const tokenData = await fetchDexScreenerData(tokenId);
      
      if (!tokenData) {
        console.error(`Failed to fetch data for token: ${tokenId}`);
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      const currentPrice = tokenData?.priceUsd || 0;
      const currentMarketCap = tokenData?.marketCap || null;
      
      console.log(`Current price for ${tokenSymbol}: ${currentPrice}`);
      console.log(`Current market cap for ${tokenSymbol}: ${currentMarketCap}`);
      
      // Get user's token holding
      const portfolio = await getUserTokenHolding(userProfile.id, tokenId);
      
      // If portfolio exists, update it with current value
      let updatedPortfolio = portfolio;
      if (portfolio) {
        updatedPortfolio = await updateTokenPortfolioValue(userProfile.id, tokenId) || portfolio;
      }
      
      // Calculate PnL if portfolio exists
      let pnl = 0;
      let pnlPercentage = 0;
      
      if (updatedPortfolio && updatedPortfolio.quantity > 0) {
        const investmentValue = updatedPortfolio.quantity * updatedPortfolio.averagePurchasePrice;
        const currentValue = updatedPortfolio.quantity * currentPrice;
        pnl = currentValue - investmentValue;
        pnlPercentage = (pnl / investmentValue) * 100;
      }
      
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        portfolio: updatedPortfolio,
        currentPrice,
        currentMarketCap,
        sellQuantity: updatedPortfolio ? updatedPortfolio.quantity / 2 : 0, // Default to selling half of holdings
        pnl,
        pnlPercentage,
        hasTransactions: updatedPortfolio !== null && updatedPortfolio.quantity > 0
      }));
    } catch (error) {
      console.error('Error loading token trading data:', error);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  }, [userProfile, tokenId]);

  // Set up polling to update price and PnL
  useEffect(() => {
    if (!userProfile) return;
    
    loadData();
    
    // Update data every 30 seconds
    const intervalId = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [userProfile, loadData]);

  // Handle buy token
  const handleBuy = useCallback(async (amount: number) => {
    if (!userProfile) {
      toast.error('Please connect your wallet to trade');
      return false;
    }
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (amount > userProfile.pxbPoints) {
      toast.error('Not enough PXB points for this purchase');
      return false;
    }
    
    setState(prevState => ({ ...prevState, isLoading: true }));
    
    try {
      const result = await buyToken(
        userProfile,
        tokenId,
        tokenName,
        tokenSymbol,
        amount
      );
      
      if (result.success) {
        await fetchUserProfile(); // Refresh user profile to get updated points
        await loadData(); // Reload token data
        
        toast.success(`Successfully bought ${tokenSymbol} for ${amount} PXB`);
        return true;
      } else {
        toast.error('Failed to complete purchase');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Error buying token:', error);
      toast.error('An error occurred while processing your purchase');
      setState(prevState => ({ ...prevState, isLoading: false }));
      return false;
    }
  }, [userProfile, tokenId, tokenName, tokenSymbol, fetchUserProfile, loadData]);

  // Handle sell token
  const handleSell = useCallback(async (quantity: number) => {
    if (!userProfile || !state.portfolio) {
      toast.error('Please connect your wallet to trade');
      return false;
    }
    
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }
    
    if (quantity > state.portfolio.quantity) {
      toast.error(`You only have ${state.portfolio.quantity} ${tokenSymbol} to sell`);
      return false;
    }
    
    setState(prevState => ({ ...prevState, isLoading: true }));
    
    try {
      const result = await sellToken(
        userProfile,
        tokenId,
        tokenName,
        tokenSymbol,
        quantity
      );
      
      if (result.success) {
        await fetchUserProfile(); // Refresh user profile to get updated points
        await loadData(); // Reload token data
        
        const pxbAmount = result.transaction ? result.transaction.pxbAmount : quantity * state.currentPrice;
        toast.success(`Successfully sold ${tokenSymbol} for ${pxbAmount.toFixed(2)} PXB`);
        return true;
      } else {
        toast.error('Failed to complete sale');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Error selling token:', error);
      toast.error('An error occurred while processing your sale');
      setState(prevState => ({ ...prevState, isLoading: false }));
      return false;
    }
  }, [userProfile, tokenId, tokenName, tokenSymbol, state.portfolio, state.currentPrice, fetchUserProfile, loadData]);

  // Update buy amount
  const setBuyAmount = useCallback((amount: number) => {
    setState(prevState => ({ ...prevState, buyAmount: amount }));
  }, []);

  // Update sell quantity
  const setSellQuantity = useCallback((quantity: number) => {
    setState(prevState => ({ ...prevState, sellQuantity: quantity }));
  }, []);

  // Calculate max tokens that can be bought with current PXB balance
  const maxBuyQuantity = userProfile && state.currentPrice > 0 
    ? userProfile.pxbPoints / state.currentPrice 
    : 0;

  return {
    ...state,
    handleBuy,
    handleSell,
    setBuyAmount,
    setSellQuantity,
    maxBuyQuantity,
    isWalletConnected: !!userProfile,
    refresh: loadData
  };
};
