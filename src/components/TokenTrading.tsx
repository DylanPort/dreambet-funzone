import React, { useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: number; 
  onTradeComplete?: () => void;
}

const TokenTrading: React.FC<TokenTradingProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  tokenPrice,
  onTradeComplete
}) => {
  const { userProfile, purchaseToken, sellToken } = usePXBPoints();
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate the other field when one is changed
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numAmount = parseFloat(value);
    if (!isNaN(numAmount) && tokenPrice > 0) {
      setQuantity((numAmount / tokenPrice).toFixed(6));
    } else {
      setQuantity('');
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const numQuantity = parseFloat(value);
    if (!isNaN(numQuantity)) {
      setAmount((numQuantity * tokenPrice).toFixed(6));
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast.error('Please connect your wallet to trade');
      return;
    }
    
    const numAmount = parseFloat(amount);
    const numQuantity = parseFloat(quantity);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (tab === 'buy') {
        // Check if user has enough points
        if (numAmount > userProfile.pxbPoints) {
          toast.error('Insufficient PXB points');
          setIsSubmitting(false);
          return;
        }
        
        success = await purchaseToken(
          tokenId,
          tokenName,
          tokenSymbol,
          numAmount,
          numQuantity,
          tokenPrice
        );
        
        if (success) {
          toast.success(`Successfully purchased ${numQuantity.toLocaleString()} ${tokenSymbol} tokens!`);
          setAmount('');
          setQuantity('');
          if (onTradeComplete) onTradeComplete();
        } else {
          toast.error('Failed to purchase tokens');
        }
      } else {
        success = await sellToken(
          tokenId,
          tokenName,
          tokenSymbol,
          numQuantity,
          tokenPrice
        );
        
        if (success) {
          toast.success(`Successfully sold ${numQuantity.toLocaleString()} ${tokenSymbol} tokens!`);
          setAmount('');
          setQuantity('');
          if (onTradeComplete) onTradeComplete();
        } else {
          toast.error('Failed to sell tokens');
        }
      }
    } catch (error) {
      console.error('Error during token trade:', error);
      toast.error('An error occurred during the trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-dream-accent1/30 shadow-lg shadow-dream-accent1/5 backdrop-blur-lg bg-black/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-display">Trade {tokenSymbol} Token</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Buy</TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Sell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PXB)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-dream-accent1/10 border-dream-accent1/30"
                />
                <div className="text-xs text-dream-foreground/60 flex justify-between">
                  <span>Available: {userProfile ? userProfile.pxbPoints.toLocaleString() : '0'} PXB</span>
                  <button 
                    type="button" 
                    className="text-dream-accent2 hover:text-dream-accent1 transition-colors" 
                    onClick={() => userProfile && handleAmountChange(userProfile.pxbPoints.toString())}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-center my-2">
                <ArrowRight className="text-dream-foreground/40" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity ({tokenSymbol})</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="bg-dream-accent1/10 border-dream-accent1/30"
                />
                <div className="text-xs text-dream-foreground/60">
                  Price: {tokenPrice.toFixed(6)} PXB per {tokenSymbol}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-500/80 hover:bg-green-500 text-white"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              >
                {isSubmitting ? 'Processing...' : `Buy ${tokenSymbol}`}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="sell" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Quantity ({tokenSymbol})</Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="bg-dream-accent1/10 border-dream-accent1/30"
                />
                <div className="text-xs text-dream-foreground/60">
                  {/* In a real app, you would show the user's token balance here */}
                  <span>Your portfolio balance will be shown here</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center my-2">
                <ArrowRight className="text-dream-foreground/40" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sell-amount">Amount (PXB)</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-dream-accent1/10 border-dream-accent1/30"
                  readOnly
                />
                <div className="text-xs text-dream-foreground/60">
                  Price: {tokenPrice.toFixed(6)} PXB per {tokenSymbol}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-500/80 hover:bg-red-500 text-white"
                disabled={isSubmitting || !quantity || parseFloat(quantity) <= 0}
              >
                {isSubmitting ? 'Processing...' : `Sell ${tokenSymbol}`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenTrading;
