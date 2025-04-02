
import React, { useState, useEffect } from 'react';
import { Bet } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ExternalLink, Clock, Copy, User, Target } from 'lucide-react';
import { acceptBet } from '@/services/supabaseService';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchTokenMetrics } from '@/services/tokenDataCache';
import { toast } from 'sonner';
import { fetchTokenPairData } from '@/services/dexScreenerService';

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
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Fetch token image when component mounts
  useEffect(() => {
    const fetchTokenImage = async () => {
      if (bet.tokenMint) {
        try {
          // First try to fetch token pair data which might contain image URL
          const pairData = await fetchTokenPairData(bet.tokenMint);
          if (pairData?.baseToken?.address) {
            // Try GitHub token list image format first
            const githubImageUrl = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${pairData.baseToken.address}/logo.png`;
            setTokenImage(githubImageUrl);
          }
        } catch (error) {
          console.error('Error fetching token image:', error);
          setImageError(true);
        }
      }
    };
    
    fetchTokenImage();
  }, [bet.tokenMint]);

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
            if (bet.prediction === 'moon') {
              // For moon bets, progress is % of growth toward target (capped at 100%)
              const targetIncrease = bet.initialMarketCap * 0.3; // Assuming 30% increase target
              const currentIncrease = Math.max(0, metrics.marketCap - bet.initialMarketCap);
              const progress = Math.min(100, currentIncrease / targetIncrease * 100);
              setProgressValue(progress);
            } else if (bet.prediction === 'die') {
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
      toast.error('Connect your wallet to accept a bet');
      return;
    }
    if (bet.initiator === publicKeyString) {
      toast.error('You cannot accept your own bet');
      return;
    }
    try {
      setAccepting(true);
      await onAcceptBet(bet);
      toast.success('Bet accepted successfully!');
    } catch (error) {
      console.error('Error accepting bet:', error);
      toast.error('Failed to accept bet');
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
    toast.success('Copied to clipboard');
  };

  // Check if bet is expired
  const isExpired = Date.now() > bet.expiresAt;

  // Determine bet status display
  let statusDisplay = 'Open';
  let statusClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
  if (bet.status === 'pending') {
    statusDisplay = 'Pending';
    statusClass = 'bg-blue-500/20 text-blue-400 border-blue-400/30';
  } else if (bet.status === 'completed' && bet.outcome === 'win') {
    statusDisplay = 'Won';
    statusClass = 'bg-green-500/20 text-green-400 border-green-400/30';
  } else if (bet.status === 'completed' && bet.outcome === 'loss') {
    statusDisplay = 'Lost';
    statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
  } else if (bet.status === 'completed' || bet.status === 'closed') {
    statusDisplay = 'Ended';
    statusClass = 'bg-purple-500/20 text-purple-400 border-purple-400/30';
  } else if (isExpired) {
    statusDisplay = 'Expired';
    statusClass = 'bg-red-500/20 text-red-400 border-red-400/30';
  } else if (bet.status === 'matched') {
    statusDisplay = 'Matched';
    statusClass = 'bg-purple-500/20 text-purple-400 border-purple-400/30';
  }

  const truncatedAddress = `${bet.initiator.substring(0, 4)}...${bet.initiator.substring(bet.initiator.length - 4)}`;
  const targetMarketCap = calculateTargetMarketCap();

  // Generate a color based on token symbol for fallback background
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

  const colorGradient = generateColorFromSymbol(bet.tokenSymbol);

  // Render token image or fallback
  const renderTokenImage = () => {
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
    
    // Fallback to first letter of symbol with gradient background
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
        <span className="font-bold text-white">{bet.tokenSymbol.charAt(0)}</span>
      </div>
    );
  };

  return <div className={`bg-black/60 rounded-lg border overflow-hidden transition-all duration-300 ${bet.status === 'open' ? 'border-dream-accent1/30' : bet.status === 'matched' || bet.status === 'pending' ? 'border-purple-500/30' : bet.status === 'expired' || isExpired ? 'border-red-500/30' : bet.status === 'completed' && bet.outcome === 'win' ? 'border-green-500/30' : bet.status === 'completed' && bet.outcome === 'loss' ? 'border-red-500/30' : 'border-yellow-500/30'}`}>
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to={`/betting/token/${bet.tokenId}`} className="flex items-center gap-2 hover:underline transition-all duration-300">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {renderTokenImage()}
            </div>
            <div>
              <div className="text-lg font-display font-bold">
                {bet.tokenName}
              </div>
              <div className="text-dream-foreground/60 text-sm">
                {bet.tokenSymbol}
              </div>
            </div>
          </Link>

          <div className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
            {statusDisplay}
          </div>
        </div>

        <div className="flex items-center text-sm text-dream-foreground/70 mt-1">
          <Clock className="w-4 h-4 mr-1 opacity-70" />
          <span>{isExpired ? 'Expired' : formatTimeRemaining(bet.expiresAt)}</span>
        </div>

        {/* Progress tracking section */}
        {bet.initialMarketCap && <div className="mt-4">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-dream-foreground/70">Progress</span>
              <span className="text-dream-foreground/50 text-xs">
                Updated {isLoading ? "..." : "recently"}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm mb-1">
              <span>Initial: {formatMarketCap(bet.initialMarketCap)}</span>
              <span className="text-dream-foreground/50">→</span>
              <span>Target: {formatMarketCap(targetMarketCap)}</span>
            </div>
            
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-1 relative">
              <div className={`h-full ${bet.outcome === 'win' ? 'bg-green-500' : bet.outcome === 'loss' ? 'bg-red-500' : 'bg-purple-500'}`} style={{
            width: `${progressValue}%`
          }}>
                <div className="absolute left-0 top-0 w-full h-full flex">
                  <div className="h-full w-2 bg-purple-600 opacity-50"></div>
                  <div className="h-full w-2 bg-purple-600 opacity-50 ml-auto"></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              {isLoading ? <span className="text-dream-foreground/60">Loading market cap data...</span> : <>
                  <span className={bet.outcome === 'win' ? 'text-green-400' : bet.outcome === 'loss' ? 'text-red-400' : calculateMarketCapChange() === null ? 'text-dream-foreground/60' : calculateMarketCapChange()! > 0 ? 'text-dream-foreground/60' : 'text-dream-foreground/60'}>
                    {bet.outcome === 'win' ? 'You Won! 🎉' : bet.outcome === 'loss' ? 'You Lost 😢' : calculateMarketCapChange() === null ? 'No change yet' : `${calculateMarketCapChange()! > 0 ? 'Up' : 'Down'} ${Math.abs(calculateMarketCapChange()!).toFixed(2)}%`}
                  </span>
                  <span>
                    Current: {formatMarketCap(currentMarketCap)}
                  </span>
                </>}
            </div>
          </div>}

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1 text-dream-foreground/60" />
            <span className="text-dream-foreground/60 mr-1">Bettor</span>
            <span className="font-medium">{truncatedAddress}</span>
            <button onClick={() => copyToClipboard(bet.initiator)} className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
          
          <div className={`flex items-center ${bet.prediction === 'moon' || bet.prediction === 'migrate' || bet.prediction === 'up' ? 'text-green-400' : 'text-red-400'} font-semibold`}>
            <Target className="w-4 h-4 mr-1" />
            <span>Prediction</span>
            <span className="ml-2 font-bold">
              {bet.prediction === 'moon' || bet.prediction === 'migrate' || bet.prediction === 'up' ? 'MOON 🚀' : 'DUST 💨'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-dream-foreground/40">
          <div className="cursor-pointer hover:text-dream-foreground/60 transition-colors truncate" onClick={() => copyToClipboard(bet.tokenMint)}>
            {bet.tokenMint}
          </div>
        </div>

        {bet.status === 'open' && !isExpired && connected && publicKeyString && publicKeyString !== bet.initiator && <div className="mt-4">
            
          </div>}

        {(!connected || !publicKeyString) && bet.status === 'open' && !isExpired && <div className="mt-4">
            <Button disabled className="w-full bg-dream-foreground/20 text-dream-foreground/50 cursor-not-allowed">
              Connect wallet to accept
            </Button>
          </div>}

        {bet.transactionSignature && <div className="mt-2 text-center">
            <a href={`https://solscan.io/tx/${bet.transactionSignature}`} target="_blank" rel="noopener noreferrer" className="text-xs text-dream-accent2 hover:underline inline-flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              View on Solscan
            </a>
          </div>}
      </div>
    </div>;
};
export default BetCard;
