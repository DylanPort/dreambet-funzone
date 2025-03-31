
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
  return <div className={`backdrop-blur-lg border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${bet.status === 'open' ? 'bg-black/20 border-dream-accent1/30' : bet.status === 'matched' ? 'bg-black/30 border-purple-500/30' : bet.status === 'expired' ? 'bg-black/20 border-red-500/30' : bet.outcome === 'win' ? 'bg-black/20 border-green-500/30' : bet.outcome === 'loss' ? 'bg-black/20 border-red-500/30' : 'bg-black/20 border-yellow-500/30'}`}>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to={`/betting/token/${bet.tokenId}`} className="text-xl font-display font-bold hover:underline transition-all duration-300">
            {bet.tokenName}
            <span className="text-dream-foreground/50 text-sm ml-2">
              ({bet.tokenSymbol})
            </span>
          </Link>

          <div className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
            {statusDisplay}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-dream-foreground/70">Prediction</div>
            <div className={`text-lg font-medium flex items-center ${bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}`}>
              {bet.prediction === 'moon' || bet.prediction === 'migrate' ? <>
                  <ArrowUp className="w-5 h-5 mr-1" />
                  MOON
                </> : <>
                  <ArrowDown className="w-5 h-5 mr-1" />
                  DUST
                </>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-dream-foreground/70">Bet Amount</div>
            <div className="text-lg font-medium text-dream-accent1">
              {bet.amount} PXB
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-dream-foreground/70">Created By</div>
            <div className="text-md font-medium overflow-hidden text-ellipsis flex items-center">
              <span title={bet.initiator}>
                {bet.initiator.substring(0, 4)}...{bet.initiator.substring(bet.initiator.length - 4)}
              </span>
              <button onClick={() => copyToClipboard(bet.initiator)} className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-dream-foreground/70">
              {isExpired ? 'Expired' : 'Expires'}
            </div>
            <div className="text-md font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1 text-dream-foreground/70" />
              {formatTimeRemaining(bet.expiresAt)}
            </div>
          </div>
        </div>

        {/* Market cap tracking section - shown for expired or active bets with initialMarketCap */}
        {(bet.initialMarketCap || isExpired) && (
          <div className="mt-4 space-y-3 border-t border-dream-foreground/10 pt-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-dream-foreground/70">Initial:</span>
                <span className="font-medium">{formatMarketCap(bet.initialMarketCap)}</span>
              </div>
              
              {currentMarketCap && (
                <div className="flex items-center space-x-1">
                  <span className="text-dream-foreground/70">Current:</span>
                  <span className="font-medium">{formatMarketCap(currentMarketCap)}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <span className={`text-${bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'green' : 'red'}-400`}>Target:</span>
                <span className={`font-medium text-${bet.prediction === 'moon' || bet.prediction === 'migrate' ? 'green' : 'red'}-400`}>
                  {formatMarketCap(calculateTargetMarketCap())}
                </span>
              </div>
            </div>
            
            <Progress value={progressValue} className="h-2" />
            
            {calculateMarketCapChange() !== null && (
              <div className="text-center text-sm">
                <span className={calculateMarketCapChange()! >= 0 ? 'text-green-400' : 'text-red-400'}>
                  Market cap {calculateMarketCapChange()! >= 0 ? 'up' : 'down'} {Math.abs(calculateMarketCapChange()!).toFixed(2)}%
                </span>
                {isExpired && !currentMarketCap && (
                  <span className="ml-2 text-dream-foreground/70">Bet expired</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-dream-foreground/10">
          <div className="flex justify-between items-center text-xs text-dream-foreground/60">
            <div className="flex items-center">
              <span>Bet ID: </span>
              <span className="font-mono ml-1">{bet.id?.substring(0, 8) || 'Unknown'}</span>
              <button onClick={() => copyToClipboard(bet.id || 'Unknown')} className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors">
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {bet.transactionSignature && <a href={`https://solscan.io/tx/${bet.transactionSignature}`} target="_blank" rel="noopener noreferrer" className="text-dream-accent2 hover:underline inline-flex items-center">
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Solscan
              </a>}
          </div>
        </div>

        {bet.status === 'open' && !isExpired && connected && publicKeyString && publicKeyString !== bet.initiator && <div className="mt-4">
            <Button onClick={handleAcceptBet} disabled={accepting} className="w-full">
              {accepting ? 'Accepting Bet...' : 'Accept Bet'}
            </Button>
          </div>}

        {(!connected || !publicKeyString) && bet.status === 'open' && !isExpired && <div className="mt-4">
            <Button disabled className="w-full bg-dream-foreground/20 text-dream-foreground/50 cursor-not-allowed">
              Connect wallet to accept
            </Button>
          </div>}
      </div>
    </div>;
};
export default BetCard;
