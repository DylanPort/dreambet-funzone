import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { TrendingUp, TrendingDown, Loader2, BarChart3, DollarSign, LineChart, RefreshCw, ArrowDown, ArrowUp, ShoppingCart, Trash2, User, Clock, Copy } from 'lucide-react';
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  marketCap?: number | null;
  volume24h?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TokenTrading: React.FC<TokenTradingProps> = ({ 
  tokenId, 
  tokenName, 
  tokenSymbol, 
  marketCap,
  volume24h,
  onSuccess,
  onCancel
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(marketCap || null);
  const [currentVolume, setCurrentVolume] = useState<number | null>(volume24h || null);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [initialPurchaseData, setInitialPurchaseData] = useState<{
    marketCap: number | null;
    volume: number | null;
    price: number;
    amount: number;
    tokenAmount: number;
  } | null>(null);

  const { toast } = useToast();
  const { userProfile, placeBet, mintPoints } = usePXBPoints();
  const pumpPortalService = usePumpPortalWebSocket();

  const exampleTransactions = [
    {
      id: 1,
      tokenSymbol: "POINTS",
      amount: 10,
      tokenAmount: 48954.34,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      userId: "1caaa7cc",
      percentageChange: -13.08,
      initialMarketCap: 204270,
      currentMarketCap: 177560,
      currentValue: 8.69,
      lastUpdated: new Date(Date.now() - 3000).toISOString(),
    },
    {
      id: 2,
      tokenSymbol: "PUMP",
      amount: 20,
      tokenAmount: 150000.25,
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      userId: "4f52b8e9",
      percentageChange: 8.42,
      initialMarketCap: 350000,
      currentMarketCap: 379470,
      currentValue: 21.68,
      lastUpdated: new Date(Date.now() - 45000).toISOString(),
    },
    {
      id: 3,
      tokenSymbol: "SUN",
      amount: 50,
      tokenAmount: 250000.78,
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      userId: "8e72c4a1",
      percentageChange: 22.5,
      initialMarketCap: 500000,
      currentMarketCap: 612500,
      currentValue: 61.25,
      lastUpdated: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 4,
      tokenSymbol: "MOON",
      amount: 15,
      tokenAmount: 75000.12,
      createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      userId: "6a9bd3c5",
      percentageChange: -5.32,
      initialMarketCap: 285000,
      currentMarketCap: 269840,
      currentValue: 14.2,
      lastUpdated: new Date(Date.now() - 300000).toISOString(),
    }
  ];

  useEffect(() => {
    if (currentMarketCap) {
      const totalSupply = 1_000_000_000;
      const calculatedPrice = currentMarketCap / totalSupply;
      setTokenPrice(calculatedPrice);
      
      if (amount > 0) {
        const tokensReceived = amount / calculatedPrice;
        setTokenAmount(tokensReceived);
      }
    }
  }, [currentMarketCap, amount]);

  const handleBuyTokens = async () => {
    if (!userProfile) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tokens",
        variant: "destructive",
      });
      return;
    }

    if (userProfile.pxbPoints < amount) {
      toast({
        title: "Insufficient PXB points",
        description: `You need at least ${amount} PXB points for this purchase`,
        variant: "destructive",
      });
      return;
    }

    if (!currentMarketCap) {
      toast({
        title: "Market cap unavailable",
        description: "Cannot calculate token price without market cap data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await placeBet(
        tokenId,
        tokenName,
        tokenSymbol,
        amount,
        'up',
        0,
        0
      );

      setInitialPurchaseData({
        marketCap: currentMarketCap,
        volume: currentVolume,
        price: tokenPrice,
        amount: amount,
        tokenAmount: tokenAmount
      });

      if (pumpPortalService.connected) {
        pumpPortalService.subscribeToToken(tokenId);
      }

      toast({
        title: "Purchase successful!",
        description: `You purchased ${tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenSymbol} tokens`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarketCap = (value: number | null) => {
    if (value === null) return "N/A";
    
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const calculatePercentageChange = () => {
    if (!initialPurchaseData || !currentMarketCap || initialPurchaseData.marketCap === null) {
      return 0;
    }
    
    const percentChange = ((currentMarketCap - initialPurchaseData.marketCap) / initialPurchaseData.marketCap) * 100;
    return percentChange;
  };

  const refreshMarketCap = async () => {
    if (currentMarketCap) {
      const change = Math.random() > 0.5 ? 1 + Math.random() * 0.05 : 1 - Math.random() * 0.03;
      setCurrentMarketCap(currentMarketCap * change);
      
      if (currentVolume) {
        const volumeChange = Math.random() > 0.5 ? 1 + Math.random() * 0.08 : 1 - Math.random() * 0.04;
        setCurrentVolume(currentVolume * volumeChange);
      }
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays}d ago`;
  };

  const renderExampleTransactionCard = (transaction: any) => {
    const isPositiveChange = transaction.percentageChange >= 0;
    
    return (
      <div key={transaction.id} className="bg-black/60 rounded-lg border border-white/10 mb-4 overflow-hidden hover:border-purple-500/40 transition-all duration-200 transform hover:translate-y-[-2px]">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${isPositiveChange ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                {transaction.tokenSymbol.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{transaction.tokenSymbol}</div>
                <div className="text-sm text-purple-400">PumpXBounty</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-purple-400">{transaction.amount} PXB</div>
              <div className="text-xs text-dream-foreground/70 flex items-center justify-end">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(transaction.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-black/40 rounded-md p-3 border border-white/5">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                PXB Used
              </div>
              <div className="font-bold text-white text-lg">{transaction.amount} PXB</div>
            </div>
            
            <div className="bg-black/40 rounded-md p-3 border border-white/5">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Tokens Received
              </div>
              <div className="font-bold text-white text-lg">
                {transaction.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="mt-3 bg-black/40 rounded-md p-3 border border-white/5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-full w-1 bg-gradient-to-t from-transparent to-purple-500/50"></div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-dream-foreground/60">Current PXB Value</div>
              <div className={`font-mono font-bold text-lg ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.currentValue.toFixed(2)} PXB
                <span className="ml-1 text-xs">
                  ({isPositiveChange ? '+' : ''}{transaction.percentageChange.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between items-center text-sm mb-1">
              <div className="text-dream-foreground/70 flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                Market Performance
              </div>
              <div className={`text-xs font-mono font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? '+' : ''}{transaction.percentageChange.toFixed(2)}%
              </div>
            </div>
            
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden relative">
              <div 
                className={`h-full ${isPositiveChange ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-pink-400'}`}
                style={{ width: `${Math.min(100, Math.abs(transaction.percentageChange))}%` }}
              >
                <div className="absolute inset-0 bg-black/10" 
                     style={{ 
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)`,
                       backgroundSize: '20px 20px',
                       animation: 'progress-stripe 1s linear infinite'
                     }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center text-xs bg-black/20 rounded-md p-2">
            <div>
              <span className="text-dream-foreground/60">Initial: </span>
              <span className="text-white">{formatMarketCap(transaction.initialMarketCap)}</span>
            </div>
            <div className="text-dream-foreground/40">→</div>
            <div>
              <span className="text-dream-foreground/60">Current: </span>
              <span className="text-white">{formatMarketCap(transaction.currentMarketCap)}</span>
              <span className="text-xs text-dream-foreground/40 ml-1">
                {formatTimeAgo(transaction.lastUpdated)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 mb-3 text-sm">
            <div className="flex items-center bg-black/20 rounded-md px-2 py-1">
              <User className="w-4 h-4 mr-1 text-dream-foreground/60" />
              <span className="text-dream-foreground/60 mr-1">Buyer</span>
              <span className="font-medium text-white">{transaction.userId}</span>
            </div>
            
            <div className={`flex items-center px-2 py-1 rounded-md ${isPositiveChange ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isPositiveChange ? 
                <TrendingUp className={`w-4 h-4 mr-1 text-green-400`} /> : 
                <TrendingDown className={`w-4 h-4 mr-1 text-red-400`} />
              }
              <span className={`font-semibold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? 'Profit' : 'Loss'}
              </span>
              <span className={`ml-2 font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(transaction.percentageChange).toFixed(2)}%
              </span>
            </div>
          </div>
          
          <Button 
            variant={isPositiveChange ? "default" : "destructive"} 
            className={`w-full ${isPositiveChange ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'}`}
          >
            Sell for {transaction.currentValue.toFixed(2)} PXB ({isPositiveChange ? '+' : ''}{transaction.percentageChange.toFixed(2)}%)
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="buy" className="text-base">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Tokens
          </TabsTrigger>
          <TabsTrigger value="sell" className="text-base">
            <Trash2 className="w-4 h-4 mr-2" />
            Sell Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Buy {tokenSymbol} Tokens</h3>
            <Button variant="ghost" size="sm" onClick={refreshMarketCap}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="bg-black/20 border border-dream-accent1/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-dream-foreground/70 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Current Market Cap
                  </p>
                  <p className="text-lg font-bold">{formatMarketCap(currentMarketCap)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-dream-foreground/70 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    24h Volume
                  </p>
                  <p className="text-lg font-bold">
                    {formatMarketCap(currentVolume)}
                  </p>
                </div>
              </div>
              
              {initialPurchaseData && (
                <div className="mt-4 pt-4 border-t border-dream-foreground/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-dream-foreground/70 flex items-center">
                        <LineChart className="w-4 h-4 mr-1" />
                        Purchase Market Cap
                      </p>
                      <p className="text-lg font-bold">{formatMarketCap(initialPurchaseData.marketCap)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-dream-foreground/70">Value Change</p>
                      <p className={`text-lg font-bold ${calculatePercentageChange() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {calculatePercentageChange() >= 0 ? '+' : ''}{calculatePercentageChange().toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-dream-foreground/70">Your Tokens</p>
                      <p className="text-lg font-bold">
                        {initialPurchaseData.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tokenSymbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-dream-foreground/70">Current Value</p>
                      <p className="text-lg font-bold">
                        {(initialPurchaseData.tokenAmount * tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} PXB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium">PXB Amount</label>
                <span className="text-sm text-dream-foreground/70">
                  Balance: {userProfile?.pxbPoints || 0} PXB
                </span>
              </div>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-sm text-dream-foreground/70">
                You will receive approximately {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tokenSymbol} tokens
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                className="w-1/2" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                className="w-1/2" 
                onClick={handleBuyTokens}
                disabled={isLoading || amount <= 0 || (userProfile && userProfile.pxbPoints < amount)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy Tokens
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Sell {tokenSymbol} Tokens</h3>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          <p className="text-sm text-dream-foreground/70">View and sell your token holdings</p>

          <ScrollArea className="h-[500px] rounded-md border border-white/10 bg-black/20 p-1">
            <div className="p-3">
              {exampleTransactions.map(transaction => renderExampleTransactionCard(transaction))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenTrading;
