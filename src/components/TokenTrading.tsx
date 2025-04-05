import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { TrendingUp, TrendingDown, Loader2, BarChart3, DollarSign, LineChart, RefreshCw } from 'lucide-react';
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  marketCap?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TokenTrading: React.FC<TokenTradingProps> = ({ 
  tokenId, 
  tokenName, 
  tokenSymbol, 
  marketCap,
  onSuccess,
  onCancel
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(marketCap || null);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [initialPurchaseData, setInitialPurchaseData] = useState<{
    marketCap: number | null;
    price: number;
    amount: number;
    tokenAmount: number;
  } | null>(null);

  const { toast } = useToast();
  const { userProfile, placeBet, mintPoints } = usePXBPoints();
  const pumpPortalService = usePumpPortalWebSocket();

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
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
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
                <DollarSign className="w-4 h-4 mr-1" />
                Token Price
              </p>
              <p className="text-lg font-bold">
                ${tokenPrice.toFixed(8)}
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
    </div>
  );
};

export default TokenTrading;
