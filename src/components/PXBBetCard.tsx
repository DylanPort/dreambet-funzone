
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { User, TrendingUp, Clock } from 'lucide-react';
import { PXBBet } from '@/types/pxb';

interface PXBBetCardProps {
  bet: PXBBet;
  marketCapData: {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  } | undefined;
  isLoading: boolean;
}

const PXBBetCard: React.FC<PXBBetCardProps> = ({ bet, marketCapData, isLoading }) => {
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
      if (actualChange < 0) return 0;
      return Math.min(100, actualChange / targetChange * 100);
    } else {
      if (actualChange > 0) return 0;
      return Math.min(100, Math.abs(actualChange) / targetChange * 100);
    }
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

  const progress = calculateProgress();
  const truncatedAddress = `${bet.creator?.substring(0, 6)}...${bet.creator?.substring(bet.creator.length - 4)}`;

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-dream-foreground/10 mb-2 relative overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-purple-400 font-semibold">PumpXBounty</span>
            <span className="text-dream-foreground/60 ml-1">POINTS</span>
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
          </div>
          <Progress value={progress} className="h-2 bg-black/30" />
          <div className="flex justify-between items-center text-xs mt-1">
            <span className={`${progress === 0 ? 'text-dream-foreground/60' : progress === 100 ? 'text-green-400' : 'text-purple-400'}`}>
              {progress.toFixed(1)}% complete
            </span>
            <span>
              Initial: {formatLargeNumber(bet.initialMarketCap || marketCapData?.initialMarketCap)}
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
