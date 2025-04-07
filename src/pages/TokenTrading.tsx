
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  BarChart3, 
  Clock, 
  Coins, 
  DollarSign,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { TokenPortfolio } from '@/contexts/pxb/types';

// Helper function to format numbers nicely
const formatNumber = (num: number, decimals = 2) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(decimals)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const TokenTrading = () => {
  const { id: tokenMint } = useParams();
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { 
    userProfile, 
    purchaseToken, 
    sellToken,
    tokenPortfolios,
    fetchTokenPortfolios,
    isLoadingPortfolios
  } = usePXBPoints();
  
  const [tokenMetrics, setTokenMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<TokenPortfolio | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate token quantity based on PXB amount
  const calculateTokenQuantity = (pxbAmount: number) => {
    if (!tokenMetrics || tokenMetrics.marketCap === null) return 0;
    const totalSupply = tokenMetrics.totalSupply || 1000000000;
    const tokenPrice = tokenMetrics.marketCap / totalSupply;
    return pxbAmount / tokenPrice;
  };

  // Calculate PXB amount based on token quantity
  const calculatePxbAmount = (tokenQuantity: number) => {
    if (!tokenMetrics || tokenMetrics.marketCap === null || !selectedPortfolio) return 0;
    const totalSupply = tokenMetrics.totalSupply || 1000000000;
    const tokenPrice = tokenMetrics.marketCap / totalSupply;
    return tokenQuantity * tokenPrice;
  };

  const getPortfolioForCurrentToken = () => {
    if (!tokenMint || !tokenPortfolios) return null;
    return tokenPortfolios.find(p => p.tokenId === tokenMint) || null;
  };

  // Fetch token data
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenMint) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const metrics = await fetchTokenMetrics(tokenMint);
        setTokenMetrics(metrics);
      } catch (error) {
        console.error('Error loading token data:', error);
        toast.error('Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
  }, [tokenMint, navigate]);

  // Load user's token portfolios
  useEffect(() => {
    if (connected && userProfile) {
      fetchTokenPortfolios();
      setSelectedPortfolio(getPortfolioForCurrentToken());
    }
  }, [connected, userProfile, fetchTokenPortfolios, tokenMint]);

  // Update selected portfolio when portfolios change
  useEffect(() => {
    setSelectedPortfolio(getPortfolioForCurrentToken());
  }, [tokenPortfolios, tokenMint]);

  const handleBuyToken = async () => {
    if (!tokenMint || !tokenMetrics) return;
    
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!userProfile || amount > userProfile.pxbPoints) {
      toast.error('Insufficient PXB points');
      return;
    }

    const success = await purchaseToken(
      tokenMint,
      tokenMetrics.name || 'Unknown Token',
      tokenMetrics.symbol || 'UNK',
      amount
    );

    if (success) {
      setPurchaseAmount('');
      setShowBuyDialog(false);
    }
  };

  const handleSellToken = async () => {
    if (!selectedPortfolio) return;
    
    const quantity = parseFloat(sellAmount);
    if (isNaN(quantity) || quantity <= 0 || quantity > selectedPortfolio.quantity) {
      toast.error(`Please enter a valid quantity (up to ${selectedPortfolio.quantity.toFixed(6)})`);
      return;
    }

    const success = await sellToken(selectedPortfolio.id, quantity);

    if (success) {
      setSellAmount('');
      setShowSellDialog(false);
    }
  };

  const refreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      if (tokenMint) {
        const metrics = await fetchTokenMetrics(tokenMint, true); // Force refresh
        setTokenMetrics(metrics);
      }
      if (connected && userProfile) {
        await fetchTokenPortfolios();
      }
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-12 w-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!tokenMetrics) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Token Not Found</h2>
          <p className="text-gray-400 mb-6">The requested token could not be loaded.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const currentPortfolio = getPortfolioForCurrentToken();
  const tokenName = tokenMetrics.name || 'Unknown Token';
  const tokenSymbol = tokenMetrics.symbol || 'UNK';
  const tokenPrice = tokenMetrics.marketCap 
    ? (tokenMetrics.marketCap / (tokenMetrics.totalSupply || 1000000000)) 
    : null;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {tokenName} ({tokenSymbol})
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Info Card */}
          <Card className="p-6 bg-black/20 backdrop-blur-md border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Token Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-300">Price</span>
                </div>
                <span className="font-medium">
                  {tokenPrice ? `${tokenPrice.toFixed(8)} PXB` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-300">Market Cap</span>
                </div>
                <span className="font-medium">
                  {tokenMetrics.marketCap ? `${formatNumber(tokenMetrics.marketCap)} PXB` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <div className="flex items-center">
                  <Coins className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-300">Supply</span>
                </div>
                <span className="font-medium">
                  {tokenMetrics.totalSupply ? formatNumber(tokenMetrics.totalSupply) : '1,000,000,000'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-300">Last Updated</span>
                </div>
                <span className="font-medium">
                  {tokenMetrics.lastUpdatedTime ? 
                    formatDistanceToNow(new Date(tokenMetrics.lastUpdatedTime), { addSuffix: true }) : 
                    'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => setShowBuyDialog(true)}
                disabled={!connected || !userProfile}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy with PXB
              </Button>
              
              {currentPortfolio && (
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPortfolio(currentPortfolio);
                    setShowSellDialog(true);
                  }}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Sell for PXB
                </Button>
              )}
            </div>
          </Card>

          {/* Portfolio Card */}
          <Card className="p-6 bg-black/20 backdrop-blur-md border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Your Portfolio</h2>
            
            {!connected || !userProfile ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">Please connect your wallet to view your portfolio</p>
              </div>
            ) : isLoadingPortfolios ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : currentPortfolio ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-300">Quantity</span>
                  <span className="font-medium">{currentPortfolio.quantity.toFixed(6)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-300">Average Price</span>
                  <span className="font-medium">{currentPortfolio.averagePurchasePrice.toFixed(8)} PXB</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-300">Current Value</span>
                  <span className="font-medium">{currentPortfolio.currentValue.toFixed(2)} PXB</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-300">Profit/Loss</span>
                  {tokenPrice ? (
                    <div className="flex items-center">
                      {(() => {
                        const originalInvestment = currentPortfolio.quantity * currentPortfolio.averagePurchasePrice;
                        const currentValue = currentPortfolio.quantity * tokenPrice;
                        const pnl = currentValue - originalInvestment;
                        const pnlPercentage = (pnl / originalInvestment) * 100;
                        const isProfit = pnl >= 0;
                        
                        return (
                          <>
                            {isProfit ? (
                              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
                            )}
                            <span className={isProfit ? 'text-green-500' : 'text-red-500'}>
                              {pnl.toFixed(2)} PXB ({Math.abs(pnlPercentage).toFixed(2)}%)
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span>Calculating...</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="text-gray-300">Last Updated</span>
                  <span className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(currentPortfolio.lastUpdated), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't own any {tokenSymbol} tokens yet</p>
                <Button 
                  variant="default" 
                  onClick={() => setShowBuyDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Buy Now
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Buy {tokenSymbol} Tokens</DialogTitle>
            <DialogDescription>
              Enter the amount of PXB points you want to spend
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="buy-amount" className="text-sm font-medium">
                PXB Amount
              </label>
              <Input
                id="buy-amount"
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="Enter PXB amount"
                className="bg-gray-800"
              />
              {purchaseAmount && !isNaN(parseFloat(purchaseAmount)) && (
                <p className="text-sm text-gray-400 mt-1">
                  You will receive approximately{' '}
                  {calculateTokenQuantity(parseFloat(purchaseAmount)).toFixed(6)}{' '}
                  {tokenSymbol} tokens
                </p>
              )}
              {userProfile && (
                <p className="text-sm text-gray-400">
                  Available balance: {userProfile.pxbPoints.toFixed(2)} PXB
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBuyToken}
              disabled={
                !purchaseAmount || 
                parseFloat(purchaseAmount) <= 0 || 
                (userProfile && parseFloat(purchaseAmount) > userProfile.pxbPoints)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Sell {tokenSymbol} Tokens</DialogTitle>
            <DialogDescription>
              Enter the quantity of tokens you want to sell
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="sell-amount" className="text-sm font-medium">
                Token Quantity
              </label>
              <Input
                id="sell-amount"
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter token quantity"
                className="bg-gray-800"
              />
              {sellAmount && !isNaN(parseFloat(sellAmount)) && selectedPortfolio && (
                <p className="text-sm text-gray-400 mt-1">
                  You will receive approximately{' '}
                  {calculatePxbAmount(parseFloat(sellAmount)).toFixed(2)}{' '}
                  PXB points
                </p>
              )}
              {selectedPortfolio && (
                <p className="text-sm text-gray-400">
                  Available: {selectedPortfolio.quantity.toFixed(6)} {tokenSymbol}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSellDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSellToken}
              disabled={
                !sellAmount || 
                parseFloat(sellAmount) <= 0 || 
                (selectedPortfolio && parseFloat(sellAmount) > selectedPortfolio.quantity)
              }
            >
              Confirm Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenTrading;
