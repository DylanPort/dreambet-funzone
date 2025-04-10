import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { TrendingUp, TrendingDown, Loader2, BarChart3, DollarSign, LineChart, ArrowDown, ArrowUp, ShoppingCart, Trash2, User, Clock, Copy } from 'lucide-react';
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { fetchGMGNTokenData } from '@/services/gmgnService';
import TokenTransactionConfirmDialog from './TokenTransactionConfirmDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSelling, setIsSelling] = useState(false);
  const [sellLoading, setSellLoading] = useState<Record<number, boolean>>({});
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
  const userTokenHoldingsRef = useRef<TokenHolding[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [sellConfirmDialogOpen, setSellConfirmDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<TokenHolding | null>(null);
  const [isDemoMode] = useState<boolean>(true);

  const { toast } = useToast();
  const { userProfile } = usePXBPoints();
  const pumpPortalService = usePumpPortalWebSocket();

  useEffect(() => {
    if (marketCap) {
      setCurrentMarketCap(marketCap);
    }
    
    if (volume24h) {
      setCurrentVolume(volume24h);
    }
    
    const fetchRealMarketData = async () => {
      try {
        const dexData = await fetchDexScreenerData(tokenId);
        if (dexData && dexData.marketCap) {
          setCurrentMarketCap(dexData.marketCap);
          setCurrentVolume(dexData.volume24h);
          console.log("Updated market data from DexScreener:", dexData);
          return;
        }
        
        const gmgnData = await fetchGMGNTokenData(tokenId);
        if (gmgnData && gmgnData.marketCap) {
          setCurrentMarketCap(gmgnData.marketCap);
          setCurrentVolume(gmgnData.volume24h);
          console.log("Updated market data from GMGN:", gmgnData);
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };
    
    fetchRealMarketData();
    
    const intervalId = setInterval(fetchRealMarketData, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [tokenId, marketCap, volume24h]);

  useEffect(() => {
    if (userProfile && tokenId) {
      try {
        const storageKey = `demo_token_holdings_${userProfile.id}_${tokenId}`;
        const storedHoldings = localStorage.getItem(storageKey);
        
        if (storedHoldings) {
          const holdings = JSON.parse(storedHoldings);
          setUserTokenHoldings(holdings);
          userTokenHoldingsRef.current = holdings;
        }
      } catch (error) {
        console.error("Error loading token holdings from localStorage:", error);
      }
    }
  }, [userProfile, tokenId]);

  useEffect(() => {
    if (initialPurchaseData) {
      const existingHoldingIndex = userTokenHoldingsRef.current.findIndex(
        holding => holding.tokenSymbol === tokenSymbol
      );
      
      if (existingHoldingIndex >= 0) {
        const updatedHoldings = [...userTokenHoldingsRef.current];
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
        userTokenHoldingsRef.current = updatedHoldings;
        
        if (userProfile) {
          try {
            const storageKey = `demo_token_holdings_${userProfile.id}_${tokenId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedHoldings));
          } catch (error) {
            console.error("Error saving token holdings to localStorage:", error);
          }
        }
      } else {
        if (currentMarketCap) {
          const newHolding: TokenHolding = {
            id: Date.now(),
            tokenSymbol,
            amount: initialPurchaseData.amount,
            tokenAmount: initialPurchaseData.tokenAmount,
            createdAt: new Date().toISOString(),
            userId: userProfile?.id || "unknown",
            percentageChange: initialPurchaseData.marketCap 
              ? ((currentMarketCap - initialPurchaseData.marketCap) / initialPurchaseData.marketCap) * 100
              : 0,
            initialMarketCap: initialPurchaseData.marketCap || 0,
            currentMarketCap: currentMarketCap,
            currentValue: initialPurchaseData.tokenAmount * tokenPrice,
            lastUpdated: new Date().toISOString()
          };
          
          const newHoldings = [...userTokenHoldingsRef.current, newHolding];
          setUserTokenHoldings(newHoldings);
          userTokenHoldingsRef.current = newHoldings;
          
          if (userProfile) {
            try {
              const storageKey = `demo_token_holdings_${userProfile.id}_${tokenId}`;
              localStorage.setItem(storageKey, JSON.stringify(newHoldings));
            } catch (error) {
              console.error("Error saving token holdings to localStorage:", error);
            }
          }
        }
      }
      
      setInitialPurchaseData(null);
      
      window.dispatchEvent(new CustomEvent('tokenPurchase', { 
        detail: {
          tokenId,
          price: tokenPrice,
          timestamp: new Date().toISOString(),
          amount: initialPurchaseData.amount,
          isDemo: true
        }
      }));
    }
  }, [initialPurchaseData, currentMarketCap, tokenPrice, tokenId, tokenName, tokenSymbol, userProfile]);

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
      userTokenHoldingsRef.current = updatedHoldings;
      
      if (userProfile) {
        try {
          const storageKey = `demo_token_holdings_${userProfile.id}_${tokenId}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedHoldings));
        } catch (error) {
          console.error("Error saving updated token holdings to localStorage:", error);
        }
      }
    }
  }, [currentMarketCap, tokenPrice, userProfile, tokenId]);

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

    if (!isDemoMode && userProfile.pxbPoints < amount) {
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

    setConfirmDialogOpen(true);
  };

  const executeBuyTokens = async () => {
    setIsLoading(true);
    try {
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

      toast.success(`Token Purchase Successful`, {
        description: `You purchased ${tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenSymbol} tokens (Demo Mode)`
      });

      if (userProfile) {
        try {
          const { error } = await supabase
            .from('token_transactions')
            .insert({
              userid: userProfile.id,
              tokenid: tokenId,
              tokenname: tokenName,
              tokensymbol: tokenSymbol,
              type: 'buy',
              quantity: tokenAmount,
              price: tokenPrice,
              pxbamount: amount,
              timestamp: new Date().toISOString()
            });
            
          if (error) {
            console.error("Error saving transaction to database:", error);
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
        }
      }

      window.dispatchEvent(new CustomEvent('tokenPurchase', { 
        detail: {
          tokenId,
          price: tokenPrice,
          timestamp: new Date().toISOString(),
          amount: amount,
          isDemo: true
        }
      }));

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

  const openSellConfirmation = (holding: TokenHolding) => {
    setSelectedHolding(holding);
    setSellConfirmDialogOpen(true);
  };

  const handleSellTokens = async (holding: TokenHolding) => {
    if (!userProfile) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to sell tokens",
        variant: "destructive",
      });
      return;
    }

    setSellLoading(prev => ({ ...prev, [holding.id]: true }));
    
    try {
      const isPositiveChange = holding.percentageChange >= 0;
      const returnAmount = Math.max(0, holding.currentValue);
      
      console.log(`Selling tokens (Demo Mode): ${holding.tokenAmount} ${holding.tokenSymbol}`);
      console.log(`Return amount (Demo Mode): ${returnAmount} PXB`);
      
      toast.success(`Token Sale Successful`, {
        description: `You sold ${holding.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${holding.tokenSymbol} tokens for ${returnAmount.toFixed(2)} PXB`
      });

      if (userProfile) {
        try {
          const { error } = await supabase
            .from('token_transactions')
            .insert({
              userid: userProfile.id,
              tokenid: tokenId,
              tokenname: tokenName,
              tokensymbol: holding.tokenSymbol,
              type: 'sell',
              quantity: holding.tokenAmount,
              price: tokenPrice,
              pxbamount: returnAmount,
              timestamp: new Date().toISOString()
            });
            
          if (error) {
            console.error("Error saving transaction to database:", error);
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
        }
      }
      
      const updatedHoldings = userTokenHoldings.filter(h => h.id !== holding.id);
      setUserTokenHoldings(updatedHoldings);
      userTokenHoldingsRef.current = updatedHoldings;
      
      if (userProfile) {
        try {
          const storageKey = `demo_token_holdings_${userProfile.id}_${tokenId}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedHoldings));
        } catch (error) {
          console.error("Error updating token holdings in localStorage:", error);
        }
      }
      
      window.dispatchEvent(new CustomEvent('tokenSale', { 
        detail: {
          tokenId,
          price: tokenPrice,
          timestamp: new Date().toISOString(),
          amount: holding.tokenAmount,
          isDemo: true
        }
      }));
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error selling tokens:", error);
      toast({
        title: "Sale failed",
        description: "There was an error processing your sale",
        variant: "destructive",
      });
    } finally {
      setSellLoading(prev => ({ ...prev, [holding.id]: false }));
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
    const isSellingThisHolding = sellLoading[holding.id] || false;
    
    return (
      <div key={holding.id} className="bg-black/60 rounded-lg border border-white/10 mb-3 overflow-hidden hover:border-purple-500/40 transition-all duration-200">
        <div className="p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${isPositiveChange ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                {holding.tokenSymbol.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{holding.tokenSymbol}</div>
                <div className="text-xs text-purple-400">PumpXBounty</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-purple-400">{holding.amount} PXB</div>
              <div className="text-xs text-dream-foreground/70 flex items-center justify-end">
                <Clock className="w-3 h-3 mr-0.5" />
                {formatTimeAgo(holding.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-black/40 rounded-md p-2 border border-white/5">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-0.5" />
                PXB Used
              </div>
              <div className="font-bold text-white text-sm">{holding.amount} PXB</div>
            </div>
            
            <div className="bg-black/40 rounded-md p-2 border border-white/5">
              <div className="text-xs text-dream-foreground/60 mb-1 flex items-center">
                <ShoppingCart className="w-3 h-3 mr-0.5" />
                Tokens Received
              </div>
              <div className="font-bold text-white text-sm">
                {holding.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="mt-3 bg-black/40 rounded-md p-2 border border-white/5">
            <div className="flex justify-between items-center">
              <div className="text-xs text-dream-foreground/60">Current PXB Value</div>
              <div className={`font-mono text-sm font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {holding.currentValue.toFixed(2)} PXB
                <span className="ml-1 text-xs">
                  ({isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 bg-black/40 rounded-md p-2 border border-white/5">
            <div className="flex justify-between items-center">
              <div className="text-xs text-dream-foreground/60">Market Performance</div>
              <div className={`font-mono text-sm font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%
              </div>
            </div>
            
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full ${isPositiveChange ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-pink-400'}`}
                style={{ width: `${Math.min(100, Math.abs(holding.percentageChange))}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center text-xs bg-black/20 rounded-md px-2 py-1.5">
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
          
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center bg-black/20 rounded-md px-2 py-1">
              <User className="w-3 h-3 mr-1 text-dream-foreground/60" />
              <span className="text-dream-foreground/60 mr-1">You</span>
            </div>
            
            <div className={`flex items-center px-2 py-1 rounded-md ${isPositiveChange ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isPositiveChange ? 
                <TrendingUp className={`w-3 h-3 mr-1 text-green-400`} /> : 
                <TrendingDown className={`w-3 h-3 mr-1 text-red-400`} />
              }
              <span className={`font-semibold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                {isPositiveChange ? 'Profit' : 'Loss'}
              </span>
            </div>
          </div>
          
          <Button 
            variant={isPositiveChange ? "default" : "destructive"} 
            size="sm"
            className={`w-full text-xs mt-3 py-1 h-8 ${isPositiveChange ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'}`}
            onClick={() => openSellConfirmation(holding)}
            disabled={isSellingThisHolding}
          >
            {isSellingThisHolding ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>Sell for {holding.currentValue.toFixed(2)} PXB ({isPositiveChange ? '+' : ''}{holding.percentageChange.toFixed(2)}%)</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-md p-2 text-center mb-2">
        <p className="text-sm font-medium text-yellow-200">Demo Mode: Trading tokens won't affect your PXB balance</p>
      </div>

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
            <div className="px-2 py-1 bg-black/20 rounded-md border border-white/10 text-xs flex items-center">
              <span className="mr-1">Auto-updating</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
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
                <label className="block text-sm font-medium">PXB Amount (Demo)</label>
                <span className="text-sm text-dream-foreground/70">
                  Demo Mode: Unlimited PXB
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
                disabled={isLoading || amount <= 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy Tokens (Demo)
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Sell {tokenSymbol} Tokens</h3>
            <div className="px-2 py-1 bg-black/20 rounded-md border border-white/10 text-xs flex items-center">
              <span className="mr-1">Auto-updating</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>

          {userTokenHoldings.length > 0 ? (
            <>
              <p className="text-sm text-dream-foreground/70">Your token holdings for {tokenSymbol} (Demo)</p>
              <ScrollArea className="h-[600px] rounded-md border border-white/10 bg-black/20 p-4">
                <div className="pr-4 pl-1 space-y-4">
                  {userTokenHoldings
                    .filter(holding => holding.tokenSymbol === tokenSymbol)
                    .map(renderTokenHoldingCard)}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-20 text-dream-foreground/50 bg-black/20 rounded-md border border-white/10">
              <ShoppingCart className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl mb-2">You don't have any {tokenSymbol} tokens yet.</p>
              <p className="text-sm mt-4 max-w-md mx-auto">Purchase some tokens in the "Buy" tab to see them here and track your performance.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TokenTransactionConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={executeBuyTokens}
        type="buy"
        tokenSymbol={tokenSymbol}
        tokenName={tokenName}
        pxbAmount={amount}
        tokenAmount={tokenAmount}
        tokenPrice={tokenPrice}
        isDemo={true}
      />

      {selectedHolding && (
        <TokenTransactionConfirmDialog
          open={sellConfirmDialogOpen}
          onOpenChange={setSellConfirmDialogOpen}
          onConfirm={() => selectedHolding && handleSellTokens(selectedHolding)}
          type="sell"
          tokenSymbol={selectedHolding.tokenSymbol}
          tokenName={tokenName}
          pxbAmount={Math.round(selectedHolding.currentValue)}
          tokenAmount={selectedHolding.tokenAmount}
          tokenPrice={tokenPrice}
          percentageChange={selectedHolding.percentageChange}
          isDemo={true}
        />
      )}
    </div>
  );
};

export default TokenTrading;
