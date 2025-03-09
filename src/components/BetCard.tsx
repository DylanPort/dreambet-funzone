
import React from 'react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, Wallet, Users, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bet } from '@/types/bet';
import { formatTimeRemaining, formatAddress, formatBetDuration } from '@/utils/betUtils';

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
  const isExpiringSoon = bet.expiresAt - new Date().getTime() < 3600000; // less than 1 hour
  
  return (
    <div key={bet.id} className="glass-panel p-4 transition-all hover:shadow-lg animate-fade-in">
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
              {bet.duration ? formatBetDuration(bet.duration) : "1h bet"} {/* Display bet duration */}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center mt-3 justify-between">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
            bet.prediction === 'up' || bet.prediction === 'migrate'
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {bet.prediction === 'up' || bet.prediction === 'migrate' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </div>
          <div>
            <div className="font-semibold flex items-center">
              Betting {bet.prediction === 'up' || bet.prediction === 'migrate' ? 'MIGRATE 🚀' : 'DIE 💀'}
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
          onClick={() => onAcceptBet(bet)}
          className={`${
            bet.prediction === 'up' || bet.prediction === 'migrate'
              ? 'bg-red-500 hover:bg-red-600'  // If they bet migrate, you bet die (red)
              : 'bg-green-500 hover:bg-green-600'  // If they bet die, you bet migrate (green)
          }`}
          disabled={!connected || bet.initiator === publicKeyString}
        >
          Take {bet.prediction === 'up' || bet.prediction === 'migrate' ? 'DIE 💀' : 'MIGRATE 🚀'} Position
        </Button>
      </div>
    </div>
  );
};

export default BetCard;
