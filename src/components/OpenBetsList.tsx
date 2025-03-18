
import React, { useState } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Clock, Loader } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader } from './ui/card';

// Define types for token data
interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  traderPublicKey: string;
  marketCapSol?: number;
  createdTime?: string;
  supply?: number;
}

const OpenBetsList = () => {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { rawTokens } = usePumpPortal();
  const isMobile = useIsMobile();
  
  if (!rawTokens || rawTokens.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">No recent tokens found</p>
      </Card>
    );
  }
  
  const mostRecentToken = rawTokens[0];
  
  // Use the token's creation time or current date as fallback
  const creationDate = mostRecentToken.created_time 
    ? new Date(mostRecentToken.created_time)
    : new Date();
  
  // Format the time distance
  const timeAgo = formatDistanceToNow(creationDate, { addSuffix: true });
  
  return (
    <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex flex-col space-y-2 w-full">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-dream-accent2">{mostRecentToken.symbol || 'Unknown'}</div>
            <div className="text-sm text-dream-foreground/60">
              {mostRecentToken.name || 'Unknown Token'}
            </div>
          </div>
          
          <div className={`grid grid-cols-1 ${isMobile ? "gap-2" : "md:grid-cols-2 gap-3"} mt-2`}>
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Token Contract</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium overflow-hidden text-ellipsis">
                  {formatAddress(mostRecentToken.mint)}
                </div>
                <a 
                  href={`https://solscan.io/token/${mostRecentToken.mint}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0 ml-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Created By</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium overflow-hidden text-ellipsis">
                  {formatAddress(mostRecentToken.traderPublicKey)}
                </div>
                <a 
                  href={`https://solscan.io/account/${mostRecentToken.traderPublicKey}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0 ml-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            
            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Created</div>
              <div className="text-sm font-medium flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-dream-foreground/60" />
                <span>{creationDate.toLocaleString()}</span>
                <span className="text-xs text-dream-foreground/60 ml-2">
                  ({timeAgo})
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

            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Initial Supply</div>
              <div className="text-sm font-medium">
                {mostRecentToken.supply 
                  ? mostRecentToken.supply.toLocaleString() 
                  : 'Unknown'}
              </div>
            </div>

            <div className="bg-dream-foreground/10 p-3 rounded-lg">
              <div className="text-xs text-dream-foreground/60 mb-1">Token Age</div>
              <div className="text-sm font-medium">
                {timeAgo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OpenBetsList;
