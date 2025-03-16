
import React from 'react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, Wallet, Users, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bet } from '@/types/bet';
import { formatTimeRemaining, formatAddress, formatBetDuration } from '@/utils/betUtils';
import { Progress } from '@/components/ui/progress';

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
    
    if (bet.prediction === 'migrate') {
      if (actualChange < 0) return 0;
      return Math.min(100, (actualChange / targetChange) * 100);
    } else {
      if (actualChange > 0) return 0;
      return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
    }
  };
  
  const progress = calculateProgress();
  
  // Ensure we're not using bet.id directly as a key in parent components
  return (
    <div className="glass-panel p-4 transition-all hover:shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display font-semibold flex items-center gap-2">
            {bet.tokenName} <span className="text-sm font-normal text-dream-foreground/60">({bet.tokenSymbol})</span>
          </h3>
          <div className="flex items-center text-sm text-dream-foreground/70 mt-1">
            <Users className="w-3 h-3 mr-1" />
            <span className="truncate">
              Created by: {formatAddress(bet.initiator)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end text-sm">
          <div className="flex items-center mb-1">
            <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
            <span className={`${isExpiringSoon ? 'text-red-400 font-semibold' : 'text-dream-foreground/70'}`}>
              {formatTimeRemaining(bet.expiresAt)}
            </span>
          </div>
          <div className="flex items-center">
            <Timer className="w-3 h-3 mr-1 text-dream-foreground/70" />
            <span className="text-dream-foreground/70">
              {bet.duration ? formatBetDuration(bet.duration) : "1h bet"}
            </span>
          </div>
        </div>
      </div>
      
      {progress !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-dream-foreground/60">Progress towards target</span>
            <span className={bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-dream-foreground/60 mt-1">
            {bet.currentMarketCap && bet.initialMarketCap && (
              <span>
                Current change: {(((bet.currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center mt-3 justify-between">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
            bet.prediction === 'migrate'
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {bet.prediction === 'migrate' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </div>
          <div>
            <div className="font-semibold flex items-center">
              Betting {bet.prediction === 'migrate' ? 'MIGRATE 🚀' : 'DIE 💀'}
              {isExpiringSoon && (
                <AlertTriangle className="ml-2 w-4 h-4 text-orange-400" />
              )}
            </div>
            <div className="flex items-center text-sm text-dream-foreground/70">
              <Wallet className="w-3 h-3 mr-1" />
              <span>{bet.amount} SOL</span>
              <span className="mx-1">•</span>
              <span>Potential win: {bet.amount * 2} SOL</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAcceptBet}
          className={`${
            bet.prediction === 'migrate'
              ? 'bg-red-500 hover:bg-red-600'  // If they bet migrate, you bet die (red)
              : 'bg-green-500 hover:bg-green-600'  // If they bet die, you bet migrate (green)
          }`}
          disabled={!connected || bet.initiator === publicKeyString}
        >
          Bet Against This
        </Button>
      </div>
      
      <div className="mt-3 p-2 bg-dream-foreground/5 rounded text-xs text-dream-foreground/70">
        <p>All bets are against the house. If you win, points are awarded from the PXB supply. If you lose, your points return to the PXB supply.</p>
      </div>
    </div>
  );
};

export default BetCard;
