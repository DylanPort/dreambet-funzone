
import React, { useState } from 'react';
import { useTokenTrading } from '@/hooks/useTokenTrading';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowDown, 
  ArrowUp,
  RefreshCw,
  DollarSign,
  Wallet,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
}

const TokenTrading: React.FC<TokenTradingProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenPrice
}) => {
  const { userProfile } = usePXBPoints();
  const [tab, setTab] = useState<string>('buy');
  
  const {
    isLoading,
    portfolio,
    currentPrice,
    currentMarketCap,
    buyAmount,
    sellQuantity,
    pnl,
    pnlPercentage,
    hasTransactions,
    handleBuy,
    handleSell,
    setBuyAmount,
    setSellQuantity,
    maxBuyQuantity,
    isWalletConnected,
    refresh
  } = useTokenTrading(tokenId, tokenName, tokenSymbol);

  const maxPointsForBuy = userProfile?.pxbPoints || 0;
  const maxQuantityForSell = portfolio?.quantity || 0;

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString();
  };

  const renderHoldingsInfo = () => {
    if (!isWalletConnected) {
      return (
        <div className="text-center py-4 text-dream-foreground/70">
          Connect your wallet to trade tokens with PXB
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {hasTransactions ? (
          <>
            <div className="glass-panel border border-dream-accent1/20 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-dream-foreground/70">Your Position</div>
                <Button variant="ghost" size="sm" className="h-6 p-1" onClick={refresh}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-semibold">{portfolio?.quantity ? formatLargeNumber(portfolio.quantity) : '0'} {tokenSymbol}</div>
                  <div className="text-sm text-dream-foreground/70">
                    Worth {portfolio?.currentValue ? `${formatLargeNumber(portfolio.currentValue)} PXB` : '0 PXB'}
                  </div>
                </div>
                
                <div className={`flex flex-col items-end ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="flex items-center">
                    {pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{pnl >= 0 ? '+' : ''}{formatLargeNumber(pnl)} PXB</span>
                  </div>
                  <div className="text-sm">
                    {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-dream-foreground/10">
                <div className="flex justify-between text-xs text-dream-foreground/70">
                  <div>Entry Price: {formatPrice(portfolio?.averagePurchasePrice || 0)} PXB</div>
                  <div>Current Price: {formatPrice(currentPrice)} PXB</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel border border-dream-accent1/20 p-4 rounded-lg">
            <div className="text-center py-2">
              <div className="text-sm text-dream-foreground/70 mb-2">You don't own any {tokenSymbol} yet</div>
              <div className="text-xs">Use your PXB points to buy {tokenSymbol} and track its performance</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-display font-bold mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        Trade {tokenSymbol}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-dream-foreground/50 hover:text-dream-foreground">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-60">Trade virtual tokens using PXB points. These trades follow real market data but have no actual value.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>

      {renderHoldingsInfo()}

      <Tabs 
        value={tab} 
        onValueChange={setTab} 
        className="mt-4"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="buy" className="flex items-center">
            <PlusCircle className="h-4 w-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center">
            <MinusCircle className="h-4 w-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-dream-foreground/70">Current Price</div>
              <div className="text-sm font-medium">{formatPrice(currentPrice)} PXB</div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-dream-foreground/70">Amount (PXB)</label>
                <div className="text-xs text-dream-foreground/50">
                  Balance: {formatLargeNumber(maxPointsForBuy)} PXB
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Number(e.target.value))}
                  min={0}
                  max={maxPointsForBuy}
                  className="bg-black/20 border-dream-accent2/20"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBuyAmount(maxPointsForBuy)}
                  className="text-xs border-dream-accent2/50 hover:border-dream-accent2"
                >
                  Max
                </Button>
              </div>
              
              <div className="mt-2">
                <Slider 
                  value={[buyAmount]} 
                  min={0} 
                  max={maxPointsForBuy} 
                  step={1}
                  onValueChange={(values) => setBuyAmount(values[0])}
                />
              </div>
              
              <div className="flex justify-between text-xs text-dream-foreground/50 mt-1">
                <span>0</span>
                <span>{formatLargeNumber(maxPointsForBuy / 2)}</span>
                <span>{formatLargeNumber(maxPointsForBuy)}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-dream-foreground/70 mb-2">You will receive</div>
              <div className="p-3 rounded bg-black/30 border border-dream-accent2/20">
                <div className="flex justify-between items-center">
                  <div className="text-sm">{buyAmount > 0 && currentPrice > 0 ? formatLargeNumber(buyAmount / currentPrice) : '0'} {tokenSymbol}</div>
                  <div className="text-xs text-dream-foreground/50">≈ {buyAmount} PXB</div>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90"
              disabled={!isWalletConnected || isLoading || buyAmount <= 0 || buyAmount > maxPointsForBuy}
              onClick={() => handleBuy(buyAmount)}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Buy {tokenSymbol}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="sell" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-dream-foreground/70">Current Price</div>
              <div className="text-sm font-medium">{formatPrice(currentPrice)} PXB</div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-dream-foreground/70">Quantity ({tokenSymbol})</label>
                <div className="text-xs text-dream-foreground/50">
                  Available: {formatLargeNumber(maxQuantityForSell)} {tokenSymbol}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Number(e.target.value))}
                  min={0}
                  max={maxQuantityForSell}
                  disabled={maxQuantityForSell <= 0}
                  className="bg-black/20 border-dream-accent2/20"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSellQuantity(maxQuantityForSell)}
                  disabled={maxQuantityForSell <= 0}
                  className="text-xs border-dream-accent2/50 hover:border-dream-accent2"
                >
                  Max
                </Button>
              </div>
              
              <div className="mt-2">
                <Slider 
                  value={[sellQuantity]} 
                  min={0} 
                  max={maxQuantityForSell || 1} 
                  step={maxQuantityForSell > 100 ? maxQuantityForSell / 100 : 0.01}
                  disabled={maxQuantityForSell <= 0}
                  onValueChange={(values) => setSellQuantity(values[0])}
                />
              </div>
              
              <div className="flex justify-between text-xs text-dream-foreground/50 mt-1">
                <span>0</span>
                <span>{formatLargeNumber(maxQuantityForSell / 2)}</span>
                <span>{formatLargeNumber(maxQuantityForSell)}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-dream-foreground/70 mb-2">You will receive</div>
              <div className="p-3 rounded bg-black/30 border border-dream-accent2/20">
                <div className="flex justify-between items-center">
                  <div className="text-sm">{sellQuantity > 0 && currentPrice > 0 ? formatLargeNumber(sellQuantity * currentPrice) : '0'} PXB</div>
                  <div className="text-xs text-dream-foreground/50">≈ {sellQuantity} {tokenSymbol}</div>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:from-dream-accent1/90 hover:to-dream-accent2/90"
              disabled={!isWalletConnected || isLoading || sellQuantity <= 0 || sellQuantity > maxQuantityForSell || maxQuantityForSell <= 0}
              onClick={() => handleSell(sellQuantity)}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MinusCircle className="mr-2 h-4 w-4" />
              )}
              Sell {tokenSymbol}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenTrading;
