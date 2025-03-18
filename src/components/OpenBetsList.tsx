
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink } from 'lucide-react';

const OpenBetsList = () => {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { rawTokens } = usePumpPortal();
  
  if (!rawTokens || rawTokens.length === 0) {
    return (
      <div className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">No recent tokens found</p>
      </div>
    );
  }
  
  const mostRecentToken = rawTokens[0];
  
  // Use the current date as fallback if timestamp is not available
  const creationDate = new Date();
  
  return (
    <div className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex flex-col space-y-2 w-full">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-dream-accent2">{mostRecentToken.symbol || 'Unknown'}</div>
            <div className="text-sm text-dream-foreground/60">
              {mostRecentToken.name || 'Unknown Token'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Token Contract</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {formatAddress(mostRecentToken.mint)}
                </div>
                <a 
                  href={`https://solscan.io/token/${mostRecentToken.mint}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Created By</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {formatAddress(mostRecentToken.traderPublicKey)}
                </div>
                <a 
                  href={`https://solscan.io/account/${mostRecentToken.traderPublicKey}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Created</div>
              <div className="text-sm font-medium">
                {creationDate.toLocaleString()} 
                <span className="text-xs text-dream-foreground/60 ml-2">
                  (just now)
                </span>
              </div>
            </div>
            
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Initial Market Cap</div>
              <div className="text-sm font-medium">
                {mostRecentToken.marketCapSol 
                  ? `${mostRecentToken.marketCapSol.toLocaleString()} SOL` 
                  : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenBetsList;
