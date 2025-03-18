
import React, { useState } from 'react';
import { Bet } from '@/types/bet';
import { Link } from 'react-router-dom';
import { Clock, ExternalLink, Copy, CheckCheck, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatTimeRemaining, formatAddress } from '@/utils/betUtils';

interface BetCountStats {
  moon: number;
  dust: number;
  moonPercentage: number;
  dustPercentage: number;
  moonWins: number;
  dustWins: number;
  moonLosses: number;
  dustLosses: number;
  averageMoonMarketCap: number;
  averageDustMarketCap: number;
  totalVolume: number;
}

interface BetStatsCardProps {
  bet: Bet;
  betStats: BetCountStats;
  isMobile?: boolean;
}

const BetStatsCard: React.FC<BetStatsCardProps> = ({ bet, betStats, isMobile = false }) => {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      toast({
        title: "Address copied",
        description: "Token contract address copied to clipboard",
      });
      
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Couldn't copy address to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Link to={`/token/${bet.tokenId}`} className="block w-full">
      <div className="glass-panel p-4 hover:border-white/20 transition-all duration-300 relative overflow-hidden group h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 via-[#2a203e]/10 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:via-[#2a203e]/20 group-hover:to-dream-accent3/10 transition-all duration-500 animate-pulse-slow">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between gap-4'} relative z-10`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
              <span className="font-display font-bold text-lg">{bet.tokenSymbol.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-lg">{bet.tokenName}</h3>
                <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
              </div>
              <p className="text-dream-foreground/60 text-sm">{bet.tokenSymbol}</p>
              
              <div className="flex items-center mt-1 text-xs">
                <div className="bg-black/30 rounded-md py-1 px-2 flex items-center">
                  <span className="mr-1 text-dream-foreground/50">Contract:</span>
                  <span className="text-dream-foreground/70">{formatAddress(bet.tokenMint)}</span>
                  <button 
                    onClick={(e) => copyToClipboard(bet.tokenMint, e)}
                    className="ml-2 p-1 bg-dream-background/40 rounded hover:bg-dream-background/60 transition-colors"
                  >
                    {copiedAddress === bet.tokenMint ? 
                      <CheckCheck className="h-3 w-3 text-green-400" /> : 
                      <Copy className="h-3 w-3 text-dream-foreground/60" />
                    }
                  </button>
                  <a 
                    href={`https://solscan.io/token/${bet.tokenMint}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-1 p-1 bg-dream-background/40 rounded hover:bg-dream-background/60 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-dream-foreground/60" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-dream-foreground/60">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatTimeRemaining(bet.expiresAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BetStatsCard;
