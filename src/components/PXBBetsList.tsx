
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
    return <div className="glass-panel p-6">
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
      </div>;
  }
  
  const calculateProgress = bet => {
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
  
  const calculateTargetMarketCap = bet => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;

    // Calculate target market cap based on bet type
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };
  
  const formatLargeNumber = num => {
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
  
  const calculateMarketCapChange = bet => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    if (currentMarketCap && initialMarketCap) {
      return (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    }
    return null;
  };

  // Helper function to check if a bet is active (pending or open and not expired)
  const isBetActive = bet => {
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
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          className="h-8 text-xs"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </Button>
      </div>
      
      <div className="space-y-4 mb-4">
        {displayedBets.map(bet => (
          <div 
            key={bet.id} 
            className={`border rounded-lg p-4 ${
              bet.status === 'won' 
                ? 'border-green-400/30 bg-green-400/5' 
                : bet.status === 'lost' 
                  ? 'border-red-400/30 bg-red-400/5'
                  : isBetActive(bet)
                    ? 'border-blue-400/30 bg-blue-400/5 animate-pulse-slow'
                    : 'border-gray-500/30 bg-gray-400/5'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link 
                  to={`/token/${bet.tokenMint}`} 
                  className="text-dream-accent1 font-medium hover:underline"
                >
                  {bet.tokenName} ({bet.tokenSymbol})
                </Link>
                <div className="flex items-center text-sm mt-1">
                  <span className="mr-2">{bet.amount} PXB</span>
                  <span className={`flex items-center ${
                    bet.betType === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {bet.betType === 'up' 
                      ? <ArrowUp className="h-3 w-3 mr-1" /> 
                      : <ArrowDown className="h-3 w-3 mr-1" />
                    }
                    {bet.percentageChange}% {bet.betType === 'up' ? 'Up' : 'Down'}
                  </span>
                </div>
              </div>
              <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                bet.status === 'won' 
                  ? 'bg-green-400/20 text-green-400' 
                  : bet.status === 'lost'
                    ? 'bg-red-400/20 text-red-400'
                    : bet.status === 'pending'
                      ? 'bg-blue-400/20 text-blue-400'
                      : 'bg-gray-400/20 text-gray-400'
              }`}>
                {bet.status === 'won' 
                  ? <span className="flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Won</span>
                  : bet.status === 'lost'
                    ? <span className="flex items-center"><XCircle className="h-3 w-3 mr-1" /> Lost</span>
                    : bet.status === 'pending'
                      ? <span className="flex items-center"><HelpCircle className="h-3 w-3 mr-1" /> Pending</span>
                      : 'Completed'
                }
              </div>
            </div>
            
            <div className="mt-3 text-xs text-dream-foreground/60">
              Created {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
            </div>
            
            {/* Market cap information and progress bar for active bets */}
            {(bet.status === 'pending' || bet.status === 'open') && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <div className="text-green-400">
                    Initial: {formatLargeNumber(marketCapData[bet.id]?.initialMarketCap || bet.initialMarketCap)}
                  </div>
                  <div className="text-white">
                    Current: {loadingMarketCaps[bet.id] ? '...' : formatLargeNumber(marketCapData[bet.id]?.currentMarketCap)}
                  </div>
                  <div className={bet.betType === 'up' ? 'text-green-400' : 'text-red-400'}>
                    Target: {formatLargeNumber(calculateTargetMarketCap(bet))}
                  </div>
                </div>
                
                <Progress value={calculateProgress(bet)} className="h-2.5" />
                
                <div className="text-center text-xs">
                  {loadingMarketCaps[bet.id] 
                    ? 'Updating market cap data...' 
                    : calculateMarketCapChange(bet) !== null 
                      ? `Market cap ${
                          calculateMarketCapChange(bet) > 0 ? 'up' : 'down'
                        } ${Math.abs(calculateMarketCapChange(bet)).toFixed(2)}%`
                      : 'Market cap data unavailable'
                  }
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <Link
                to={`/token/${bet.tokenMint}`}
                className="flex items-center justify-end text-xs text-dream-accent2 hover:text-dream-accent1"
              >
                View Token Details <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {bets.length > 2 && (
        <div className="text-center">
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => setShowAllBets(!showAllBets)}
          >
            {showAllBets ? 'Show Less' : `Show All (${bets.length})`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PXBBetsList;
