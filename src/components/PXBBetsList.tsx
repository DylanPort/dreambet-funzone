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
  return;
};
export default PXBBetsList;