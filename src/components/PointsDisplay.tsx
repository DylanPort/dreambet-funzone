
import React from 'react';
import { Zap, Info } from 'lucide-react';
import useUserPoints from '@/hooks/useUserPoints';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletConnectButton from '@/components/WalletConnectButton';

interface PointsDisplayProps {
  showAvailable?: boolean;
  showConnect?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  showAvailable = true, 
  showConnect = true,
  size = 'md' 
}) => {
  const { points, loading } = useUserPoints();
  const { connected } = useWallet();

  if (!connected) {
    return showConnect ? (
      <div className="flex items-center">
        <WalletConnectButton />
        <span className="ml-2 text-dream-foreground/60 text-sm">Connect to earn PXB Points</span>
      </div>
    ) : null;
  }

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-dream-accent2 animate-spin mr-2"></div>
        <span className="text-dream-foreground/60">Loading points...</span>
      </div>
    );
  }

  if (!points) {
    return (
      <div className="text-dream-foreground/60 flex items-center">
        <Zap className="w-4 h-4 mr-1 text-yellow-400" />
        <span>No points available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center ${
        size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
      } bg-dream-accent1/10 backdrop-blur-sm rounded-full px-3 py-1 border border-dream-accent1/20`}>
        <Zap className={`${
          size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
        } mr-1 text-yellow-400`} />
        <span className="font-semibold">{points.total} PXB</span>
      </div>
      
      {showAvailable && points.available !== points.total && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center ${
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
              } bg-dream-surface/50 rounded-full px-2 py-0.5 border border-dream-foreground/10`}>
                <span>{points.available} available</span>
                <Info className="w-3 h-3 ml-1 text-dream-foreground/60" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {points.total - points.available} points are currently in active bets
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default PointsDisplay;
