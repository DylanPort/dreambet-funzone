
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { Link } from 'react-router-dom';
import { TokenPortfolio } from '@/services/tokenTradingService';
import { 
  Wallet, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import truncateAddress from '@/utils/truncateAddress';

const TokenPortfolioComponent: React.FC = () => {
  const { userProfile, portfolio, fetchUserPortfolio, isLoadingPortfolio } = usePXBPoints();
  const [updatedPortfolio, setUpdatedPortfolio] = useState<(TokenPortfolio & { pnl: number, pnlPercentage: number })[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile && fetchUserPortfolio) {
      fetchUserPortfolio();
    }
  }, [userProfile, fetchUserPortfolio]);

  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      updatePortfolioValues();
    } else {
      setUpdatedPortfolio([]);
    }
  }, [portfolio]);

  const updatePortfolioValues = async () => {
    if (!portfolio) return;
    
    setIsRefreshing(true);
    
    try {
      const updatedItems = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const tokenData = await fetchDexScreenerData(item.tokenId);
            const currentPrice = tokenData?.priceUsd || 0;
            const currentValue = item.quantity * currentPrice;
            const investmentValue = item.quantity * item.averagePurchasePrice;
            const pnl = currentValue - investmentValue;
            const pnlPercentage = investmentValue > 0 ? (pnl / investmentValue) * 100 : 0;
            
            return {
              ...item,
              currentValue,
              pnl,
              pnlPercentage
            };
          } catch (error) {
            console.error(`Error updating token ${item.tokenId}:`, error);
            return {
              ...item,
              pnl: 0,
              pnlPercentage: 0
            };
          }
        })
      );
      
      setUpdatedPortfolio(updatedItems);
    } catch (error) {
      console.error('Error updating portfolio values:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (fetchUserPortfolio) {
      fetchUserPortfolio();
      updatePortfolioValues();
    }
  };

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

  if (!userProfile) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/70">Connect your wallet to view your token portfolio</p>
      </div>
    );
  }

  if (isLoadingPortfolio || isRefreshing) {
    return (
      <div className="glass-panel p-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!updatedPortfolio || updatedPortfolio.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-dream-foreground/70 mb-4">You don't have any tokens in your portfolio</p>
        <Link to="/betting">
          <Button className="bg-gradient-to-r from-dream-accent1 to-dream-accent2">
            Browse Tokens
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display font-bold flex items-center">
          <Wallet className="w-5 h-5 mr-2" />
          Your Token Portfolio
        </h3>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dream-foreground/10">
              <th className="text-left py-2 px-4 text-dream-foreground/70 text-sm">Token</th>
              <th className="text-right py-2 px-4 text-dream-foreground/70 text-sm">Quantity</th>
              <th className="text-right py-2 px-4 text-dream-foreground/70 text-sm">Avg. Price</th>
              <th className="text-right py-2 px-4 text-dream-foreground/70 text-sm">Current Value</th>
              <th className="text-right py-2 px-4 text-dream-foreground/70 text-sm">PnL</th>
              <th className="text-center py-2 px-4 text-dream-foreground/70 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {updatedPortfolio.map((item) => (
              <tr key={item.id} className="border-b border-dream-foreground/10 hover:bg-black/20">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-sm border border-white/10 mr-2">
                      {item.tokenSymbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{item.tokenSymbol}</div>
                      <div className="text-xs text-dream-foreground/60">{truncateAddress(item.tokenId, 4)}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  {formatLargeNumber(item.quantity)}
                </td>
                <td className="py-3 px-4 text-right">
                  {formatLargeNumber(item.averagePurchasePrice)} PXB
                </td>
                <td className="py-3 px-4 text-right">
                  {formatLargeNumber(item.currentValue)} PXB
                </td>
                <td className="py-3 px-4 text-right">
                  <div className={`flex items-center justify-end ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{item.pnl >= 0 ? '+' : ''}{formatLargeNumber(item.pnl)}</span>
                    <span className="text-xs ml-1">({item.pnl >= 0 ? '+' : ''}{item.pnlPercentage.toFixed(2)}%)</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link to={`/token/${item.tokenId}`}>
                    <Button variant="ghost" size="sm" className="text-dream-accent2 hover:text-dream-accent1">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenPortfolioComponent;
