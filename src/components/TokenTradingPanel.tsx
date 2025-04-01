
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { supabase } from '@/integrations/supabase/client';

interface TokenTradingPanelProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  currentPrice: number;
  marketCap: number | null;
}

const TokenTradingPanel: React.FC<TokenTradingPanelProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  currentPrice,
  marketCap,
}) => {
  const { userProfile, addPointsToUser } = usePXBPoints();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [tokenTransactions, setTokenTransactions] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [tokenCurrentValue, setTokenCurrentValue] = useState<number | null>(null);
  const [pnlPercentage, setPnlPercentage] = useState<number>(0);
  const [pnlAmount, setPnlAmount] = useState<number>(0);
  
  // Format numbers for display
  const formatNumber = (num: number | null, decimals = 2): string => {
    if (num === null) return '0';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };
  
  // Format currency for display
  const formatCurrency = (num: number | null): string => {
    if (num === null) return '$0.00';
    return `$${formatNumber(num)}`;
  };
  
  // Load user's portfolio data for this token
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!userProfile) {
        setIsLoadingPortfolio(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('token_portfolios')
          .select('*')
          .eq('userid', userProfile.id)
          .eq('tokenid', tokenId)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching portfolio data:', error);
          toast({
            title: 'Error loading portfolio',
            description: 'Could not load your portfolio data',
            variant: 'destructive',
          });
        }
        
        setPortfolioData(data || null);
        
        // Fetch transaction history
        const { data: transactions, error: transactionError } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('userid', userProfile.id)
          .eq('tokenid', tokenId)
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (transactionError) {
          console.error('Error fetching transaction history:', transactionError);
        }
        
        setTokenTransactions(transactions || []);
      } catch (error) {
        console.error('Error in fetchPortfolioData:', error);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };
    
    fetchPortfolioData();
  }, [userProfile, tokenId, toast]);
  
  // Update current value and PnL when price changes
  useEffect(() => {
    if (portfolioData && marketCap) {
      const newValue = portfolioData.quantity * currentPrice;
      setTokenCurrentValue(newValue);
      
      const invested = portfolioData.quantity * portfolioData.averagepurchaseprice;
      const pnlAmt = newValue - invested;
      setPnlAmount(pnlAmt);
      
      const pnlPct = invested > 0 ? (pnlAmt / invested) * 100 : 0;
      setPnlPercentage(pnlPct);
      
      // Update portfolio current value in database
      if (Math.abs((newValue - portfolioData.currentvalue) / portfolioData.currentvalue) > 0.01) {
        updatePortfolioValue(newValue);
      }
    }
  }, [portfolioData, currentPrice, marketCap]);
  
  const updatePortfolioValue = async (newValue: number) => {
    if (!userProfile || !portfolioData) return;
    
    try {
      await supabase
        .from('token_portfolios')
        .update({ currentvalue: newValue, lastupdated: new Date().toISOString() })
        .eq('id', portfolioData.id);
    } catch (error) {
      console.error('Error updating portfolio value:', error);
    }
  };
  
  const handleBuy = async () => {
    if (!userProfile) {
      toast({
        title: 'Not signed in',
        description: 'Please connect your wallet to trade',
        variant: 'destructive',
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount of PXB to spend',
        variant: 'destructive',
      });
      return;
    }
    
    const pxbAmount = parseFloat(amount);
    
    if (pxbAmount > (userProfile.points || 0)) {
      toast({
        title: 'Insufficient PXB',
        description: 'You do not have enough PXB points',
        variant: 'destructive',
      });
      return;
    }
    
    if (!currentPrice || !marketCap) {
      toast({
        title: 'Price data unavailable',
        description: 'Cannot execute trade without current market data',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Calculate token quantity based on PXB spend (1 PXB = $1 USD)
      const tokenQuantity = pxbAmount / currentPrice;
      
      // Update PXB balance
      const success = await addPointsToUser(-pxbAmount, `Purchased ${tokenSymbol}`);
      
      if (!success) {
        throw new Error('Failed to update PXB balance');
      }
      
      // Record transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          userid: userProfile.id,
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: tokenQuantity,
          price: currentPrice,
          pxbamount: pxbAmount,
          type: 'buy'
        })
        .select();
        
      if (transactionError) {
        console.error('Transaction record error:', transactionError);
        throw new Error('Failed to record transaction');
      }
      
      // Update or create portfolio entry
      if (portfolioData) {
        // Calculate new average purchase price
        const totalInvestment = portfolioData.quantity * portfolioData.averagepurchaseprice + pxbAmount;
        const newTotalQuantity = portfolioData.quantity + tokenQuantity;
        const newAvgPrice = totalInvestment / newTotalQuantity;
        
        const { error: updateError } = await supabase
          .from('token_portfolios')
          .update({
            quantity: newTotalQuantity,
            averagepurchaseprice: newAvgPrice,
            currentvalue: newTotalQuantity * currentPrice,
            lastupdated: new Date().toISOString()
          })
          .eq('id', portfolioData.id);
          
        if (updateError) {
          console.error('Portfolio update error:', updateError);
          throw new Error('Failed to update portfolio');
        }
        
        setPortfolioData({
          ...portfolioData,
          quantity: newTotalQuantity,
          averagepurchaseprice: newAvgPrice,
          currentvalue: newTotalQuantity * currentPrice
        });
      } else {
        // Create new portfolio entry
        const { data: newPortfolio, error: createError } = await supabase
          .from('token_portfolios')
          .insert({
            userid: userProfile.id,
            tokenid: tokenId,
            tokenname: tokenName,
            tokensymbol: tokenSymbol,
            quantity: tokenQuantity,
            averagepurchaseprice: currentPrice,
            currentvalue: tokenQuantity * currentPrice
          })
          .select();
          
        if (createError) {
          console.error('Portfolio creation error:', createError);
          throw new Error('Failed to create portfolio entry');
        }
        
        setPortfolioData(newPortfolio[0]);
      }
      
      // Update transaction history
      setTokenTransactions([transactionData[0], ...tokenTransactions]);
      
      toast({
        title: 'Purchase successful',
        description: `You purchased ${tokenQuantity.toFixed(4)} ${tokenSymbol} for ${pxbAmount} PXB`,
      });
      
      setAmount('');
    } catch (error) {
      console.error('Buy error:', error);
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSell = async () => {
    if (!userProfile || !portfolioData) {
      toast({
        title: !userProfile ? 'Not signed in' : 'No holdings',
        description: !userProfile 
          ? 'Please connect your wallet to trade' 
          : `You don't have any ${tokenSymbol} to sell`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount of tokens to sell',
        variant: 'destructive',
      });
      return;
    }
    
    const sellQuantity = parseFloat(amount);
    
    if (sellQuantity > portfolioData.quantity) {
      toast({
        title: 'Insufficient tokens',
        description: `You only have ${portfolioData.quantity.toFixed(4)} ${tokenSymbol}`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!currentPrice) {
      toast({
        title: 'Price data unavailable',
        description: 'Cannot execute trade without current price data',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Calculate PXB to receive (1 PXB = $1 USD)
      const pxbToReceive = sellQuantity * currentPrice;
      
      // Update PXB balance
      const success = await addPointsToUser(pxbToReceive, `Sold ${tokenSymbol}`);
      
      if (!success) {
        throw new Error('Failed to update PXB balance');
      }
      
      // Record transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          userid: userProfile.id,
          tokenid: tokenId,
          tokenname: tokenName,
          tokensymbol: tokenSymbol,
          quantity: sellQuantity,
          price: currentPrice,
          pxbamount: pxbToReceive,
          type: 'sell'
        })
        .select();
        
      if (transactionError) {
        console.error('Transaction record error:', transactionError);
        throw new Error('Failed to record transaction');
      }
      
      // Update portfolio entry
      const newQuantity = portfolioData.quantity - sellQuantity;
      
      if (newQuantity <= 0) {
        // Remove portfolio entry if all tokens sold
        const { error: deleteError } = await supabase
          .from('token_portfolios')
          .delete()
          .eq('id', portfolioData.id);
          
        if (deleteError) {
          console.error('Portfolio deletion error:', deleteError);
          throw new Error('Failed to update portfolio');
        }
        
        setPortfolioData(null);
      } else {
        // Update portfolio with remaining tokens
        const { error: updateError } = await supabase
          .from('token_portfolios')
          .update({
            quantity: newQuantity,
            currentvalue: newQuantity * currentPrice,
            lastupdated: new Date().toISOString()
          })
          .eq('id', portfolioData.id);
          
        if (updateError) {
          console.error('Portfolio update error:', updateError);
          throw new Error('Failed to update portfolio');
        }
        
        setPortfolioData({
          ...portfolioData,
          quantity: newQuantity,
          currentvalue: newQuantity * currentPrice
        });
      }
      
      // Update transaction history
      setTokenTransactions([transactionData[0], ...tokenTransactions]);
      
      toast({
        title: 'Sale successful',
        description: `You sold ${sellQuantity.toFixed(4)} ${tokenSymbol} for ${pxbToReceive.toFixed(2)} PXB`,
      });
      
      setAmount('');
    } catch (error) {
      console.error('Sell error:', error);
      toast({
        title: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMaxBuy = () => {
    if (!userProfile || !currentPrice) return;
    const maxBuyAmount = Math.floor(userProfile.points || 0);
    setAmount(maxBuyAmount.toString());
  };
  
  const handleMaxSell = () => {
    if (!portfolioData) return;
    setAmount(portfolioData.quantity.toString());
  };
  
  return (
    <div className="glass-panel p-6 space-y-6">
      <h3 className="text-xl font-display font-bold">Trade {tokenSymbol}</h3>
      
      {/* Portfolio Summary */}
      {isLoadingPortfolio ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : portfolioData ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-dream-foreground/70">Your Position</div>
            <div className="text-sm font-semibold">{formatNumber(portfolioData.quantity, 6)} {tokenSymbol}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-dream-foreground/70">Avg. Entry Price</div>
            <div className="text-sm font-semibold">${formatNumber(portfolioData.averagepurchaseprice, 6)}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-dream-foreground/70">Current Value</div>
            <div className="text-sm font-semibold">{formatNumber(tokenCurrentValue, 2)} PXB</div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-dream-foreground/70">Unrealized P&L</div>
            <div className={`text-sm font-semibold ${pnlAmount >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
              {pnlAmount >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {formatNumber(pnlAmount, 2)} PXB ({formatNumber(pnlPercentage, 2)}%)
            </div>
          </div>
          
          <Progress 
            value={50 + (pnlPercentage > 100 ? 50 : pnlPercentage < -100 ? -50 : pnlPercentage / 2)} 
            className="h-1.5" 
            indicatorClassName={pnlAmount >= 0 ? "bg-green-500" : "bg-red-500"}
          />
        </div>
      ) : (
        <div className="text-center py-4 text-dream-foreground/70">
          <p>You don't own any {tokenSymbol} yet.</p>
          <p className="text-sm mt-1">Buy some with your PXB points!</p>
        </div>
      )}
      
      {/* Trading Form */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount to ${portfolioData ? 'buy or sell' : 'buy'}`}
            className="flex-1"
            disabled={isProcessing || !userProfile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={portfolioData ? handleMaxSell : handleMaxBuy}
            disabled={isProcessing || !userProfile}
            className="text-xs h-10"
          >
            MAX
          </Button>
        </div>
        
        <div className="flex justify-between gap-2">
          <Button
            onClick={handleBuy}
            disabled={isProcessing || !userProfile || !amount || parseFloat(amount) <= 0}
            className="w-1/2 bg-green-600 hover:bg-green-700"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Buy
          </Button>
          
          <Button
            onClick={handleSell}
            disabled={isProcessing || !portfolioData || !amount || parseFloat(amount) <= 0}
            className="w-1/2 bg-red-600 hover:bg-red-700"
          >
            <TrendingDown className="w-4 h-4 mr-1" />
            Sell
          </Button>
        </div>
        
        {userProfile && (
          <div className="text-xs text-center text-dream-foreground/60">
            Available: {formatNumber(userProfile.points || 0)} PXB
          </div>
        )}
      </div>
      
      {/* Transaction History */}
      {tokenTransactions.length > 0 && (
        <div className="space-y-3 pt-3">
          <h4 className="text-sm font-semibold">Recent Transactions</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tokenTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex justify-between items-center p-2 bg-black/20 rounded-md text-xs"
              >
                <div className="flex items-center">
                  <span className={`${tx.type === 'buy' ? 'text-green-400' : 'text-red-400'} mr-2`}>
                    {tx.type === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                  <span>
                    {tx.type === 'buy' ? 'Bought' : 'Sold'} {formatNumber(tx.quantity, 6)} {tx.tokensymbol}
                  </span>
                </div>
                <div>
                  <span className={tx.type === 'buy' ? 'text-red-400' : 'text-green-400'}>
                    {tx.type === 'buy' ? '-' : '+'}{formatNumber(tx.pxbamount)} PXB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenTradingPanel;
