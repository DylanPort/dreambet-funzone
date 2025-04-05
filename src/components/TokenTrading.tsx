
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { 
  buyTokensWithPXB, 
  sellTokensForPXB, 
  getTokenPortfolio,
  getTradeHistory,
  getUserPoints,
  getTokenMarketCapData,
  PXB_VIRTUAL_LIQUIDITY,
  PXB_VIRTUAL_MARKET_CAP,
  PXB_VIRTUAL_PRICE
} from '@/services/tokenTradingService';
import { Loader2, TrendingUp, TrendingDown, ArrowUpDown, Clock, DollarSign, Info, RefreshCw, BarChart2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectButton from './WalletConnectButton';

interface TokenTradingProps {
  tokenId?: string; // For backward compatibility
  tokenMint?: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMarketCap?: number;
}

const TokenTrading: React.FC<TokenTradingProps> = ({ 
  tokenId, 
  tokenMint: propTokenMint, 
  tokenName, 
  tokenSymbol,
  tokenMarketCap 
}) => {
  // Use tokenId as fallback if tokenMint is not provided (for backward compatibility)
  const tokenMint = propTokenMint || tokenId || "";
  
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<string>('buy');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [pxbBalance, setPxbBalance] = useState<number>(0);
  const [marketCapData, setMarketCapData] = useState<{
    initialMarketCap: number;
    currentMarketCap: number;
    percentageChange: number;
  } | null>(null);
  const { toast } = useToast();

  // Load user data when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    } else {
      setPortfolio([]);
      setTradeHistory([]);
      setPxbBalance(0);
    }
  }, [connected, publicKey, tokenMint]);

  // Load market cap data when component mounts
  useEffect(() => {
    if (tokenMint) {
      loadMarketCapData();
    }
  }, [tokenMint]);

  const loadUserData = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setIsLoading(true);
      const walletAddress = publicKey.toString();
      
      // Load user data in parallel
      const [portfolioData, historyData, points] = await Promise.all([
        getTokenPortfolio(walletAddress),
        getTradeHistory(walletAddress, tokenMint),
        getUserPoints()
      ]);

      setPortfolio(portfolioData || []);
      setTradeHistory(historyData || []);
      setPxbBalance(points);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your trading data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarketCapData = async () => {
    try {
      const data = await getTokenMarketCapData(tokenMint);
      if (data) {
        setMarketCapData(data);
      } else if (tokenMarketCap) {
        // Use prop if available
        setMarketCapData({
          initialMarketCap: tokenMarketCap * 0.9, // Assume initial is 90% of current as fallback
          currentMarketCap: tokenMarketCap,
          percentageChange: 10 // Assume 10% growth as fallback
        });
      }
    } catch (error) {
      console.error('Error loading market cap data:', error);
    }
  };

  const handleTrade = async (tradeType: 'buy' | 'sell') => {
    if (!connected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to trade',
        variant: 'destructive',
      });
      return;
    }

    if (!tokenMint) {
      toast({
        title: 'Error',
        description: 'Token information is missing',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const amountValue = parseFloat(amount);
      let success = false;
      
      if (tradeType === 'buy') {
        success = await buyTokensWithPXB(tokenMint, tokenName, tokenSymbol, amountValue);
      } else {
        success = await sellTokensForPXB(tokenMint, tokenName, tokenSymbol, amountValue);
      }
      
      if (success) {
        // Refresh user data
        await loadUserData();
        // Refresh market cap data
        await loadMarketCapData();
        setAmount('');
      }
    } catch (error) {
      console.error('Error trading:', error);
      toast({
        title: 'Trade Failed',
        description: error.message || 'Failed to process the trade',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get current token holdings from portfolio
  const tokenHoldings = portfolio.find(p => p.tokenid === tokenMint);
  const currentHoldings = tokenHoldings ? Number(tokenHoldings.quantity) : 0;

  // Calculate estimated token amount for buy tab
  const calculateEstimatedTokens = (pxbAmount: number): number => {
    if (!pxbAmount || isNaN(pxbAmount) || pxbAmount <= 0) return 0;
    
    // Simple calculation based on PXB value and token mint address length
    // In a real app, you'd use a proper pricing formula based on market data
    const pxbValue = pxbAmount * PXB_VIRTUAL_PRICE;
    return pxbValue / (tokenMint.length * 0.01);
  };

  // Calculate estimated PXB amount for sell tab
  const calculateEstimatedPxb = (tokenAmount: number): number => {
    if (!tokenAmount || isNaN(tokenAmount) || tokenAmount <= 0 || !tokenHoldings) return 0;
    
    const tokenValue = tokenAmount * (tokenHoldings.currentvalue / tokenHoldings.quantity);
    return Math.floor(tokenValue / PXB_VIRTUAL_PRICE);
  };

  // Format number with commas and decimal places
  const formatNumber = (value: number | undefined | null, decimals = 6): string => {
    if (value === undefined || value === null || isNaN(Number(value))) return '0';
    return Number(value).toLocaleString(undefined, { 
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0
    });
  };

  return (
    <Card className="bg-black/20 border border-dream-accent1/20 rounded-xl overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-b border-white/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-display font-bold flex items-center">
            <ArrowUpDown className="w-5 h-5 mr-2 text-indigo-400" />
            Trade {tokenSymbol}
          </CardTitle>
          <div className="text-sm text-white/70 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>1 PXB ≈ ${PXB_VIRTUAL_PRICE.toFixed(2)}</span>
          </div>
        </div>
        <CardDescription className="text-white/60">
          Trade {tokenSymbol} using your PXB points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {connected ? (
          <>
            {marketCapData && (
              <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/20 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Market Cap
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadMarketCapData}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-black/20 rounded border border-white/5">
                    <div className="text-xs text-white/60">Initial</div>
                    <div className="font-medium">${formatNumber(marketCapData.initialMarketCap, 0)}</div>
                  </div>
                  <div className="p-2 bg-black/20 rounded border border-white/5">
                    <div className="text-xs text-white/60">Current</div>
                    <div className="font-medium">${formatNumber(marketCapData.currentMarketCap, 0)}</div>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-black/20 rounded border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">Change</span>
                    <span className={`text-sm font-medium ${marketCapData.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                      {marketCapData.percentageChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {marketCapData.percentageChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/20">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">Your PXB Balance:</span>
                <span className="font-medium">{formatNumber(pxbBalance, 0)} PXB</span>
              </div>
              {tokenHoldings && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Your {tokenSymbol} Balance:</span>
                  <span className="font-medium">{formatNumber(currentHoldings)} {tokenSymbol}</span>
                </div>
              )}
            </div>

            <Tabs 
              defaultValue="buy" 
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                setAmount('');
              }} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-black/40 mb-4">
                <TabsTrigger 
                  value="buy"
                  className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400"
                  disabled={isProcessing}
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Buy
                </TabsTrigger>
                <TabsTrigger 
                  value="sell"
                  className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-400"
                  disabled={isProcessing}
                >
                  <TrendingDown className="w-4 h-4 mr-2" /> Sell
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <label htmlFor="buy-amount" className="text-white/70">PXB Amount to Spend</label>
                  </div>
                  <Input
                    id="buy-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter PXB amount"
                    className="bg-black/20 border-indigo-500/30 focus:border-indigo-500/50"
                    disabled={isProcessing}
                    min="0"
                    step="1"
                  />
                </div>
                
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <div className="bg-green-950/20 p-3 rounded-md border border-green-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">You'll receive approximately:</span>
                      <span className="font-medium text-green-400">
                        {formatNumber(calculateEstimatedTokens(parseFloat(amount)))} {tokenSymbol}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => handleTrade('buy')} 
                  disabled={isProcessing || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > pxbBalance}
                  className="w-full bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 border border-green-500/30"
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
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <label htmlFor="sell-amount" className="text-white/70">Amount to Sell</label>
                  </div>
                  <Input
                    id="sell-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter ${tokenSymbol} amount`}
                    className="bg-black/20 border-red-500/30 focus:border-red-500/50"
                    disabled={isProcessing}
                    min="0"
                    max={currentHoldings}
                    step="any"
                  />
                </div>
                
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && tokenHoldings && (
                  <div className="bg-red-950/20 p-3 rounded-md border border-red-500/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">You'll receive approximately:</span>
                      <span className="font-medium text-green-400">
                        {formatNumber(calculateEstimatedPxb(parseFloat(amount)), 0)} PXB
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => handleTrade('sell')} 
                  disabled={isProcessing || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || parseFloat(amount) > currentHoldings || !tokenHoldings}
                  className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border border-red-500/30"
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
              </TabsContent>
            </Tabs>

            {/* Transaction History */}
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white/80">Transaction History</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadUserData}
                  disabled={isLoading}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : tradeHistory.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {tradeHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-md bg-black/30 border border-white/5">
                      <div className="flex items-center">
                        {tx.type === 'buy' ? (
                          <TrendingUp className="h-3 w-3 mr-2 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-2 text-red-400" />
                        )}
                        <div>
                          <div className="text-xs font-medium">
                            {tx.type === 'buy' ? 'Bought' : 'Sold'} {formatNumber(tx.quantity)} {tx.tokensymbol}
                          </div>
                          <div className="text-xs text-white/50 flex items-center mt-0.5">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {formatDistanceToNow(new Date(tx.created_at))} ago
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${tx.type === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.type === 'buy' ? '-' : '+'}{formatNumber(tx.pxbamount, 0)} PXB
                        </div>
                        <div className="text-xs text-white/50 flex items-center justify-end mt-0.5">
                          <DollarSign className="h-2.5 w-2.5 mr-1" />
                          ${formatNumber(tx.price, 6)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-white/50 text-sm border border-dashed border-white/10 rounded-lg">
                  No transactions yet for this token
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <div className="text-white/70 mb-2">Connect your wallet to trade tokens</div>
            <div className="flex justify-center">
              <WalletConnectButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenTrading;
