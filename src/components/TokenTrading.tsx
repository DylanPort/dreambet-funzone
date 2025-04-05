
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { 
  buyTokensWithPXB, 
  sellTokensForPXB, 
  getUserPortfolio,
  getTokenTransactions,
  TokenPortfolio,
  TokenTransaction
} from '@/services/tokenTradingService';
import { Loader2, TrendingUp, TrendingDown, ArrowUpDown, Clock, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMarketCap: number | null;
}

const TokenTrading: React.FC<TokenTradingProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenMarketCap
}) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPortfolio, setUserPortfolio] = useState<TokenPortfolio | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { userProfile, refetchUserProfile } = usePXBPoints();

  // Load user's portfolio and transaction history
  useEffect(() => {
    const loadUserData = async () => {
      if (!userProfile?.id || !tokenId) return;
      
      setIsLoading(true);
      try {
        // Get user's portfolio
        const portfolio = await getUserPortfolio(userProfile.id);
        const tokenPortfolio = portfolio.find(p => p.tokenid === tokenId) || null;
        setUserPortfolio(tokenPortfolio);

        // Get transaction history
        const txHistory = await getTokenTransactions(userProfile.id, tokenId);
        setTransactions(txHistory);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userProfile?.id, tokenId]);

  const handleBuy = async () => {
    if (!userProfile) {
      toast({
        title: "Not logged in",
        description: "Please connect your wallet to trade tokens",
        variant: "destructive"
      });
      return;
    }

    if (!tokenMarketCap) {
      toast({
        title: "Market cap unavailable",
        description: "Cannot determine token value without market cap",
        variant: "destructive"
      });
      return;
    }

    const pxbAmount = parseInt(amount);
    if (isNaN(pxbAmount) || pxbAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid PXB amount",
        variant: "destructive"
      });
      return;
    }

    if (pxbAmount > (userProfile.pxbPoints || 0)) {
      toast({
        title: "Insufficient PXB",
        description: "You don't have enough PXB points",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await buyTokensWithPXB(
        userProfile.id,
        tokenId,
        tokenName,
        tokenSymbol,
        pxbAmount,
        tokenMarketCap
      );

      if (success) {
        // Refresh user data
        await refetchUserProfile();
        
        // Reload portfolio and transactions
        const portfolio = await getUserPortfolio(userProfile.id);
        const tokenPortfolio = portfolio.find(p => p.tokenid === tokenId) || null;
        setUserPortfolio(tokenPortfolio);
        
        const txHistory = await getTokenTransactions(userProfile.id, tokenId);
        setTransactions(txHistory);
        
        setAmount('');
      }
    } catch (error) {
      console.error('Buy transaction error:', error);
      toast({
        title: "Transaction failed",
        description: "There was an error processing your purchase",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!userProfile) {
      toast({
        title: "Not logged in",
        description: "Please connect your wallet to trade tokens",
        variant: "destructive"
      });
      return;
    }

    if (!tokenMarketCap) {
      toast({
        title: "Market cap unavailable",
        description: "Cannot determine token value without market cap",
        variant: "destructive"
      });
      return;
    }

    if (!userPortfolio) {
      toast({
        title: "No tokens to sell",
        description: "You don't own any of these tokens",
        variant: "destructive"
      });
      return;
    }

    const sellAmount = parseFloat(amount);
    if (isNaN(sellAmount) || sellAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to sell",
        variant: "destructive"
      });
      return;
    }

    if (sellAmount > userPortfolio.quantity) {
      toast({
        title: "Insufficient tokens",
        description: `You only have ${userPortfolio.quantity} ${tokenSymbol}`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await sellTokensForPXB(
        userProfile.id,
        tokenId,
        tokenName,
        tokenSymbol,
        sellAmount,
        tokenMarketCap
      );

      if (success) {
        // Refresh user data
        await refetchUserProfile();
        
        // Reload portfolio and transactions
        const portfolio = await getUserPortfolio(userProfile.id);
        const tokenPortfolio = portfolio.find(p => p.tokenid === tokenId) || null;
        setUserPortfolio(tokenPortfolio);
        
        const txHistory = await getTokenTransactions(userProfile.id, tokenId);
        setTransactions(txHistory);
        
        setAmount('');
      }
    } catch (error) {
      console.error('Sell transaction error:', error);
      toast({
        title: "Transaction failed",
        description: "There was an error processing your sale",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNumber = (value: number | null | undefined, decimals = 6) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <h3 className="text-xl font-display font-bold mb-4 flex items-center">
        <ArrowUpDown className="mr-2 h-5 w-5 text-dream-accent1" />
        Token Trading
      </h3>

      {userProfile ? (
        <>
          {/* Portfolio Summary */}
          <Card className="bg-black/20 border border-dream-accent1/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-dream-accent2" />
                </div>
              ) : userPortfolio ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dream-foreground/60">Balance:</span>
                    <span className="font-medium">{formatNumber(userPortfolio.quantity)} {tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dream-foreground/60">Avg. Price:</span>
                    <span className="font-medium">${formatNumber(userPortfolio.averagepurchaseprice, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dream-foreground/60">Current Value:</span>
                    <span className="font-medium">${formatNumber(userPortfolio.currentvalue, 2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-dream-foreground/60 text-center py-2">
                  You don't own any {tokenSymbol} yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Trading Interface */}
          <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-black/30">
              <TabsTrigger value="buy" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                <TrendingUp className="w-4 h-4 mr-2" /> Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400">
                <TrendingDown className="w-4 h-4 mr-2" /> Sell
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dream-foreground/60">PXB Balance:</span>
                  <span className="font-medium">{formatNumber(userProfile.pxbPoints, 0)} PXB</span>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buy-amount" className="text-sm font-medium">
                    PXB Amount to Spend
                  </label>
                  <Input
                    id="buy-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter PXB amount"
                    className="bg-black/20 border-dream-accent1/20"
                  />
                </div>
                
                {amount && !isNaN(parseFloat(amount)) && tokenMarketCap && (
                  <div className="bg-black/20 p-3 rounded-md text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/70">You'll receive approximately:</span>
                      <span className="font-medium text-green-400">
                        {formatNumber((parseFloat(amount) * 6) / (tokenMarketCap / 1000000))} {tokenSymbol}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleBuy} 
                  disabled={isProcessing || !amount || isNaN(parseFloat(amount))}
                  className="w-full bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Buy {tokenSymbol}</>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="sell" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dream-foreground/60">Token Balance:</span>
                  <span className="font-medium">{formatNumber(userPortfolio?.quantity || 0)} {tokenSymbol}</span>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="sell-amount" className="text-sm font-medium">
                    Amount to Sell
                  </label>
                  <Input
                    id="sell-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter ${tokenSymbol} amount`}
                    className="bg-black/20 border-dream-accent1/20"
                  />
                </div>
                
                {amount && !isNaN(parseFloat(amount)) && tokenMarketCap && (
                  <div className="bg-black/20 p-3 rounded-md text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-dream-foreground/70">You'll receive approximately:</span>
                      <span className="font-medium text-green-400">
                        {formatNumber(Math.floor((parseFloat(amount) * (tokenMarketCap / 1000000)) / 6))} PXB
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleSell} 
                  disabled={isProcessing || !amount || isNaN(parseFloat(amount)) || !userPortfolio}
                  className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Sell {tokenSymbol}</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <Card className="bg-black/20 border border-dream-accent1/20 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-dream-accent2" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded bg-black/30">
                      <div className="flex items-center">
                        {tx.type === 'buy' ? (
                          <TrendingUp className="h-3 w-3 mr-2 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-2 text-red-400" />
                        )}
                        <div>
                          <div className="font-medium">
                            {tx.type === 'buy' ? 'Bought' : 'Sold'} {formatNumber(tx.quantity)} {tx.tokensymbol}
                          </div>
                          <div className="text-dream-foreground/50 flex items-center mt-0.5">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={tx.type === 'buy' ? 'text-red-400' : 'text-green-400'}>
                          {tx.type === 'buy' ? '-' : '+'}{formatNumber(tx.pxbamount, 0)} PXB
                        </div>
                        <div className="text-dream-foreground/50 flex items-center justify-end mt-0.5">
                          <DollarSign className="h-2.5 w-2.5 mr-1" />
                          ${formatNumber(tx.price, 8)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dream-foreground/60 text-center py-2">
                  No transactions yet
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-dream-foreground/70 mb-2">Connect your wallet to trade tokens</p>
          <Button size="sm">Connect Wallet</Button>
        </div>
      )}
    </div>
  );
};

export default TokenTrading;
