
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';

interface UserTokenBetsPanelProps {
  tokenPXBBets: any[];
  tokenId: string;
}

const UserTokenBetsPanel: React.FC<UserTokenBetsPanelProps> = ({ tokenPXBBets, tokenId }) => {
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});

  useEffect(() => {
    const fetchMarketCapData = async () => {
      if (!tokenPXBBets || tokenPXBBets.length === 0) return;
      
      for (const bet of tokenPXBBets) {
        if (!bet.tokenMint) continue;
        if (marketCapData[bet.id]?.currentMarketCap) continue;
        
        setLoadingMarketCaps(prev => ({
          ...prev,
          [bet.id]: true
        }));
        
        try {
          const data = await fetchDexScreenerData(bet.tokenMint);
          if (data) {
            setMarketCapData(prev => ({
              ...prev,
              [bet.id]: {
                initialMarketCap: bet.initialMarketCap || data.marketCap,
                currentMarketCap: data.marketCap
              }
            }));
          }
        } catch (error) {
          console.error(`Error fetching data for token ${bet.tokenSymbol}:`, error);
        } finally {
          setLoadingMarketCaps(prev => ({
            ...prev,
            [bet.id]: false
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };
    
    fetchMarketCapData();
    
    const interval = setInterval(() => {
      const pendingBets = tokenPXBBets.filter(bet => bet.status === 'pending');
      if (pendingBets.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [tokenPXBBets, marketCapData]);

  const calculateProgress = (bet: any) => {
    if (bet.status !== 'pending') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
      const targetChange = bet.percentageChange;
      
      if (bet.betType === 'up') {
        if (actualChange < 0) return 0;
        return Math.min(100, actualChange / targetChange * 100);
      } else {
        if (actualChange > 0) return 0;
        return Math.min(100, Math.abs(actualChange) / targetChange * 100);
      }
    }
    
    return 0;
  };

  const calculateTargetMarketCap = (bet: any) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };

  const calculateMarketCapChange = (bet: any) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      return (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    }
    
    return null;
  };

  const formatLargeNumber = (num: number | null) => {
    if (num === null || num === undefined) return "N/A";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  if (tokenPXBBets.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-6 mb-8">
      <h2 className="text-xl font-display font-bold mb-4">Your Trades on this Token</h2>
      <div className="space-y-4">
        {tokenPXBBets.map(bet => {
          const progress = calculateProgress(bet);
          const targetMarketCap = calculateTargetMarketCap(bet);
          const marketCapChange = calculateMarketCapChange(bet);
          
          return (
            <div key={bet.id} className="bg-black/20 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${bet.betType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {bet.betType === 'up' ? 'Long' : 'Short'} • {bet.percentageChange}%
                  </span>
                  <h3 className="font-medium mt-2">{bet.amount} PXB</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-dream-foreground/70">
                    {bet.status === 'pending' ? 'In Progress' : 
                    bet.status === 'won' ? 'Won' : 
                    bet.status === 'lost' ? 'Lost' : bet.status}
                  </div>
                  <div className="text-sm mt-1">
                    {new Date(bet.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Initial MC: {formatLargeNumber(bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap || 0)}</span>
                  <span>Target: {formatLargeNumber(targetMarketCap || 0)}</span>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Current: {formatLargeNumber(marketCapData[bet.id]?.currentMarketCap || 0)}</span>
                  {marketCapChange !== null && (
                    <span className={marketCapChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {marketCapChange >= 0 ? '+' : ''}{marketCapChange.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserTokenBetsPanel;
