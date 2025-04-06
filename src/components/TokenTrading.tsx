
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

interface TokenHolding {
  id: number;
  tokenSymbol: string;
  amount: number;
  tokenAmount: number;
  createdAt: string;
  userId: string;
  percentageChange: number;
  initialMarketCap: number;
  currentMarketCap: number;
  currentValue: number;
  lastUpdated: string;
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
  const [userTokenHoldings, setUserTokenHoldings] = useState<TokenHolding[]>([]);

  const { toast } = useToast();
  const { userProfile, placeBet, mintPoints } = usePXBPoints();
  const pumpPortalService = usePumpPortalWebSocket();

  // Updated to only show consolidated user holdings
  useEffect(() => {
    // Check if we already have a holding for this token
    if (initialPurchaseData) {
      const existingHoldingIndex = userTokenHoldings.findIndex(
        holding => holding.tokenSymbol === tokenSymbol
      );
      
      if (existingHoldingIndex >= 0) {
        // Update existing holding
        const updatedHoldings = [...userTokenHoldings];
        const existingHolding = updatedHoldings[existingHoldingIndex];
        
        updatedHoldings[existingHoldingIndex] = {
          ...existingHolding,
          amount: existingHolding.amount + initialPurchaseData.amount,
          tokenAmount: existingHolding.tokenAmount + initialPurchaseData.tokenAmount,
          lastUpdated: new Date().toISOString(),
          currentMarketCap: currentMarketCap || existingHolding.currentMarketCap,
          percentageChange: currentMarketCap && existingHolding.initialMarketCap 
            ? ((currentMarketCap - existingHolding.initialMarketCap) / existingHolding.initialMarketCap) * 100
            : existingHolding.percentageChange,
          currentValue: (existingHolding.tokenAmount + initialPurchaseData.tokenAmount) * tokenPrice
        };
        
        setUserTokenHoldings(updatedHoldings);
      } else {
        // Create new holding
        if (currentMarketCap) {
          const newHolding: TokenHolding = {
            id: Date.now(),
            tokenSymbol,
            amount: initialPurchaseData.amount,
            tokenAmount: initialPurchaseData.tokenAmount,
            createdAt: new Date().toISOString(),
            userId: userProfile?.id || "unknown", // Fix: Changed from wallet to id
            percentageChange: initialPurchaseData.marketCap 
              ? ((currentMarketCap - initialPurchaseData.marketCap) / initialPurchaseData.marketCap) * 100
              : 0,
            initialMarketCap: initialPurchaseData.marketCap || 0,
            currentMarketCap: currentMarketCap,
            currentValue: initialPurchaseData.tokenAmount * tokenPrice,
            lastUpdated: new Date().toISOString()
          };
          
          setUserTokenHoldings([...userTokenHoldings, newHolding]);
        }
      }
      
      // Clear the initial purchase data to prevent duplicate additions
      setInitialPurchaseData(null);
    }
  }, [initialPurchaseData, currentMarketCap, tokenPrice]);

  // Update current values periodically
  useEffect(() => {
    if (currentMarketCap && userTokenHoldings.length > 0) {
      const updatedHoldings = userTokenHoldings.map(holding => ({
        ...holding,
        currentMarketCap: currentMarketCap,
        percentageChange: holding.initialMarketCap 
          ? ((currentMarketCap - holding.initialMarketCap) / holding.initialMarketCap) * 100
          : holding.percentageChange,
        currentValue: holding.tokenAmount * tokenPrice,
        lastUpdated: new Date().toISOString()
      }));
      
      setUserTokenHoldings(updatedHoldings);
    }
  }, [currentMarketCap, tokenPrice]);

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

