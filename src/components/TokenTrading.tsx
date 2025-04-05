
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, ChevronsUpDown, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import {
  buyTokenWithPXB,
  sellTokenForPXB,
  calculatePXBAmount,
  calculateTokenQuantity,
  getUserTokenInPortfolio,
  PXB_VIRTUAL_PRICE
} from '@/services/tokenTradingService';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number;
  marketCap: number | null;
  onTradeComplete?: () => void;
}

const TokenTrading: React.FC<TokenTradingProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenPrice,
  marketCap,
  onTradeComplete
}) => {
  const [activeTab, setActiveTab] = useState<string>('buy');
  const [pxbAmount, setPxbAmount] = useState<number>(100);
  const [tokenQuantity, setTokenQuantity] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenValue, setTokenValue] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(10);
  const { connected } = useWallet();
  const { userProfile, refetchUserProfile } = usePXBPoints();

  // Calculate token quantity based on PXB amount or vice versa depending on active tab
  useEffect(() => {
    if (activeTab === 'buy') {
      const quantity = calculateTokenQuantity(pxbAmount, tokenPrice);
      setTokenQuantity(quantity);
    } else {
      const pxb = calculatePXBAmount(tokenPrice, tokenQuantity);
      setPxbAmount(pxb);
    }
  }, [pxbAmount, tokenPrice, tokenQuantity, activeTab]);

  // Fetch user's token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!connected || !tokenId) return;

      const portfolio = await getUserTokenInPortfolio(tokenId);
      if (portfolio) {
        setTokenBalance(portfolio.quantity);
        setTokenValue(portfolio.currentvalue);
      } else {
        setTokenBalance(0);
        setTokenValue(0);
      }
    };

    fetchTokenBalance();
  }, [connected, tokenId, isProcessing]);

  const handlePXBAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setPxbAmount(value);
    }
  };

  const handleTokenQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setTokenQuantity(value);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);

    if (activeTab === 'buy') {
      const maxPxb = userProfile?.pxbPoints || 0;
      const newAmount = (maxPxb * value) / 100;
      setPxbAmount(newAmount);
    } else {
      const newQuantity = (tokenBalance * value) / 100;
      setTokenQuantity(newQuantity);
    }
  };

  const handleMaxClick = () => {
    if (activeTab === 'buy') {
      setPxbAmount(userProfile?.pxbPoints || 0);
      setSliderValue(100);
    } else {
      setTokenQuantity(tokenBalance);
      setSliderValue(100);
    }
  };

  const handleBuyToken = async () => {
    if (!connected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (tokenPrice <= 0) {
      toast.error('Invalid token price');
      return;
    }

    if (pxbAmount <= 0 || tokenQuantity <= 0) {
      toast.error('Please enter valid amounts');
      return;
    }

    if (pxbAmount > (userProfile?.pxbPoints || 0)) {
      toast.error('Not enough PXB points');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await buyTokenWithPXB(
        tokenId,
        tokenName,
        tokenSymbol,
        pxbAmount,
        tokenPrice,
        tokenQuantity
      );

      if (success) {
        toast.success(`Successfully bought ${tokenQuantity.toFixed(4)} ${tokenSymbol}`);
        refetchUserProfile();
        if (onTradeComplete) onTradeComplete();
      } else {
        toast.error('Failed to buy token');
      }
    } catch (error) {
      console.error('Error buying token:', error);
      toast.error('Failed to buy token');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSellToken = async () => {
    if (!connected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (tokenPrice <= 0) {
      toast.error('Invalid token price');
      return;
    }

    if (tokenQuantity <= 0 || pxbAmount <= 0) {
      toast.error('Please enter valid amounts');
      return;
    }

    if (tokenQuantity > tokenBalance) {
      toast.error('Not enough tokens in your portfolio');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await sellTokenForPXB(
        tokenId,
        tokenName,
        tokenSymbol,
        tokenQuantity,
        tokenPrice,
        pxbAmount
      );

      if (success) {
        toast.success(`Successfully sold ${tokenQuantity.toFixed(4)} ${tokenSymbol} for ${pxbAmount.toFixed(2)} PXB`);
        refetchUserProfile();
        if (onTradeComplete) onTradeComplete();
      } else {
        toast.error('Failed to sell token');
      }
    } catch (error) {
      console.error('Error selling token:', error);
      toast.error('Failed to sell token');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-xl font-display font-bold flex items-center">
          <ArrowUpDown size={20} className="mr-2" />
          Trade {tokenSymbol}
        </CardTitle>
        <CardDescription>
          Use your PXB points to trade {tokenSymbol}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="buy" className="w-1/2">
              <TrendingUp size={16} className="mr-2" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="w-1/2">
              <TrendingDown size={16} className="mr-2" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Your PXB Balance</Label>
                <span className="font-semibold">{userProfile?.pxbPoints || 0} PXB</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pxbAmount">PXB Amount</Label>
                  <button 
                    className="text-xs text-dream-accent2 hover:underline"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </button>
                </div>
                <Input
                  id="pxbAmount"
                  type="number"
                  min="0"
                  value={pxbAmount}
                  onChange={handlePXBAmountChange}
                  className="bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dream-foreground/60">
                  <span>0%</span>
                  <span>{sliderValue}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex items-center justify-center p-2">
                <ChevronsUpDown size={20} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount ({tokenSymbol})</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  min="0"
                  value={tokenQuantity}
                  onChange={handleTokenQuantityChange}
                  className="bg-black/20"
                />
              </div>

              <div className="bg-black/30 p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Token Price:</span>
                  <span>${tokenPrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>PXB Rate:</span>
                  <span>1 PXB ≈ ${PXB_VIRTUAL_PRICE.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Cost:</span>
                  <span>{pxbAmount.toFixed(2)} PXB</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600" 
                onClick={handleBuyToken}
                disabled={isProcessing || !connected || pxbAmount <= 0 || pxbAmount > (userProfile?.pxbPoints || 0)}
              >
                {isProcessing ? 'Processing...' : `Buy ${tokenSymbol}`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sell">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Your {tokenSymbol} Balance</Label>
                <span className="font-semibold">{tokenBalance.toFixed(4)} {tokenSymbol}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tokenAmountSell">Token Amount ({tokenSymbol})</Label>
                  <button 
                    className="text-xs text-dream-accent2 hover:underline"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </button>
                </div>
                <Input
                  id="tokenAmountSell"
                  type="number"
                  min="0"
                  max={tokenBalance}
                  value={tokenQuantity}
                  onChange={handleTokenQuantityChange}
                  className="bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dream-foreground/60">
                  <span>0%</span>
                  <span>{sliderValue}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex items-center justify-center p-2">
                <ChevronsUpDown size={20} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pxbAmountSell">PXB Amount</Label>
                <Input
                  id="pxbAmountSell"
                  type="number"
                  min="0"
                  value={pxbAmount}
                  onChange={handlePXBAmountChange}
                  className="bg-black/20"
                />
              </div>

              <div className="bg-black/30 p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Token Price:</span>
                  <span>${tokenPrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>PXB Rate:</span>
                  <span>1 PXB ≈ ${PXB_VIRTUAL_PRICE.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Receive:</span>
                  <span>{pxbAmount.toFixed(2)} PXB</span>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-red-500 to-rose-600" 
                onClick={handleSellToken}
                disabled={isProcessing || !connected || tokenQuantity <= 0 || tokenQuantity > tokenBalance}
              >
                {isProcessing ? 'Processing...' : `Sell ${tokenSymbol}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenTrading;
