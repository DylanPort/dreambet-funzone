import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { User, TrendingUp, Clock } from 'lucide-react';
import { PXBBet } from '@/types/pxb';
import { fetchTokenImage } from '@/services/moralisService';
import { Skeleton } from '@/components/ui/skeleton';

interface PXBBetCardProps {
  bet: PXBBet;
  marketCapData: {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  } | undefined;
  isLoading: boolean;
}

const PXBBetCard: React.FC<PXBBetCardProps> = ({ bet, marketCapData, isLoading }) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
        addSuffix: true
      });
    } catch (e) {
      return 'recently';
    }
  };

  const calculateProgress = () => {
    if (bet.status !== 'pending') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    const currentMarketCap = marketCapData?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) {
      return 0;
    }
    
    const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    const targetChange = bet.percentageChange;
    
    if (bet.betType === 'up') {
      // For moon bets, target is 80% increase
      return Math.min(100, (actualChange / 80) * 100);
    } else {
      // For dust bets, target is 50% decrease
      return Math.min(100, (Math.abs(actualChange) / 50) * 100);
    }
  };

  const isProgressNegative = () => {
    if (bet.status !== 'pending') {
      return bet.status === 'lost';
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    const currentMarketCap = marketCapData?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) {
      return false;
    }
    
    const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    
    // For moon bets, negative progress when price goes down
    // For dust bets, negative progress when price goes up
    return (bet.betType === 'up' && actualChange < 0) || 
           (bet.betType === 'down' && actualChange > 0);
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
      // Target for moon bets is 80% increase
      return initialMarketCap * 1.8;
    } else {
      // Target for dust bets is 50% decrease
      return initialMarketCap * 0.5;
    }
  };

  const renderTokenImage = () => {
    if (imageLoading) {
      return <Skeleton className="w-8 h-8 rounded-full" />;
    }
    
    if (tokenImage && !imageError) {
      return (
        <img 
          src={tokenImage} 
          alt={bet.tokenSymbol}
          className="w-8 h-8 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }
    
    // Fallback to first letter of symbol with gradient background
    const colorGradient = generateColorFromSymbol(bet.tokenSymbol);
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white font-bold text-sm`}>
        {bet.tokenSymbol ? bet.tokenSymbol.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  const progress = calculateProgress();
  const isNegative = isProgressNegative();
  const truncatedAddress = bet.userId ? `${bet.userId.substring(0, 6)}...${bet.userId.substring(bet.userId.length - 4)}` : 'Unknown';
  const targetMarketCap = calculateTargetMarketCap();

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-dream-foreground/10 mb-2 relative overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            {renderTokenImage()}
            <div>
              <span className="text-purple-400 font-semibold">PumpXBounty</span>
              <span className="text-dream-foreground/60 ml-1">POINTS</span>
            </div>
          </div>
          <div className="text-purple-400 font-mono font-medium">
            {bet.betAmount} PXB
          </div>
        </div>

        <div className="flex items-center text-xs text-dream-foreground/60 mb-3">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatTimeAgo(bet.createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{bet.status}</span>
        </div>

        <div className="mb-3">
          <div className="text-xs text-dream-foreground/60 mb-1">Progress</div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span>Initial: {formatLargeNumber(bet.initialMarketCap || marketCapData?.initialMarketCap)}</span>
            <span className="text-dream-foreground/60">→</span>
            <span>Target: {formatLargeNumber(targetMarketCap)}</span>
          </div>
          <Progress 
            value={isNegative ? 0 : progress} 
            className={`h-2 ${isNegative ? 'bg-red-900/30' : 'bg-black/30'}`} 
          />
          <div className="flex justify-between items-center text-xs mt-1">
            <span className={`${isNegative ? 'text-red-400' : progress === 0 ? 'text-dream-foreground/60' : progress === 100 ? 'text-green-400' : 'text-purple-400'}`}>
              {isNegative ? 'Moving opposite direction' : `${progress.toFixed(1)}% complete`}
            </span>
            <span>
              Current: {formatLargeNumber(marketCapData?.currentMarketCap)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1 text-dream-foreground/60" />
              <span className="text-dream-foreground/60">Bettor</span>
            </div>
            <span className="font-medium">{truncatedAddress}</span>
          </div>
          
          <div className={`flex items-center justify-between ${bet.betType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            <div className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Prediction</span>
            </div>
            <span className="font-medium">
              {bet.betType === 'up' ? 'MOON' : 'DUST'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-dream-foreground/40">
          <div className="truncate">
            {bet.tokenMint}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBBetCard;
