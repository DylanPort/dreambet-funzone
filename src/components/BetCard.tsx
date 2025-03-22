
import React from 'react';
import { Bet } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ExternalLink, AlertTriangle, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { acceptBet } from '@/services/supabaseService';
import { Link } from 'react-router-dom';

interface BetCardProps {
  bet: Bet;
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
}

const BetCard: React.FC<BetCardProps> = ({ bet, connected, publicKeyString, onAcceptBet }) => {
  const [accepting, setAccepting] = React.useState(false);
  
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
    } catch (error) {
      console.error('Error accepting bet:', error);
      toast.error('Failed to accept bet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAccepting(false);
    }
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`${label} copied to clipboard`);
      })
      .catch(err => {
        toast.error('Failed to copy to clipboard');
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
    <div className={`backdrop-blur-lg border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
      bet.status === 'open' ? 'bg-black/20 border-dream-accent1/30' : 
      bet.status === 'matched' ? 'bg-black/30 border-purple-500/30' : 
      bet.status === 'expired' ? 'bg-black/20 border-red-500/30' :
      bet.outcome === 'win' ? 'bg-black/20 border-green-500/30' :
      bet.outcome === 'loss' ? 'bg-black/20 border-red-500/30' :
      'bg-black/20 border-yellow-500/30'
    }`}>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <Link 
            to={`/betting/token/${bet.tokenId}`}
            className="text-xl font-display font-bold hover:underline transition-all duration-300"
          >
            {bet.tokenName}
            <span className="text-dream-foreground/50 text-sm ml-2">
              ({bet.tokenSymbol})
            </span>
          </Link>
          
          <div className={`text-xs px-3 py-1.5 rounded-full border ${statusClass}`}>
            {statusDisplay}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-dream-foreground/70">Prediction</div>
            <div className={`text-lg font-medium flex items-center ${
              bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'
            }`}>
              {bet.prediction === 'migrate' ? (
                <>
                  <ArrowUp className="w-5 h-5 mr-1" />
                  MIGRATE
                </>
              ) : (
                <>
                  <ArrowDown className="w-5 h-5 mr-1" />
                  DIE
                </>
              )}
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
              <button 
                onClick={() => copyToClipboard(bet.initiator, 'Wallet address')}
                className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors"
              >
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
        
        <div className="mt-3 pt-2 border-t border-dream-foreground/10">
          <div className="flex justify-between items-center text-xs text-dream-foreground/60">
            <div className="flex items-center">
              <span>Bet ID: </span>
              <span className="font-mono ml-1">{bet.id?.substring(0, 8) || 'Unknown'}</span>
              <button 
                onClick={() => copyToClipboard(bet.id || 'Unknown', 'Bet ID')}
                className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            
            {bet.transactionSignature && (
              <a 
                href={`https://solscan.io/tx/${bet.transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dream-accent2 hover:underline inline-flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Solscan
              </a>
            )}
          </div>
        </div>
        
        {bet.status === 'open' && !isExpired && connected && publicKeyString && publicKeyString !== bet.initiator && (
          <div className="mt-4">
            <Button 
              onClick={handleAcceptBet} 
              disabled={accepting} 
              className="w-full bg-dream-accent1 hover:bg-dream-accent1/80 text-black"
            >
              {accepting ? 'Accepting...' : 'Accept Bet'}
            </Button>
          </div>
        )}
        
        {(!connected || !publicKeyString) && bet.status === 'open' && !isExpired && (
          <div className="mt-4">
            <Button 
              disabled 
              className="w-full bg-dream-foreground/20 text-dream-foreground/50 cursor-not-allowed"
            >
              Connect wallet to accept
            </Button>
          </div>
        )}
        
        {(bet.status !== 'open' || isExpired) && (
          <div className="mt-4 flex justify-center">
            <div className={`text-sm px-3 py-1.5 rounded-md ${
              bet.status === 'matched' ? 'bg-purple-500/10 text-purple-400' :
              bet.outcome === 'win' ? 'bg-green-500/10 text-green-400' :
              bet.outcome === 'loss' ? 'bg-red-500/10 text-red-400' :
              isExpired ? 'bg-red-500/10 text-red-400' :
              'bg-yellow-500/10 text-yellow-400'
            }`}>
              {bet.status === 'matched' ? 'Bet is active and matched' :
               bet.outcome === 'win' ? 'Bet ended with a win' :
               bet.outcome === 'loss' ? 'Bet ended with a loss' :
               isExpired ? 'This bet has expired' :
               'This bet is no longer available'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetCard;
