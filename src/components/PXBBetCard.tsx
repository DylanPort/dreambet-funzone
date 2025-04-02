
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { User, ArrowUpRight, Clock, Copy } from 'lucide-react';
import { PXBBet } from '@/types/pxb';
import { fetchTokenImage } from '@/services/moralisService';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from '@/hooks/use-toast';

interface PXBBetCardProps {
  bet: PXBBet;
  marketCapData: {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  } | undefined;
  isLoading: boolean;
}

const PXBBetCard: React.FC<PXBBetCardProps> = ({ bet, marketCapData: initialMarketCapData, isLoading }) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [marketCapData, setMarketCapData] = useState(initialMarketCapData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const [notifiedWin, setNotifiedWin] = useState(false);

  useEffect(() => {
    const loadTokenImage = async () => {
      if (!bet.tokenMint) return;
      
      try {
        setImageLoading(true);
        const imageUrl = await fetchTokenImage(bet.tokenMint, bet.tokenSymbol);
        setTokenImage(imageUrl);
      } catch (error) {
        console.error("Error loading token image:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadTokenImage();
  }, [bet.tokenMint, bet.tokenSymbol]);

  useEffect(() => {
    if (bet.status !== 'pending') return;

    const updateMarketCap = async () => {
      try {
        if (!bet.tokenMint) return;
        
        const tokenData = await fetchDexScreenerData(bet.tokenMint);
        if (tokenData && tokenData.marketCap) {
          const newMarketCap = tokenData.marketCap;
          setMarketCapData(prev => ({
            initialMarketCap: prev?.initialMarketCap || bet.initialMarketCap,
            currentMarketCap: newMarketCap
          }));
          setLastUpdated(new Date());
          
          // Check if target is reached
          const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
          const targetMarketCap = calculateTargetMarketCap();
          
          if (initialMarketCap && targetMarketCap) {
            const targetReached = bet.betType === 'up' 
              ? newMarketCap >= targetMarketCap 
              : newMarketCap <= targetMarketCap;
            
            if (targetReached && !hasReachedTarget) {
              setHasReachedTarget(true);
              if (!notifiedWin) {
                toast.success(`Your bet on ${bet.tokenSymbol} has reached its target! You won ${bet.betAmount * 2} PXB!`);
                setNotifiedWin(true);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error updating market cap:", error);
      }
    };

    updateMarketCap();
    const intervalId = setInterval(updateMarketCap, 2000);
    
    return () => clearInterval(intervalId);
  }, [bet.tokenMint, bet.initialMarketCap, bet.status, bet.betType, bet.tokenSymbol, bet.betAmount, initialMarketCapData, marketCapData, hasReachedTarget, notifiedWin]);

  // Check for bet expiration
  useEffect(() => {
    if (bet.status !== 'pending') return;
    
    const checkExpiration = () => {
      const now = new Date();
      const expiresAt = new Date(bet.expiresAt);
      
      if (now >= expiresAt && !hasReachedTarget) {
        toast({
          title: "Bet expired",
          description: `Your bet on ${bet.tokenSymbol} has expired without reaching its target.`,
          variant: "destructive",
        });
      }
    };
    
    checkExpiration();
    const intervalId = setInterval(checkExpiration, 60000);
    
    return () => clearInterval(intervalId);
  }, [bet.expiresAt, bet.status, bet.tokenSymbol, hasReachedTarget]);

  const generateColorFromSymbol = (symbol: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: false
      });
    } catch (e) {
      return 'recently';
    }
  };

  const calculateProgress = () => {
    if (bet.status !== 'pending' && bet.status !== 'open') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    const currentMarketCap = marketCapData?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) {
      return 0;
    }
    
    const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    
    if (bet.betType === 'up') {
      return Math.min(100, (actualChange / 80) * 100);
    } else {
      return Math.min(100, (Math.abs(actualChange) / 50) * 100);
    }
  };

  const calculateActualPercentageChange = () => {
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    const currentMarketCap = marketCapData?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) {
      return 0;
    }
    
    return ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
  };

  const formatLargeNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "N/A";
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const calculateTargetMarketCap = () => {
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    if (!initialMarketCap) return null;
    
    if (bet.betType === 'up') {
      return initialMarketCap * 1.8;
    } else {
      return initialMarketCap * 0.5;
    }
  };

  const renderTokenImage = () => {
    if (imageLoading) {
      return <Skeleton className="w-10 h-10 rounded-full" />;
    }
    
    if (tokenImage && !imageError) {
      return (
        <img 
          src={tokenImage} 
          alt={bet.tokenSymbol}
          className="w-10 h-10 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }
    
    const colorGradient = generateColorFromSymbol(bet.tokenSymbol);
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white font-bold text-sm`}>
        {bet.tokenSymbol ? bet.tokenSymbol.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 3) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  const truncatedAddress = bet.userId ? `${bet.userId.substring(0, 4)}...${bet.userId.substring(bet.userId.length - 4)}` : '8efb9f...9547';
  const targetMarketCap = calculateTargetMarketCap();
  const progress = calculateProgress();
  const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
  const currentMarketCap = marketCapData?.currentMarketCap || initialMarketCap;

  return (
    <div className="bg-black/60 rounded-lg border border-white/10 mb-4 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {renderTokenImage()}
            <div>
              <span className="text-purple-400 font-semibold">PumpXBounty</span>
              <span className="text-dream-foreground/60 ml-1">POINTS</span>
            </div>
          </div>
          <div className="text-purple-400 font-mono font-bold text-lg">
            {bet.betAmount} PXB
          </div>
        </div>

        <div className="flex items-center text-sm text-dream-foreground/70 mt-1">
          <Clock className="w-4 h-4 mr-1 opacity-70" />
          <span>{formatTimeAgo(bet.createdAt)} ago</span>
          <span className="mx-2">•</span>
          <span>{bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : bet.status}</span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-dream-foreground/70">Progress</span>
            <span className="text-dream-foreground/50 text-xs">
              Updated {getLastUpdatedText() || "43s ago"}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm mb-1">
            <span>Initial: {formatLargeNumber(initialMarketCap)}</span>
            <span className="text-dream-foreground/50">→</span>
            <span>Target: {formatLargeNumber(targetMarketCap)}</span>
          </div>
          
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-1 relative">
            <div 
              className={`h-full ${hasReachedTarget || bet.status === 'won' ? 'bg-green-500' : bet.status === 'lost' ? 'bg-red-500' : 'bg-purple-500'}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute left-0 top-0 w-full h-full flex">
                <div className="h-full w-2 bg-purple-600 opacity-50"></div>
                <div className="h-full w-2 bg-purple-600 opacity-50 ml-auto"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            {hasReachedTarget || bet.status === 'won' ? (
              <span className="text-green-400">Target reached!</span>
            ) : bet.status === 'lost' ? (
              <span className="text-red-400">Bet lost</span>
            ) : progress === 0 ? (
              <span className="text-dream-foreground/60">No change yet</span>
            ) : (
              <span className="text-dream-foreground/60">
                {calculateActualPercentageChange() > 0 ? "Up" : "Down"} {Math.abs(calculateActualPercentageChange()).toFixed(2)}%
              </span>
            )}
            <span>
              Current: {formatLargeNumber(currentMarketCap)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1 text-dream-foreground/60" />
            <span className="text-dream-foreground/60 mr-1">Bettor</span>
            <span className="font-medium">{truncatedAddress}</span>
          </div>
          
          <div className="flex items-center text-green-400 font-semibold">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Prediction</span>
            <span className="ml-2 font-bold">{bet.betType === 'up' ? 'MOON' : 'DUST'}</span>
          </div>
        </div>

        <div className="mt-2 text-xs text-dream-foreground/40">
          <div className="cursor-pointer hover:text-dream-foreground/60 transition-colors truncate" 
            onClick={() => copyToClipboard(bet.tokenMint || '')}>
            {bet.tokenMint}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBBetCard;
