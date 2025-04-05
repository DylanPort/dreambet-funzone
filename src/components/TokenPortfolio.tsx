
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserTokenPortfolio } from '@/services/tokenTradingService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenPortfolioProps {
  tokenId?: string;
}

const TokenPortfolio: React.FC<TokenPortfolioProps> = ({ tokenId }) => {
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const { connected } = useWallet();

  const loadPortfolio = async () => {
    if (!connected) {
      setPortfolioItems([]);
      setTotalValue(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const portfolio = await getUserTokenPortfolio();
      
      // If tokenId is provided, filter for only that token
      const filteredPortfolio = tokenId 
        ? portfolio.filter(item => item.tokenid === tokenId)
        : portfolio;
      
      setPortfolioItems(filteredPortfolio);
      
      // Calculate total value
      const total = filteredPortfolio.reduce((sum, item) => sum + item.currentvalue, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [connected, tokenId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-display font-bold flex items-center">
            <Wallet size={20} className="mr-2" />
            {tokenId ? 'Your Position' : 'Your Portfolio'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPortfolio}
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <CardDescription>
          {tokenId 
            ? 'Your current position for this token' 
            : 'All tokens in your portfolio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!connected ? (
          <div className="text-center py-4 text-dream-foreground/60">
            <p>Connect your wallet to view your portfolio</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-4 text-dream-foreground/60">
            <p>{tokenId ? 'You don\'t own this token yet' : 'No tokens in your portfolio'}</p>
            <p className="text-sm mt-2">Start trading to build your portfolio</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border-b border-dream-foreground/10">
              <span className="font-semibold">Total Value</span>
              <span className="font-semibold">${formatNumber(totalValue)}</span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {portfolioItems.map((item) => (
                <div key={item.id} className="rounded-md bg-black/20 p-3 hover:bg-black/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-dream-accent1/20 flex items-center justify-center mr-3">
                        {item.tokensymbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{item.tokenname}</div>
                        <div className="text-sm text-dream-foreground/60">{item.tokensymbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.quantity.toFixed(4)}</div>
                      <div className="text-sm text-dream-foreground/60">${formatNumber(item.currentvalue)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-dream-foreground/60 flex justify-between">
                    <span>Avg. Price: ${item.averagepurchaseprice.toFixed(6)}</span>
                    <span>Last Updated: {new Date(item.lastupdated).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenPortfolio;
