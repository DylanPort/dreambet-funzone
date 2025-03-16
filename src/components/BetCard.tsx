
import React from 'react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, Wallet, Users, Timer, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bet } from '@/types/bet';
import { formatTimeRemaining, formatAddress, formatBetDuration } from '@/utils/betUtils';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface BetCardProps {
  bet: Bet;
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
  onBetAccepted?: () => void; // Added for TokenDetail page
}

const BetCard: React.FC<BetCardProps> = ({ 
  bet, 
  connected, 
  publicKeyString, 
  onAcceptBet,
  onBetAccepted
}) => {
  const isExpiringSoon = bet.expiresAt - new Date().getTime() < 3600000; // less than 1 hour
  const isActive = bet.status === 'open';
  const expiryDate = new Date(bet.expiresAt);
  const timeLeft = isActive ? formatDistanceToNow(expiryDate, { addSuffix: true }) : '';
  
  const handleAcceptBet = async () => {
    try {
      await onAcceptBet(bet);
      
      if (onBetAccepted) {
        onBetAccepted();
      }
    } catch (error) {
      console.error("Error accepting bet:", error);
    }
  };
  
  // Calculate bet progress if available
  const calculateProgress = () => {
    if (!bet.initialMarketCap || !bet.currentMarketCap) return null;
    
    const actualChange = ((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
    const targetChange = 10; // Default target change percentage
    
    // For "up" bets (migrate)
    if (bet.prediction === 'migrate') {
      if (actualChange < 0) return 0; // If price is going down, progress is 0
      return Math.min(100, (actualChange / targetChange) * 100);
    } 
    // For "down" bets (die)
    else {
      if (actualChange > 0) return 0; // If price is going up, progress is 0
      return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
    }
  };
  
  const progress = calculateProgress();
  
  // Determine status icon and class
  let statusIcon;
  let statusClass;
  
  if (bet.status === 'open') {
    statusIcon = <HelpCircle className="h-4 w-4 text-yellow-400" />;
    statusClass = 'text-yellow-400';
  } else if (bet.status === 'completed' && bet.winner === publicKeyString) {
    statusIcon = <CheckCircle className="h-4 w-4 text-green-400" />;
    statusClass = 'text-green-400';
  } else {
    statusIcon = <XCircle className="h-4 w-4 text-red-400" />;
    statusClass = 'text-red-400';
  }
  
  // Format large numbers with appropriate units (K, M, B)
  const formatLargeNumber = (num) => {
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
  
  // Calculate target market cap for winning
  const calculateWinningMarketCap = () => {
    if (!bet.initialMarketCap) return null;
    
    return bet.prediction === 'migrate'
      ? bet.initialMarketCap * 1.1  // 10% increase
      : bet.initialMarketCap * 0.9; // 10% decrease
  };
  
  const winningMarketCap = calculateWinningMarketCap();
  
  return (
    <div 
      className={`glass-panel p-4 border transition-all ${
        isActive 
          ? 'border-yellow-400/30 animate-pulse-slow' 
          : bet.status === 'completed' && bet.winner === publicKeyString
            ? 'border-green-400/30' 
            : 'border-red-400/30'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent2/20 flex items-center justify-center mr-2">
            {bet.prediction === 'migrate' 
              ? <ArrowUp className="h-4 w-4 text-green-400" />
              : <ArrowDown className="h-4 w-4 text-red-400" />
            }
          </div>
          <div>
            <p className="font-semibold">{bet.tokenSymbol}</p>
            <p className="text-xs text-dream-foreground/60">{bet.tokenName}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-semibold">{bet.amount} SOL</p>
          <p className="text-xs text-dream-foreground/60">
            Prediction: {bet.prediction === 'migrate' ? 'MOON' : 'DIE'}
          </p>
        </div>
      </div>
      
      {/* Market Cap Info */}
      <div className="grid grid-cols-2 gap-2 mb-3 mt-2 text-xs">
        <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
          <div className="text-dream-foreground/50 mb-1">Entry MCAP</div>
          <div className="font-medium">
            {formatLargeNumber(bet.initialMarketCap || 0)}
          </div>
        </div>
        <div className="bg-dream-foreground/10 px-2 py-1.5 rounded">
          <div className="text-dream-foreground/50 mb-1">Win MCAP</div>
          <div className="font-medium">
            {formatLargeNumber(winningMarketCap || 0)}
          </div>
        </div>
      </div>
      
      {/* Progress Indicator - only for active bets */}
      {isActive && progress !== null && (
        <div className="mb-3 mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-dream-foreground/60">Progress towards target</span>
            <span className={bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {bet.currentMarketCap && bet.initialMarketCap && (
            <div className="text-xs text-dream-foreground/60 mt-1">
              Market cap change: {(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100).toFixed(2)}%
              {bet.prediction === 'migrate'
                ? ` / Target: +10%`
                : ` / Target: -10%`
              }
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center text-xs">
        {/* For active bets, show status and time left */}
        {isActive ? (
          <>
            <div className="flex items-center">
              {statusIcon}
              <span className={`ml-1 ${statusClass}`}>Active</span>
              <span className="ml-2 text-dream-foreground/60">
                Ends {timeLeft}
              </span>
            </div>
            <span className="text-dream-foreground/60">
              Current: {formatLargeNumber(bet.currentMarketCap || 0)}
            </span>
          </>
        ) : (
          /* For expired bets, simply show win/loss status */
          <div className="w-full flex justify-center items-center py-1">
            {bet.status === 'completed' && bet.winner === publicKeyString ? (
              <span className="text-green-400 font-semibold flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> WIN (+{bet.amount * 2} SOL)
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center">
                <XCircle className="h-4 w-4 mr-2" /> LOSS
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Additional info only for active bets */}
      {isActive && (
        <>
          {/* House betting explanation */}
          <div className="mt-2 text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-2">
            <p>Betting against the house: If you win, you'll earn {bet.amount} SOL from the house.</p>
          </div>
          
          {/* Accept bet button */}
          {publicKeyString !== bet.initiator && (
            <Button 
              onClick={handleAcceptBet}
              className="w-full mt-3"
              disabled={!connected}
            >
              Bet Against This
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BetCard;
