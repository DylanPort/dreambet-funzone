import React, { useState, useEffect } from 'react';
import { Bet } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ExternalLink, AlertTriangle, Clock, Copy, BarChart, Target, User } from 'lucide-react';
import { acceptBet } from '@/services/supabaseService';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchTokenMetrics } from '@/services/tokenDataCache';

interface BetCardProps {
  bet: Bet;
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
}

const BetCard: React.FC<BetCardProps> = ({
  bet,
  connected,
  publicKeyString,
  onAcceptBet
}) => {
  const [accepting, setAccepting] = React.useState(false);
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(bet.currentMarketCap || null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch the latest market cap data when component mounts
  useEffect(() => {
    const fetchMarketCap = async () => {
      if (bet.tokenMint) {
        try {
          const metrics = await fetchTokenMetrics(bet.tokenMint);
          if (metrics && metrics.marketCap !== null) {
            setCurrentMarketCap(metrics.marketCap);
            setIsLoading(false);
            setLastUpdated(new Date());

            // Calculate progress based on prediction type and target
            if (bet.initialMarketCap && bet.prediction === 'moon') {
              // For moon bets, progress is % of growth toward target (capped at 100%)
              const targetIncrease = bet.initialMarketCap * 0.3; // Assuming a 30% increase target
              const currentIncrease = Math.max(0, metrics.marketCap - bet.initialMarketCap);
              const progress = Math.min(100, currentIncrease / targetIncrease * 100);
              setProgressValue(progress);
            } else if (bet.initialMarketCap && bet.prediction === 'die') {
              // For dust bets, progress is % of decline toward target (capped at 100%)
              const targetDecrease = bet.initialMarketCap * 0.3; // Assuming a 30% decrease target
              const currentDecrease = Math.max(0, bet.initialMarketCap - metrics.marketCap);
              const progress = Math.min(100, currentDecrease / targetDecrease * 100);
              setProgressValue(progress);
            }
          }
        } catch (error) {
          console.error('Error fetching token metrics:', error);
          setIsLoading(false);
        }
      }
    };

    fetchMarketCap();
    
    // Set up interval to update market cap every 2 seconds
    const interval = setInterval(fetchMarketCap, 2000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [bet.tokenMint, bet.initialMarketCap, bet.prediction]);

  const handleAcceptBet = async () => {
    if (!connected || !publicKeyString) {
      console.error('Connect your wallet to accept a bet');
      return;
    }
    if (bet.initiator === publicKeyString) {
      console.error('You cannot accept your own bet');
      return;
    }
    try {
      setAccepting(true);
      await onAcceptBet(bet);
    } catch (error) {
      console.error('Error accepting bet:', error);
    } finally {
      setAccepting(false);
    }
  };

  // Format market cap for display
  const formatMarketCap = (value: number | null) => {
    if (value === null) return "N/A";
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Calculate target market cap
  const calculateTargetMarketCap = () => {
    if (!bet.initialMarketCap) return null;
    return bet.prediction === 'moon' || bet.prediction === 'migrate' 
      ? bet.initialMarketCap * 1.3 // 30% increase
      : bet.initialMarketCap * 0.7; // 30% decrease
  };

  // Calculate market cap change percentage
  const calculateMarketCapChange = () => {
    if (!bet.initialMarketCap || !currentMarketCap) return null;
    return (currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap * 100;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  // Get time ago for last updated
  const getLastUpdatedText = () => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 3) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  // Check if bet is expired
  const isExpired = Date.now() > bet.expiresAt;

  // Determine bet status display
  let statusDisplay = 'Open';
  let statusClass = 'text-yellow-400';
  if (bet.status === 'pending') {
    statusDisplay = 'Pending';
    statusClass = 'text-blue-400';
  } else if (bet.status === 'completed' || bet.status === 'closed') {
    if (bet.outcome === 'win') {
      statusDisplay = 'Won';
      statusClass = 'text-green-400';
    } else {
      statusDisplay = 'Lost';
      statusClass = 'text-red-400';
    }
  } else if (isExpired) {
    statusDisplay = 'Expired';
    statusClass = 'text-red-400';
  } else if (bet.status === 'matched') {
    statusDisplay = 'Matched';
    statusClass = 'text-purple-400';
  }

  // Calculate if the bet needs to show a target reached indicator
  const hasReachedTarget = progressValue >= 100;
  
  // Format bettor address
  const truncatedAddress = bet.initiator 
    ? `${bet.initiator.substring(0, 6)}...${bet.initiator.substring(bet.initiator.length - 4)}`
    : 'Unknown';

  const targetMarketCap = calculateTargetMarketCap();
  const progressText = 
    progressValue <= 0 
      ? "No change yet" 
      : `${calculateMarketCapChange()?.toFixed(2)}% (${progressValue.toFixed(1)}% complete)`;

  return (
    <div className={`bg-black/40 backdrop-blur-sm rounded-lg border border-dream-foreground/10 mb-2 relative overflow-hidden`}>
      {hasReachedTarget && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs font-semibold rounded-bl-lg">
          Target Reached!
        </div>
      )}
      
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <span className="text-white text-xs">PXB</span>
            </div>
            <div>
              <span className="text-purple-400 font-semibold">PumpXBounty</span>
              <span className="text-dream-foreground/60 ml-1">POINTS</span>
            </div>
          </div>
          <div className="text-purple-400 font-mono font-medium">
            {bet.amount} PXB
          </div>
        </div>

        <div className="flex items-center text-xs text-dream-foreground/60 mb-3">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatTimeRemaining(bet.expiresAt)}</span>
          <span className="mx-2">•</span>
          <span className={statusClass}>{statusDisplay}</span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-dream-foreground/60">Progress</span>
            <span className="text-dream-foreground/40 text-[10px]">
              Updated {getLastUpdatedText()}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs mb-1">
            <span>Initial: {formatMarketCap(bet.initialMarketCap)}</span>
            <span className="text-dream-foreground/60">→</span>
            <span className={hasReachedTarget ? "text-green-400" : ""}>
              Target: {formatMarketCap(targetMarketCap)}
            </span>
          </div>
          
          <Progress 
            value={progressValue <= 0 ? 0 : progressValue} 
            className={`h-2 ${hasReachedTarget ? 'bg-green-900/30' : progressValue <= 0 ? 'bg-red-900/30' : 'bg-black/30'}`} 
          />
          
          <div className="flex justify-between items-center text-xs mt-1">
            <span className={`${
              hasReachedTarget 
                ? 'text-green-400' 
                : progressValue <= 0 
                  ? 'text-dream-foreground/60' 
                  : progressValue >= 100 
                    ? 'text-green-400' 
                    : 'text-purple-400'
            }`}>
              {progressText}
            </span>
            <span>
              Current: {formatMarketCap(currentMarketCap)}
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
          
          <div className={`flex items-center justify-between ${bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}`}>
            <div className="flex items-center">
              <Target className="w-3 h-3 mr-1" />
              <span>Prediction</span>
            </div>
            <span className="font-medium">
              {bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'MOON' : 'DUST'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-dream-foreground/40">
          <div className="truncate">
            {bet.tokenMint}
          </div>
        </div>
        
        {bet.status === 'open' && !isExpired && connected && publicKeyString && publicKeyString !== bet.initiator && (
          <div className="mt-4">
            <Button
              className="w-full bg-dream-accent1 hover:bg-dream-accent1/80"
              disabled={accepting}
              onClick={handleAcceptBet}
            >
              {accepting ? 'Accepting bet...' : 'Accept Bet'}
            </Button>
          </div>
        )}

        {(!connected || !publicKeyString) && bet.status === 'open' && !isExpired && (
          <div className="mt-4">
            <Button disabled className="w-full bg-dream-foreground/20 text-dream-foreground/50 cursor-not-allowed">
              Connect wallet to accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetCard;
