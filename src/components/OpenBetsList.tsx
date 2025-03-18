
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Clock, Loader, Zap, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';

// Define types for token data
interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  traderPublicKey: string;
  marketCapSol?: number;
  supply?: number;
  timestamp?: string;
}

const OpenBetsList = () => {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'latest' | 'highValue'>('latest');
  const { rawTokens, getTokensAboveMarketCap } = usePumpPortal();
  const isMobile = useIsMobile();
  
  // Get high value tokens (above 45 SOL market cap in the past hour)
  const highValueTokens = getTokensAboveMarketCap(45, 1);
  
  // Determine which tokens to display based on view mode
  const displayTokens = viewMode === 'latest' ? rawTokens : highValueTokens;
  
  if (!displayTokens || displayTokens.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">
          {viewMode === 'latest' 
            ? "No recent tokens found" 
            : "No tokens above 45 SOL initial market cap in the last hour"}
        </p>
      </Card>
    );
  }
  
  const mostRecentToken = displayTokens[0];
  
  // Use the current date as creation date since RawTokenCreationEvent doesn't have created_time
  const creationDate = new Date();
  
  // Format the time distance
  const timeAgo = formatDistanceToNow(creationDate, { addSuffix: true });
  
  return (
    <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-xl text-dream-foreground">Recent Tokens</CardTitle>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'latest' | 'highValue')} className="w-auto">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="latest" className="text-xs">Latest Created</TabsTrigger>
            <TabsTrigger value="highValue" className="text-xs">45+ SOL MCAP</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
      
      {viewMode === 'highValue' && (
        <div className="mt-4 text-xs text-dream-foreground/60 flex items-center">
          <Zap className="h-3.5 w-3.5 mr-1.5 text-dream-accent2" />
          <span>Showing {highValueTokens.length} tokens with 45+ SOL initial market cap from the last hour</span>
        </div>
      )}
    </Card>
  );
};

export default OpenBetsList;
