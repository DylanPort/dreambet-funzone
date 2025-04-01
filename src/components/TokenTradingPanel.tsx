
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, RefreshCw, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  buyTokens, 
  sellTokens, 
  getUserTokenPosition, 
  TokenPosition, 
  calculateTokenQuantity,
  calculatePXBValue
} from '@/services/tokenTradingService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TokenTradingPanelProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
  refreshData: () => void;
}

const TokenTradingPanel: React.FC<TokenTradingPanelProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenPrice,
  refreshData
}) => {
  const { userProfile, fetchUserProfile } = usePXBPoints();
  const [activeTab, setActiveTab] = useState('buy');
  const [buyAmount, setBuyAmount] = useState<number>(100);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [sellQuantity, setSellQuantity] = useState<number>(0);
  const [maxSellQuantity, setMaxSellQuantity] = useState<number>(0);
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);
  const [estimatedPXB, setEstimatedPXB] = useState<number>(0);
  const [position, setPosition] = useState<TokenPosition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPnlPositive, setIsPnlPositive] = useState<boolean>(false);
  const [pnlPercentage, setPnlPercentage] = useState<number>(0);
  const [pnlValue, setPnlValue] = useState<number>(0);

  // Fetch user's position for this token
  useEffect(() => {
    const loadPosition = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      try {
        const tokenPosition = await getUserTokenPosition(tokenId);
        setPosition(tokenPosition);
        
        if (tokenPosition) {
          setMaxSellQuantity(tokenPosition.quantity);
          
          // Calculate PnL
          const currentValue = tokenPosition.quantity * tokenPrice;
          const costBasis = tokenPosition.quantity * tokenPosition.averagePurchasePrice;
          const pnl = currentValue - costBasis;
          const pnlPercent = (pnl / costBasis) * 100;
          
          setPnlValue(pnl);
          setPnlPercentage(pnlPercent);
          setIsPnlPositive(pnl >= 0);
        }
      } catch (error) {
        console.error('Error loading token position:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPosition();
  }, [tokenId, userProfile, tokenPrice]);

  // Calculate estimated tokens when buy amount changes
  useEffect(() => {
    if (tokenPrice <= 0 || buyAmount <= 0) {
      setEstimatedTokens(0);
      return;
    }
    
    setEstimatedTokens(calculateTokenQuantity(buyAmount, tokenPrice));
  }, [buyAmount, tokenPrice]);

  // Calculate estimated PXB when sell quantity changes
  useEffect(() => {
    if (tokenPrice <= 0 || sellQuantity <= 0) {
      setEstimatedPXB(0);
      return;
    }
    
    setEstimatedPXB(calculatePXBValue(sellQuantity, tokenPrice));
  }, [sellQuantity, tokenPrice]);

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBuyAmount(isNaN(value) ? 0 : value);
  };

  const handleSellQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const validValue = isNaN(value) ? 0 : Math.min(value, maxSellQuantity);
    setSellQuantity(validValue);
  };

  const handleBuyTokens = async () => {
    if (!userProfile) {
      toast.error('Please connect your wallet to trade');
      return;
    }
    
    if (buyAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (userProfile.pxbPoints < buyAmount) {
      toast.error('Insufficient PXB balance');
      return;
    }
    
    const success = await buyTokens(
      tokenId,
      tokenName,
      tokenSymbol,
      buyAmount,
      tokenPrice
    );
    
    if (success) {
      await fetchUserProfile();
      const tokenPosition = await getUserTokenPosition(tokenId);
      setPosition(tokenPosition);
      
      if (tokenPosition) {
        setMaxSellQuantity(tokenPosition.quantity);
      }
      
      setBuyAmount(100);
      refreshData();
    }
  };

  const handleSellTokens = async () => {
    if (!userProfile) {
      toast.error('Please connect your wallet to trade');
      return;
    }
    
    if (sellQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (!position || position.quantity < sellQuantity) {
      toast.error('Insufficient token balance');
      return;
    }
    
    const success = await sellTokens(
      tokenId,
      tokenName,
      tokenSymbol,
      sellQuantity,
      tokenPrice
    );
    
    if (success) {
      await fetchUserProfile();
      const tokenPosition = await getUserTokenPosition(tokenId);
      setPosition(tokenPosition);
      
      if (tokenPosition) {
        setMaxSellQuantity(tokenPosition.quantity);
      } else {
        setMaxSellQuantity(0);
      }
      
      setSellQuantity(0);
      refreshData();
    }
  };

  const refreshPosition = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      const tokenPosition = await getUserTokenPosition(tokenId);
      setPosition(tokenPosition);
      
      if (tokenPosition) {
        setMaxSellQuantity(tokenPosition.quantity);
        
        // Calculate PnL
        const currentValue = tokenPosition.quantity * tokenPrice;
        const costBasis = tokenPosition.quantity * tokenPosition.averagePurchasePrice;
        const pnl = currentValue - costBasis;
        const pnlPercent = (pnl / costBasis) * 100;
        
        setPnlValue(pnl);
        setPnlPercentage(pnlPercent);
        setIsPnlPositive(pnl >= 0);
      }
    } catch (error) {
      console.error('Error refreshing token position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel border border-dream-accent1/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-display flex items-center justify-between">
          <span>PXB Trading</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={refreshPosition}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Trade tokens using PXB points
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {position ? (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-dream-foreground/70">Your position</span>
              <span>{position.quantity.toFixed(6)} {tokenSymbol}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-dream-foreground/70">Value</span>
              <span>{(position.quantity * tokenPrice).toFixed(2)} USD ({Math.round(calculatePXBValue(position.quantity, tokenPrice))} PXB)</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-dream-foreground/70">Avg. price</span>
              <span>${position.averagePurchasePrice.toFixed(6)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-dream-foreground/70">PnL</span>
              <div className={`flex items-center ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPnlPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {pnlPercentage.toFixed(2)}% (${Math.abs(pnlValue).toFixed(2)})
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-dream-foreground/50">
              <span>Last updated</span>
              <span>{formatDistanceToNow(new Date(position.lastUpdated), { addSuffix: true })}</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="text-center py-2 mb-4 text-dream-foreground/70 text-sm">
            You don't have any {tokenSymbol} yet
          </div>
        )}
        
        <div className="bg-black/10 p-3 rounded-md mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dream-foreground/70">Current price</span>
            <span className="font-semibold">${tokenPrice.toFixed(6)}</span>
          </div>
        </div>
        
        <Tabs defaultValue="buy" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy" className="font-semibold">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="font-semibold" disabled={!position || position.quantity <= 0}>Sell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyAmount">PXB Amount</Label>
              <div className="flex">
                <Input
                  id="buyAmount"
                  type="number"
                  placeholder="Enter PXB amount"
                  value={buyAmount}
                  onChange={handleBuyAmountChange}
                />
                <Button
                  variant="secondary"
                  className="ml-2"
                  onClick={() => userProfile && setBuyAmount(userProfile.pxbPoints)}
                >
                  Max
                </Button>
              </div>
              <div className="text-xs text-dream-foreground/70">
                Available: {userProfile ? userProfile.pxbPoints.toLocaleString() : 0} PXB
              </div>
            </div>
            
            <div className="bg-black/10 p-3 rounded-md space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">You'll receive approximately</span>
                <span className="font-semibold">{estimatedTokens.toFixed(6)} {tokenSymbol}</span>
              </div>
              <div className="text-xs text-dream-foreground/50 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Price and quantity may change due to market fluctuations
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellQuantity">Token Quantity</Label>
              <div className="flex">
                <Input
                  id="sellQuantity"
                  type="number"
                  placeholder={`Enter ${tokenSymbol} amount`}
                  value={sellQuantity}
                  onChange={handleSellQuantityChange}
                  max={maxSellQuantity}
                />
                <Button
                  variant="secondary"
                  className="ml-2"
                  onClick={() => position && setSellQuantity(position.quantity)}
                >
                  Max
                </Button>
              </div>
              <div className="text-xs text-dream-foreground/70">
                Available: {position ? position.quantity.toFixed(6) : 0} {tokenSymbol}
              </div>
            </div>
            
            <div className="bg-black/10 p-3 rounded-md space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">You'll receive approximately</span>
                <span className="font-semibold">{Math.round(estimatedPXB)} PXB</span>
              </div>
              <div className="text-xs text-dream-foreground/50 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Price and quantity may change due to market fluctuations
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter>
        {activeTab === 'buy' ? (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 flex items-center"
            onClick={handleBuyTokens}
            disabled={!userProfile || buyAmount <= 0 || userProfile.pxbPoints < buyAmount}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Buy {tokenSymbol}
          </Button>
        ) : (
          <Button 
            className="w-full bg-red-500 hover:bg-red-600 flex items-center"
            onClick={handleSellTokens}
            disabled={!userProfile || !position || sellQuantity <= 0 || position.quantity < sellQuantity}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Sell {tokenSymbol}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TokenTradingPanel;
