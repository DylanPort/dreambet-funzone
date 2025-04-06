
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import TokenTradeHistory from '@/components/TokenTradeHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from "@/components/ui/use-toast";
import { 
  Wallet, 
  ArrowUpDown, 
  TrendingUp, 
  PieChart, 
  Clock, 
  DollarSign,
  Calculator,
  Share2,
  ShoppingCart,
  Tags
} from 'lucide-react';
import { fetchTokenData, fetchTokenPrice } from '@/services/tokenDataService';
import html2canvas from 'html2canvas';

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  supply: number;
  priceChange24h: number;
  address: string;
}

const TokenTrading = () => {
  const { id: tokenId } = useParams<{ id: string }>();
  const { connected, publicKey } = useWallet();
  const { userProfile, purchaseToken, sellToken } = usePXBPoints();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState<string>('100');
  const [sellAmount, setSellAmount] = useState<string>('0');
  const [tokenQuantity, setTokenQuantity] = useState<number>(0);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [processingBuy, setProcessingBuy] = useState(false);
  const [processingSell, setProcessingSell] = useState(false);
  const [userHoldings, setUserHoldings] = useState<number>(0);
  
  // Fetch token data and user holdings
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenId) return;
      
      setLoading(true);
      try {
        const data = await fetchTokenData(tokenId);
        setTokenData(data);
        
        // Fetch token price
        const price = await fetchTokenPrice(tokenId);
        setTokenPrice(price);
        
        // Calculate token quantity for the current PXB amount
        calculateTokenQuantity(parseFloat(buyAmount), price);
      } catch (error) {
        console.error('Error loading token data:', error);
        toast({
          title: "Failed to load token data",
          description: "Could not fetch the token information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTokenData();
    
    // Fetch user's holdings of this token if authenticated
    const fetchUserHoldings = async () => {
      if (!connected || !userProfile || !tokenId) return;
      
      try {
        const { data, error } = await supabase
          .from('token_portfolios')
          .select('quantity')
          .eq('userid', userProfile.id)
          .eq('tokenid', tokenId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
          console.error('Error fetching user holdings:', error);
          return;
        }
        
        if (data) {
          setUserHoldings(data.quantity);
          setSellAmount(data.quantity.toString());
        } else {
          setUserHoldings(0);
          setSellAmount('0');
        }
      } catch (error) {
        console.error('Error fetching user holdings:', error);
      }
    };
    
    fetchUserHoldings();
  }, [tokenId, connected, userProfile]);
  
  // Calculate token quantity based on PXB amount
  const calculateTokenQuantity = (pxbAmount: number, price: number) => {
    if (isNaN(pxbAmount) || pxbAmount <= 0 || price <= 0) {
      setTokenQuantity(0);
      return;
    }
    
    const quantity = pxbAmount / price;
    setTokenQuantity(quantity);
  };
  
  // Handle buy amount change
  const handleBuyAmountChange = (value: string) => {
    setBuyAmount(value);
    const numValue = parseFloat(value);
    calculateTokenQuantity(numValue, tokenPrice);
  };
  
  // Handle buy token
  const handleBuyToken = async () => {
    if (!connected || !userProfile) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet to buy tokens",
        variant: "destructive"
      });
      return;
    }
    
    if (!tokenData || !tokenId) {
      toast({
        title: "Token data missing",
        description: "Could not find token data",
        variant: "destructive"
      });
      return;
    }
    
    const pxbAmount = parseFloat(buyAmount);
    if (isNaN(pxbAmount) || pxbAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid PXB amount",
        variant: "destructive"
      });
      return;
    }
    
    if (pxbAmount > userProfile.pxbPoints) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough PXB points",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingBuy(true);
    try {
      const success = await purchaseToken(
        tokenId,
        tokenData.name,
        tokenData.symbol,
        pxbAmount,
        tokenQuantity,
        tokenPrice
      );
      
      if (success) {
        toast({
          title: "Purchase successful!",
          description: `You bought ${tokenQuantity.toLocaleString()} ${tokenData.symbol}`,
        });
        
        // Update user holdings
        setUserHoldings(prev => prev + tokenQuantity);
        setSellAmount((prev => (parseFloat(prev) + tokenQuantity).toString()));
      } else {
        toast({
          title: "Purchase failed",
          description: "There was an error processing your purchase",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error buying token:', error);
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase",
        variant: "destructive"
      });
    } finally {
      setProcessingBuy(false);
    }
  };
  
  // Handle sell token
  const handleSellToken = async () => {
    if (!connected || !userProfile) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet to sell tokens",
        variant: "destructive"
      });
      return;
    }
    
    if (!tokenData || !tokenId) {
      toast({
        title: "Token data missing",
        description: "Could not find token data",
        variant: "destructive"
      });
      return;
    }
    
    const sellQuantity = parseFloat(sellAmount);
    if (isNaN(sellQuantity) || sellQuantity <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid quantity to sell",
        variant: "destructive"
      });
      return;
    }
    
    if (sellQuantity > userHoldings) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${userHoldings} ${tokenData.symbol}`,
        variant: "destructive"
      });
      return;
    }
    
    const pxbToReceive = sellQuantity * tokenPrice;
    
    setProcessingSell(true);
    try {
      const success = await sellToken(
        tokenId,
        tokenData.name,
        tokenData.symbol,
        sellQuantity,
        tokenPrice
      );
      
      if (success) {
        toast({
          title: "Sale successful!",
          description: `You sold ${sellQuantity.toLocaleString()} ${tokenData.symbol} for ${pxbToReceive.toLocaleString()} PXB`,
        });
        
        // Update user holdings
        setUserHoldings(prev => prev - sellQuantity);
        setSellAmount((prev => Math.max(0, parseFloat(prev) - sellQuantity).toString()));
      } else {
        toast({
          title: "Sale failed",
          description: "There was an error processing your sale",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error selling token:', error);
      toast({
        title: "Sale failed",
        description: "There was an error processing your sale",
        variant: "destructive"
      });
    } finally {
      setProcessingSell(false);
    }
  };
  
  // Take screenshot of trade card
  const takeTradeScreenshot = async () => {
    const tradeElement = document.getElementById('trade-card');
    if (!tradeElement) return;
    
    try {
      const canvas = await html2canvas(tradeElement);
      const image = canvas.toDataURL('image/jpeg', 0.9);
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = image;
      link.download = `${tokenData?.symbol || 'token'}-trade-${new Date().getTime()}.jpg`;
      link.click();
      
      toast({
        title: "Screenshot Saved",
        description: "Your trade card has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      toast({
        title: "Screenshot Failed",
        description: "There was an error taking the screenshot. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="glass-panel p-8 text-center">
              <div className="w-12 h-12 border-4 border-dream-accent1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dream-foreground/70">Loading token data...</p>
            </div>
          ) : !tokenData ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-dream-foreground/70 mb-4">Token not found</p>
              <Button asChild variant="outline">
                <Link to="/trading">Back to Trading</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 items-center mb-6">
                <h1 className="text-3xl font-display font-bold flex items-center">
                  {tokenData.name}
                  <span className="text-dream-foreground/60 ml-2 text-lg">
                    {tokenData.symbol}
                  </span>
                </h1>
                
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="sm" className="gap-1" onClick={takeTradeScreenshot}>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <div className="glass-panel p-6 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-dream-foreground/60 text-sm mb-1 flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>Price</span>
                        </div>
                        <div className="font-semibold">${tokenPrice.toFixed(6)}</div>
                        <div className={`text-xs ${tokenData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-dream-foreground/60 text-sm mb-1 flex items-center">
                          <PieChart className="w-3 h-3 mr-1" />
                          <span>Market Cap</span>
                        </div>
                        <div className="font-semibold">
                          {tokenData.marketCap >= 1000000
                            ? `$${(tokenData.marketCap / 1000000).toFixed(2)}M`
                            : `$${(tokenData.marketCap / 1000).toFixed(2)}K`}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-dream-foreground/60 text-sm mb-1 flex items-center">
                          <ArrowUpDown className="w-3 h-3 mr-1" />
                          <span>24h Volume</span>
                        </div>
                        <div className="font-semibold">
                          {tokenData.volume24h >= 1000000
                            ? `$${(tokenData.volume24h / 1000000).toFixed(2)}M`
                            : `$${(tokenData.volume24h / 1000).toFixed(2)}K`}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-dream-foreground/60 text-sm mb-1 flex items-center">
                          <Tags className="w-3 h-3 mr-1" />
                          <span>Total Supply</span>
                        </div>
                        <div className="font-semibold">
                          {tokenData.supply.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded-lg border border-white/10 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Your Holdings</h3>
                        <div className="text-xs text-dream-foreground/60">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Last updated: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {!connected ? (
                        <div className="text-center py-3">
                          <p className="text-dream-foreground/70 text-sm mb-2">Connect your wallet to see your holdings</p>
                        </div>
                      ) : userHoldings > 0 ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{userHoldings.toLocaleString()} {tokenData.symbol}</div>
                            <div className="text-sm text-dream-foreground/60">
                              ≈ {(userHoldings * tokenPrice).toLocaleString()} PXB
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="ml-2" onClick={() => setSellAmount(userHoldings.toString())}>
                            Sell All
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <p className="text-dream-foreground/70 text-sm">You don't own any {tokenData.symbol} yet</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Tabs defaultValue="buy" className="w-full">
                        <TabsList className="w-full mb-4">
                          <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
                          <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="buy">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                Amount to spend (PXB)
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={buyAmount}
                                  onChange={(e) => handleBuyAmountChange(e.target.value)}
                                  className="bg-black/30 border-white/10"
                                  min="0"
                                  step="1"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dream-foreground/60">
                                  PXB
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                Quick select amount
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {[100, 500, 1000, 5000].map((amount) => (
                                  <Button
                                    key={amount}
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleBuyAmountChange(amount.toString())}
                                    className={buyAmount === amount.toString() ? 'bg-dream-accent1/20 border-dream-accent1/50' : ''}
                                  >
                                    {amount}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                You will receive
                              </label>
                              <div className="bg-black/30 p-3 rounded-lg border border-white/10 flex justify-between">
                                <div className="font-medium">
                                  {tokenQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenData.symbol}
                                </div>
                                <div className="text-dream-foreground/60 text-sm">
                                  at ${tokenPrice.toFixed(6)} per token
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                              disabled={!connected || processingBuy || parseFloat(buyAmount) <= 0 || (userProfile && parseFloat(buyAmount) > userProfile.pxbPoints)}
                              onClick={handleBuyToken}
                            >
                              {processingBuy ? (
                                <div className="flex items-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Buy {tokenData.symbol}
                                </>
                              )}
                            </Button>
                            
                            {userProfile && parseFloat(buyAmount) > userProfile.pxbPoints && (
                              <div className="text-red-400 text-sm text-center">
                                Insufficient PXB balance. You need {parseFloat(buyAmount) - userProfile.pxbPoints} more PXB.
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="sell">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                Amount to sell ({tokenData.symbol})
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={sellAmount}
                                  onChange={(e) => setSellAmount(e.target.value)}
                                  className="bg-black/30 border-white/10"
                                  min="0"
                                  max={userHoldings.toString()}
                                  step="0.000001"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dream-foreground/60">
                                  {tokenData.symbol}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                Percentage of holdings
                              </label>
                              <Slider
                                defaultValue={[0]}
                                max={100}
                                step={1}
                                value={[userHoldings > 0 ? (parseFloat(sellAmount) / userHoldings) * 100 : 0]}
                                onValueChange={(value) => {
                                  const percentage = value[0];
                                  const amount = (percentage / 100) * userHoldings;
                                  setSellAmount(amount.toString());
                                }}
                              />
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {[25, 50, 75, 100].map((percentage) => (
                                  <Button
                                    key={percentage}
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSellAmount(((percentage / 100) * userHoldings).toString())}
                                    disabled={userHoldings <= 0}
                                  >
                                    {percentage}%
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm text-dream-foreground/60 mb-1 block">
                                You will receive
                              </label>
                              <div className="bg-black/30 p-3 rounded-lg border border-white/10 flex justify-between">
                                <div className="font-medium">
                                  {(parseFloat(sellAmount || '0') * tokenPrice).toLocaleString()} PXB
                                </div>
                                <div className="text-dream-foreground/60 text-sm">
                                  at ${tokenPrice.toFixed(6)} per token
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              className="w-full bg-red-500 hover:bg-red-600 text-white"
                              disabled={!connected || processingSell || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > userHoldings}
                              onClick={handleSellToken}
                            >
                              {processingSell ? (
                                <div className="flex items-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                <>
                                  <ArrowUpDown className="w-4 h-4 mr-2" />
                                  Sell {tokenData.symbol}
                                </>
                              )}
                            </Button>
                            
                            {parseFloat(sellAmount) > userHoldings && (
                              <div className="text-red-400 text-sm text-center">
                                Insufficient {tokenData.symbol} balance. You only have {userHoldings.toLocaleString()} {tokenData.symbol}.
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div id="trade-card" className="glass-panel p-6">
                    <TokenTradeHistory tokenId={tokenId!} />
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="glass-panel p-6 mb-6 sticky top-24">
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-dream-accent1" />
                      Trade Calculator
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-dream-foreground/60 mb-1 block">
                          Token price (USD)
                        </label>
                        <div className="font-medium text-xl">${tokenPrice.toFixed(6)}</div>
                      </div>
                      
                      <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                        <h3 className="font-semibold mb-2">PXB to {tokenData.symbol}</h3>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="col-span-1 text-dream-foreground/60">100 PXB</div>
                          <div className="col-span-3">{(100 / tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenData.symbol}</div>
                          
                          <div className="col-span-1 text-dream-foreground/60">500 PXB</div>
                          <div className="col-span-3">{(500 / tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenData.symbol}</div>
                          
                          <div className="col-span-1 text-dream-foreground/60">1,000 PXB</div>
                          <div className="col-span-3">{(1000 / tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenData.symbol}</div>
                          
                          <div className="col-span-1 text-dream-foreground/60">5,000 PXB</div>
                          <div className="col-span-3">{(5000 / tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenData.symbol}</div>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                        <h3 className="font-semibold mb-2">{tokenData.symbol} to PXB</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="col-span-2">1 {tokenData.symbol}</div>
                          <div className="col-span-1">{tokenPrice.toLocaleString()} PXB</div>
                          
                          <div className="col-span-2">10 {tokenData.symbol}</div>
                          <div className="col-span-1">{(10 * tokenPrice).toLocaleString()} PXB</div>
                          
                          <div className="col-span-2">100 {tokenData.symbol}</div>
                          <div className="col-span-1">{(100 * tokenPrice).toLocaleString()} PXB</div>
                          
                          <div className="col-span-2">1,000 {tokenData.symbol}</div>
                          <div className="col-span-1">{(1000 * tokenPrice).toLocaleString()} PXB</div>
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-dream-foreground/60">
                        <p>PXB trading uses real market data</p>
                        <p>Last updated: {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default TokenTrading;
