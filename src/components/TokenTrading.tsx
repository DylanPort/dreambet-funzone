
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { supabase } from '@/integrations/supabase/client';

interface TokenTradingProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  currentPrice: number;
}

const TokenTrading: React.FC<TokenTradingProps> = ({
  tokenId, 
  tokenName,
  tokenSymbol,
  currentPrice
}) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [tokenQuantity, setTokenQuantity] = useState(100);
  const [pxbAmount, setPxbAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    userProfile,
    purchaseToken,
    sellToken,
  } = usePXBPoints();
  
  // Handle change in token quantity
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 0;
    setTokenQuantity(quantity);
    // Update PXB amount based on token quantity
    setPxbAmount(Math.round(quantity * currentPrice));
  };
  
  // Handle change in PXB amount
  const handlePxbAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value) || 0;
    setPxbAmount(amount);
    // Update token quantity based on PXB amount
    setTokenQuantity(Math.round(amount / currentPrice));
  };

  // Handle buying tokens
  const handleBuyTokens = async () => {
    if (!userProfile) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to purchase tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (pxbAmount <= 0 || tokenQuantity <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to purchase",
        variant: "destructive",
      });
      return;
    }
    
    if (pxbAmount > userProfile.pxbPoints) {
      toast({
        title: "Insufficient PXB",
        description: `You need ${pxbAmount} PXB to complete this purchase`,
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Use context method to purchase tokens
      const success = await purchaseToken(
        tokenId,
        tokenName,
        tokenSymbol,
        pxbAmount,
        tokenQuantity,
        currentPrice
      );
      
      if (success) {
        // Record this transaction in the bets table as well
        try {
          const { data: betData, error: betError } = await supabase
            .from('bets')
            .insert({
              token_mint: tokenId,
              token_name: tokenName,
              token_symbol: tokenSymbol,
              creator: userProfile.id,
              bettor1_id: userProfile.id,
              prediction_bettor1: 'up', // Buying is optimistic - betting the token will go up
              sol_amount: pxbAmount / 1000, // Convert PXB to SOL equivalent (for demo)
              duration: 86400, // 24 hours in seconds
              status: 'pending',
              initial_market_cap: currentPrice * tokenQuantity
            })
            .select('bet_id')
            .single();
          
          if (betError) {
            console.error('Error recording bet:', betError);
          } else {
            // Also record in bet_history
            await supabase
              .from('bet_history')
              .insert({
                bet_id: betData.bet_id,
                user_id: userProfile.id,
                action: 'created',
                details: { 
                  type: 'token_purchase', 
                  prediction: 'up', 
                  pxb_amount: pxbAmount,
                  token_quantity: tokenQuantity
                },
                market_cap_at_action: currentPrice * tokenQuantity
              });
          }
        } catch (err) {
          console.error('Error recording transaction in bet tables:', err);
        }
        
        toast({
          title: "Purchase Successful",
          description: `You purchased ${tokenQuantity} ${tokenSymbol} tokens`,
          variant: "default",
        });
      } else {
        throw new Error("Purchase failed");
      }
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle selling tokens
  const handleSellTokens = async () => {
    if (!userProfile) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to sell tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (tokenQuantity <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to sell",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Use context method to sell tokens
      const success = await sellToken(
        tokenId,
        tokenName,
        tokenSymbol,
        tokenQuantity,
        currentPrice
      );
      
      if (success) {
        // Record this transaction in the bets table as well
        try {
          const { data: betData, error: betError } = await supabase
            .from('bets')
            .insert({
              token_mint: tokenId,
              token_name: tokenName,
              token_symbol: tokenSymbol,
              creator: userProfile.id,
              bettor1_id: userProfile.id,
              prediction_bettor1: 'down', // Selling is pessimistic - betting the token will go down
              sol_amount: pxbAmount / 1000, // Convert PXB to SOL equivalent
              duration: 86400, // 24 hours in seconds
              status: 'pending',
              initial_market_cap: currentPrice * tokenQuantity
            })
            .select('bet_id')
            .single();
          
          if (betError) {
            console.error('Error recording bet:', betError);
          } else {
            // Also record in bet_history
            await supabase
              .from('bet_history')
              .insert({
                bet_id: betData.bet_id,
                user_id: userProfile.id,
                action: 'created',
                details: { 
                  type: 'token_sale', 
                  prediction: 'down', 
                  pxb_amount: pxbAmount,
                  token_quantity: tokenQuantity
                },
                market_cap_at_action: currentPrice * tokenQuantity
              });
          }
        } catch (err) {
          console.error('Error recording transaction in bet tables:', err);
        }
        
        toast({
          title: "Sale Successful",
          description: `You sold ${tokenQuantity} ${tokenSymbol} tokens for ${pxbAmount} PXB`,
          variant: "default",
        });
      } else {
        throw new Error("Sale failed");
      }
    } catch (error) {
      console.error("Error selling tokens:", error);
      toast({
        title: "Sale Failed",
        description: "There was an error processing your sale",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="glass-panel p-6 mb-8">
      <CardHeader>
        <CardTitle>Trade {tokenSymbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="buy" className="flex-1">Buy {tokenSymbol}</TabsTrigger>
            <TabsTrigger value="sell" className="flex-1">Sell {tokenSymbol}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">Token Quantity</label>
                <Input 
                  type="number" 
                  value={tokenQuantity} 
                  onChange={handleQuantityChange}
                  min="1"
                  className="bg-dream-background/30 border-dream-foreground/20"
                />
              </div>
              
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">PXB Amount</label>
                <Input 
                  type="number" 
                  value={pxbAmount} 
                  onChange={handlePxbAmountChange}
                  min="1"
                  className="bg-dream-background/30 border-dream-foreground/20"
                />
                <div className="text-xs text-dream-foreground/50 mt-1">
                  Current balance: {userProfile ? userProfile.pxbPoints.toLocaleString() : 0} PXB
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">Summary</label>
                <div className="bg-dream-background/30 p-4 rounded-md">
                  <div className="flex justify-between">
                    <span>Price per token:</span>
                    <span>{currentPrice.toFixed(6)} PXB</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Total cost:</span>
                    <span>{pxbAmount.toLocaleString()} PXB</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleBuyTokens} 
                disabled={isProcessing || !userProfile || pxbAmount > (userProfile?.pxbPoints || 0)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : `Buy ${tokenQuantity.toLocaleString()} ${tokenSymbol}`}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">Token Quantity</label>
                <Input 
                  type="number" 
                  value={tokenQuantity} 
                  onChange={handleQuantityChange}
                  min="1"
                  className="bg-dream-background/30 border-dream-foreground/20"
                />
              </div>
              
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">PXB to Receive</label>
                <Input 
                  type="number" 
                  value={pxbAmount} 
                  onChange={handlePxbAmountChange}
                  min="1"
                  className="bg-dream-background/30 border-dream-foreground/20"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm text-dream-foreground/70 mb-2">Summary</label>
                <div className="bg-dream-background/30 p-4 rounded-md">
                  <div className="flex justify-between">
                    <span>Price per token:</span>
                    <span>{currentPrice.toFixed(6)} PXB</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Total to receive:</span>
                    <span>{pxbAmount.toLocaleString()} PXB</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSellTokens} 
                disabled={isProcessing || !userProfile}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? "Processing..." : `Sell ${tokenQuantity.toLocaleString()} ${tokenSymbol}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenTrading;
