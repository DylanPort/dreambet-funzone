
import React, { useEffect, useState } from 'react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Clock, ArrowUp, ArrowDown, CheckCircle, XCircle, HelpCircle, ChevronRight, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from 'sonner';

const PXBBetsList = () => {
  const {
    bets,
    fetchUserBets
  } = usePXBPoints();
  
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});
  const [showAllBets, setShowAllBets] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetchUserBets();
  }, [fetchUserBets]);
  
  const fetchMarketCapData = async () => {
    if (!bets || bets.length === 0) return;
    setIsRefreshing(true);
    
    for (const bet of bets) {
      if (!bet.tokenMint) continue;
      
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
    
    setIsRefreshing(false);
  };
  
  useEffect(() => {
    fetchMarketCapData();
    
    const interval = setInterval(() => {
      const pendingBets = bets.filter(bet => bet.status === 'pending');
      if (pendingBets.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [bets]);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    toast.success("Fetching the latest market cap information for your bets");
    
    await fetchMarketCapData();
  };
  
  if (!bets || bets.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
          Your PXB Bets
        </h2>
        <div className="text-center py-6">
          <p className="text-dream-foreground/70 mb-4">You haven't placed any PXB bets yet</p>
          <Button asChild>
            <Link to="/betting">Place Your First Bet</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const calculateProgress = (bet) => {
    if (bet.status !== 'pending' && bet.status !== 'open') {
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
  
  const calculateTargetMarketCap = (bet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };
  
  const formatLargeNumber = (num) => {
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
  
  const calculateMarketCapChange = (bet) => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      return (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    }
    
    return null;
  };

  // Helper function to check if a bet is active (pending or open and not expired)
  const isBetActive = (bet) => {
    const now = new Date();
    const expiryDate = new Date(bet.expiresAt);
    return (bet.status === 'pending' || bet.status === 'open') && now < expiryDate;
  };
  
  const displayedBets = showAllBets ? bets : bets.slice(0, 2);

  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg flex items-center">
          <Clock className="mr-2 h-5 w-5 text-dream-accent1" />
          Your PXB Bets
        </h2>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-4">
        {displayedBets.map((bet) => {
          const progress = calculateProgress(bet);
          const targetMarketCap = calculateTargetMarketCap(bet);
          const marketCapChange = calculateMarketCapChange(bet);
          const isActive = isBetActive(bet);
          
          return (
            <div key={bet.id} className="bg-dream-foreground/5 rounded-lg p-4 relative overflow-hidden">
              {/* Status badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                bet.status === 'won' ? 'bg-green-500/20 text-green-300' : 
                bet.status === 'lost' ? 'bg-red-500/20 text-red-300' : 
                'bg-blue-500/20 text-blue-300'
              }`}>
                {bet.status === 'won' && <CheckCircle className="w-3 h-3 mr-1" />}
                {bet.status === 'lost' && <XCircle className="w-3 h-3 mr-1" />}
                {bet.status === 'pending' && <HelpCircle className="w-3 h-3 mr-1" />}
                {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
              </div>
              
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-medium text-lg">{bet.tokenName} ({bet.tokenSymbol})</h3>
                  <p className="text-dream-foreground/70 text-sm">
                    {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className={`p-1.5 rounded-full mr-2 ${
                    bet.betType === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {bet.betType === 'up' ? 
                      <ArrowUp className={`w-4 h-4 ${bet.betType === 'up' ? 'text-green-400' : 'text-red-400'}`} /> : 
                      <ArrowDown className={`w-4 h-4 ${bet.betType === 'down' ? 'text-red-400' : 'text-green-400'}`} />
                    }
                  </div>
                  <span>
                    {bet.betType === 'up' ? 'Up' : 'Down'} by {bet.percentageChange}%
                  </span>
                </div>
                <div className="text-dream-foreground/70 text-sm">
                  {bet.betAmount.toLocaleString()} PXB
                </div>
              </div>
              
              {isActive && (
                <>
                  <div className="mb-1 flex justify-between text-xs text-dream-foreground/60">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5 mb-3" />
                </>
              )}
              
              {marketCapData[bet.id] && (
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div className="bg-dream-foreground/10 p-2 rounded text-center">
                    <p className="text-dream-foreground/60 text-xs mb-1">Initial</p>
                    <p className="font-medium">{formatLargeNumber(marketCapData[bet.id].initialMarketCap)}</p>
                  </div>
                  
                  <div className="bg-dream-foreground/10 p-2 rounded text-center">
                    <p className="text-dream-foreground/60 text-xs mb-1">Current</p>
                    <p className={`font-medium ${
                      marketCapChange > 0 ? 'text-green-400' : 
                      marketCapChange < 0 ? 'text-red-400' : ''
                    }`}>
                      {formatLargeNumber(marketCapData[bet.id].currentMarketCap)}
                      {marketCapChange !== null && (
                        <span className="text-xs ml-1">
                          ({marketCapChange > 0 ? '+' : ''}{marketCapChange.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-dream-foreground/10 p-2 rounded text-center">
                    <p className="text-dream-foreground/60 text-xs mb-1">Target</p>
                    <p className="font-medium">{formatLargeNumber(targetMarketCap)}</p>
                  </div>
                </div>
              )}
              
              {!isActive && bet.status === 'won' && (
                <div className="text-green-400 font-medium mt-2">
                  You won {bet.pointsWon.toLocaleString()} PXB
                </div>
              )}
            </div>
          );
        })}
        
        {bets.length > 2 && (
          <Button 
            variant="outline" 
            className="w-full text-sm" 
            onClick={() => setShowAllBets(!showAllBets)}
          >
            {showAllBets ? 'Show Less' : `Show All (${bets.length})`}
            <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showAllBets ? 'rotate-90' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PXBBetsList;
