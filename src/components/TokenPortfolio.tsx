
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight, Wallet } from 'lucide-react';
import { getUserPortfolio, TokenPosition, calculatePXBValue } from '@/services/tokenTradingService';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { formatDistanceToNow } from 'date-fns';

const TokenPortfolio: React.FC = () => {
  const { userProfile } = usePXBPoints();
  const navigate = useNavigate();
  const [positions, setPositions] = useState<TokenPosition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  
  // Load portfolio data
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!userProfile) return;
      
      setIsLoading(true);
      try {
        const portfolio = await getUserPortfolio();
        setPositions(portfolio);
        
        // Fetch current prices for all tokens
        const prices: Record<string, number> = {};
        for (const position of portfolio) {
          try {
            const dexData = await fetchDexScreenerData(position.tokenId);
            if (dexData) {
              prices[position.tokenId] = dexData.priceUsd;
            }
          } catch (error) {
            console.error(`Error fetching price for ${position.tokenSymbol}:`, error);
          }
        }
        
        setTokenPrices(prices);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPortfolio();
  }, [userProfile]);

  const refreshPortfolio = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      const portfolio = await getUserPortfolio();
      setPositions(portfolio);
      
      // Fetch current prices for all tokens
      const prices: Record<string, number> = {};
      for (const position of portfolio) {
        try {
          const dexData = await fetchDexScreenerData(position.tokenId);
          if (dexData) {
            prices[position.tokenId] = dexData.priceUsd;
          }
        } catch (error) {
          console.error(`Error fetching price for ${position.tokenSymbol}:`, error);
        }
      }
      
      setTokenPrices(prices);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalValue = (): number => {
    return positions.reduce((total, position) => {
      const currentPrice = tokenPrices[position.tokenId] || position.averagePurchasePrice;
      return total + (position.quantity * currentPrice);
    }, 0);
  };

  const calculateTotalPXBValue = (): number => {
    return positions.reduce((total, position) => {
      const currentPrice = tokenPrices[position.tokenId] || position.averagePurchasePrice;
      return total + calculatePXBValue(position.quantity, currentPrice);
    }, 0);
  };

  const calculatePnL = (position: TokenPosition): { value: number, percentage: number } => {
    const currentPrice = tokenPrices[position.tokenId] || position.averagePurchasePrice;
    const currentValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.averagePurchasePrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = (pnl / costBasis) * 100;
    
    return { value: pnl, percentage: pnlPercent };
  };

  const handleViewToken = (tokenId: string) => {
    navigate(`/token/${tokenId}`);
  };

  if (!userProfile) {
    return (
      <Card className="glass-panel border border-dream-accent1/20">
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Connect your wallet to view your portfolio</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border border-dream-accent1/20">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-display">Your Portfolio</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={refreshPortfolio}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Manage your token positions</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-8 text-dream-foreground/70">
            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-2">You don't have any tokens yet</p>
            <p className="text-sm mb-4">Buy tokens on token detail pages to start your portfolio</p>
            <Button variant="outline" onClick={() => navigate('/betting')}>
              Explore Tokens
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-black/10 p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-dream-foreground/70">Total Value</span>
                <span className="font-semibold">${calculateTotalValue().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-dream-foreground/70">PXB Value</span>
                <span>{Math.round(calculateTotalPXBValue())} PXB</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {positions.map(position => {
                const currentPrice = tokenPrices[position.tokenId] || position.averagePurchasePrice;
                const pnl = calculatePnL(position);
                const isPnlPositive = pnl.value >= 0;
                
                return (
                  <div 
                    key={position.id} 
                    className="border border-dream-foreground/10 p-3 rounded-md hover:border-dream-foreground/30 transition-all cursor-pointer"
                    onClick={() => handleViewToken(position.tokenId)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">{position.tokenSymbol}</div>
                      <div>{position.quantity.toFixed(6)} tokens</div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-dream-foreground/70">Value</span>
                      <span>${(position.quantity * currentPrice).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-dream-foreground/70">Avg. Price</span>
                      <span>${position.averagePurchasePrice.toFixed(6)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-dream-foreground/70">PnL</span>
                      <div className={`flex items-center ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPnlPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {pnl.percentage.toFixed(2)}% (${Math.abs(pnl.value).toFixed(2)})
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-dream-foreground/50 mt-2">
                      <span>Last updated {formatDistanceToNow(new Date(position.lastUpdated), { addSuffix: true })}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenPortfolio;
