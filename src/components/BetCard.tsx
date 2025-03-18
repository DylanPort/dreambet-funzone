
import React from 'react';
import { Bet } from '@/types/bet';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import TokenContractInfo from './TokenContractInfo';

interface BetCardProps {
  bet: Bet;
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
}

const BetCard: React.FC<BetCardProps> = ({ bet, connected, publicKeyString, onAcceptBet }) => {
  const isUserBet = publicKeyString && bet.initiator === publicKeyString;
  const formattedDate = new Date(bet.expiresAt).toLocaleString();
  
  return (
    <div className="border border-dream-foreground/10 hover:border-dream-accent2/30 rounded-lg p-4 transition-all hover:bg-dream-foreground/5">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              bet.prediction === 'migrate' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {bet.prediction === 'migrate' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
            <span className="font-semibold">
              {bet.tokenSymbol || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-dream-foreground/70">{bet.tokenName || 'Unknown Token'}</p>
          
          {bet.tokenMint && <TokenContractInfo tokenId={bet.tokenMint} />}
        </div>
        
        <div className="text-right">
          <div className="font-semibold">{bet.amount} PXB</div>
          <div className="text-xs text-dream-foreground/50">
            {formattedDate}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-3">
        {!isUserBet && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAcceptBet(bet)}
            disabled={!connected}
            className="text-xs"
          >
            {bet.prediction === 'migrate' ? 'Bet it will DIE' : 'Bet it will MOON'}
          </Button>
        )}
        
        {isUserBet && (
          <div className="text-xs px-2 py-1 bg-dream-accent2/20 text-dream-accent2 rounded">
            Your bet
          </div>
        )}
      </div>
    </div>
  );
};

export default BetCard;