  const renderTokenHoldingCard = (holding: TokenHolding) => {
    const isPositiveChange = holding.percentageChange >= 0;
    
    return (
      <div key={holding.id} className="bg-black/60 rounded-lg border border-white/10 mb-2 overflow-hidden hover:border-purple-500/40 transition-all duration-200">
        <div className="p-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${isPositiveChange ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                {holding.tokenSymbol.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{holding.tokenSymbol}</div>
                <div className="text-[9px] text-purple-400">PumpXBounty</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-purple-400">{holding.amount} PXB</div>
              <div className="text-[9px] text-dream-foreground/70 flex items-center justify-end">
                <Clock className="w-2 h-2 mr-0.5" />
                {formatTimeAgo(holding.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1 mt-0.5">
            <div className="bg-black/40 rounded-md p-0.5 border border-white/5">
              <div className="text-[9px] text-dream-foreground/60 mb-0.5 flex items-center">
                <DollarSign className="w-2 h-2 mr-0.5" />
                PXB Used
              </div>
              <div className="font-bold text-white text-[10px]">{holding.amount} PXB</div>
            </div>
            
            <div className="bg-black/40 rounded-md p-0.5 border border-white/5">
              <div className="text-[9px] text-dream-foreground/60 mb-0.5 flex items-center">
                <ShoppingCart className="w-2 h-2 mr-0.5" />
                Tokens Received
              </div>
              <div className="font-bold text-white text-[10px]">
                {holding.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="mt-0.5 bg-black/40 rounded-md p-0.5 border border-white/5">
            <div className="flex justify-between items-center">
              <div className="text-[9px] text-dream-foreground/60">Current PXB Value</div>
              <div className={`font-mono text-[10px] font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {holding.currentValue.toFixed(2)} PXB
                <span className="ml-0.5 text-[8px]">
                  ({isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-0.5">
            <div className="flex justify-between items-center text-[9px] mb-0.5">
              <div className="text-dream-foreground/70 flex items-center">
                <BarChart3 className="w-2 h-2 mr-0.5" />
                Market Performance
              </div>
              <div className={`text-[9px] font-mono font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%
              </div>
            </div>
            
            <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isPositiveChange ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-pink-400'}`}
                style={{ width: `${Math.min(100, Math.abs(holding.percentageChange))}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-0.5 flex justify-between items-center text-[9px] bg-black/20 rounded-md px-1 py-0.5">
            <div>
              <span className="text-dream-foreground/60">Initial: </span>
              <span className="text-white">{formatMarketCap(holding.initialMarketCap)}</span>
            </div>
            <div className="text-dream-foreground/40">→</div>
            <div>
              <span className="text-dream-foreground/60">Current: </span>
              <span className="text-white">{formatMarketCap(holding.currentMarketCap)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-0.5 text-[9px]">
            <div className="flex items-center bg-black/20 rounded-md px-1 py-0.5">
              <User className="w-2 h-2 mr-0.5 text-dream-foreground/60" />
              <span className="text-dream-foreground/60 mr-0.5">You</span>
            </div>
            
            <div className={`flex items-center px-1 py-0.5 rounded-md ${isPositiveChange ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isPositiveChange ? 
                <TrendingUp className={`w-2 h-2 mr-0.5 text-green-400`} /> : 
                <TrendingDown className={`w-2 h-2 mr-0.5 text-red-400`} />
              }
              <span className={`font-semibold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? 'Profit' : 'Loss'}
              </span>
            </div>
          </div>
          
          <Button 
            variant={isPositiveChange ? "default" : "destructive"} 
            size="sm"
            className={`w-full text-[9px] py-0 mt-0.5 h-4 ${isPositiveChange ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'}`}
          >
            Sell for {holding.currentValue.toFixed(2)} PXB ({isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%)
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-4 space-y-4">
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
            <Button variant="ghost" size="sm" onClick={refreshMarketCap}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {userTokenHoldings.length > 0 ? (
            <>
              <p className="text-xs text-dream-foreground/70">Your token holdings for {tokenSymbol}</p>
              <ScrollArea className="h-[200px] rounded-md border border-white/10 bg-black/20 p-1">
                <div className="pr-1 pl-0.5 max-w-[95%]">
                  {userTokenHoldings
                    .filter(holding => holding.tokenSymbol === tokenSymbol)
                    .map(renderTokenHoldingCard)}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-dream-foreground/50">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>You don't have any {tokenSymbol} tokens yet.</p>
              <p className="text-sm mt-1">Purchase some tokens in the "Buy" tab to see them here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenTrading;
