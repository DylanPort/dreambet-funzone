import React, { useState, useEffect } from 'react';
import { Bet } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ExternalLink, AlertTriangle, Clock, Copy, BarChart, Target } from 'lucide-react';
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

  // Fetch the latest market cap data when component mounts
  useEffect(() => {
    const fetchMarketCap = async () => {
      if (bet.tokenMint) {
        try {
          const metrics = await fetchTokenMetrics(bet.tokenMint);
          if (metrics && metrics.marketCap !== null) {
            setCurrentMarketCap(metrics.marketCap);
            setIsLoading(false);

            // Calculate progress based on prediction type and target
            if (bet.initialMarketCap && bet.prediction === 'moon') {
              // For moon bets, progress is % of growth toward target (capped at 100%)
              const targetIncrease = bet.initialMarketCap * 0.3; // Assuming 30% increase target
              const currentIncrease = Math.max(0, metrics.marketCap - bet.initialMarketCap);
              const progress = Math.min(100, currentIncrease / targetIncrease * 100);
              setProgressValue(progress);
            } else if (bet.initialMarketCap && bet.prediction === 'die') {
              // For dust bets, progress is % of decline toward target (capped at 100%)
              const targetDecrease = bet.initialMarketCap * 0.3; // Assuming 30% decrease target
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
    return bet.prediction === 'moon' || bet.prediction === 'migrate' ? bet.initialMarketCap * 1.3 // 30% increase
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

  // Check if bet is expired
  const isExpired = Date.now() > bet.expiresAt;

  // Determine bet status display
  let statusDisplay = 'Open';
  let statusClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
  if (bet.status === 'pending') {
    statusDisplay = 'Pending';
    statusClass = 'bg-blue-500/20 text-blue-400 border-blue-400/30';
  } else if (bet.status === 'completed' || bet.status === 'closed') {
    if (bet.outcome === 'win') {
      statusDisplay = 'Ended Win';
      statusClass = 'bg-green-500/20 text-green-400 border-green-400/30';
    } else {
      statusDisplay = 'Ended Loss';
      statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
    }
  } else if (isExpired) {
    statusDisplay = 'Expired';
    statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
  } else if (bet.status === 'matched') {
    statusDisplay = 'Matched';
    statusClass = 'bg-purple-500/20 text-purple-400 border-purple-400/30';
  }
  return (
    <div className={`backdrop-blur-lg border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${bet.status === 'open' ? 'bg-black/20 border-dream-accent1/30' : bet.status === 'matched' ? 'bg-black/30 border-purple-500/30' : bet.status === 'expired' ? 'bg-black/20 border-red-500/30' : bet.outcome === 'win' ? 'bg-black/20 border-green-500/30' : bet.outcome === 'loss' ? 'bg-black/20 border-red-500/30' : 'bg-black/20 border-yellow-500/30'}`}>
      <div className="p-4 hover:bg-dream-accent1/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {bet.prediction === 'moon' || bet.prediction === 'migrate' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            </div>
            <span className="font-semibold">
              {bet.amount} PXB
            </span>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full ${bet.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : bet.status === 'matched' ? 'bg-purple-500/20 text-purple-400' : bet.status === 'completed' ? 'bg-green-500/20 text-green-400' : bet.status === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
          </div>
        </div>
        
        <Link to={`/betting/token/${bet.tokenId}`} className="mb-1 hover:underline text-dream-accent2">
          <div className="text-sm flex items-center">
            <ExternalLink className="w-3 h-3 mr-1" />
            {bet.tokenName} ({bet.tokenSymbol})
          </div>
        </Link>
        
        <div className="text-sm text-dream-foreground/70 mb-1">
          Prediction: {bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'Price will increase' : 'Price will decrease'} by 30%
        </div>
        
        {currentMarketCap && bet.initialMarketCap && (
          <div className="my-2 space-y-1">
            <div className="flex justify-between text-xs text-dream-foreground/70">
              <span>Initial: ${formatMarketCap(bet.initialMarketCap)}</span>
              <span>Current: ${formatMarketCap(currentMarketCap)}</span>
            </div>
            <Progress value={progressValue} className="h-1" />
            <div className="flex justify-between text-xs text-dream-foreground/60">
              <span>Progress: {progressValue.toFixed(1)}%</span>
              <span>Target: ${formatMarketCap(calculateTargetMarketCap())}</span>
            </div>
          </div>
        )}
        
        <div className="text-xs text-dream-foreground/60 mb-2">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeRemaining(bet.expiresAt)}
          </div>
        </div>

        {/* Accept Bet Button (Only show for open bets that haven't expired and aren't from the current user) */}
        {bet.status === 'open' && !isExpired && connected && publicKeyString && publicKeyString !== bet.initiator && (
          <Button
            onClick={handleAcceptBet}
            disabled={accepting}
            className="w-full bg-dream-accent2 hover:bg-dream-accent2/80 text-white"
            size="sm"
          >
            {accepting ? 'Processing...' : 'Accept Bet'}
          </Button>
        )}

        {(!connected || !publicKeyString) && bet.status === 'open' && !isExpired && (
          <Button disabled className="w-full bg-dream-foreground/20 text-dream-foreground/50 cursor-not-allowed" size="sm">
            Connect wallet to accept
          </Button>
        )}
      </div>
    </div>
  );
};

export default BetCard;
