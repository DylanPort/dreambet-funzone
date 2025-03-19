
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Clock, Loader, Zap, Filter, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedAddresses, setCopiedAddresses] = useState<Record<string, boolean>>({});
  const { rawTokens } = usePumpPortal();
  const isMobile = useIsMobile();
  
  // Only show the first 5 tokens when not expanded
  const visibleTokens = isExpanded ? rawTokens : rawTokens.slice(0, 5);
  
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Set the copied state for this specific address
      setCopiedAddresses(prev => ({
        ...prev,
        [index]: true
      }));
      
      // Show toast notification
      toast({
        title: "Address copied",
        description: "Token contract address copied to clipboard",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedAddresses(prev => ({
          ...prev,
          [index]: false
        }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };
  
  if (!rawTokens || rawTokens.length === 0) {
    return (
      <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20">
        <p className="text-center text-dream-foreground/60">
          No recent tokens found
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6 rounded-xl backdrop-blur-sm bg-dream-background/30 border border-dream-accent1/20 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-xl text-dream-foreground">Recent Tokens</CardTitle>
      </div>

      <div className="space-y-4">
        {visibleTokens.map((token, index) => {
          // Use the current date as creation date since RawTokenCreationEvent doesn't have created_time
          const creationDate = new Date();
          
          // Format the time distance
          const timeAgo = formatDistanceToNow(creationDate, { addSuffix: true });
          
          return (
            <div key={`${token.mint}-${index}`} className="flex items-center justify-between gap-4 relative z-10 p-4 bg-dream-background/40 rounded-lg border border-dream-accent1/10">
              <div className="flex flex-col space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold text-dream-accent2">{token.symbol || 'Unknown'}</div>
                  <div className="text-sm text-dream-foreground/60">
                    {token.name || 'Unknown Token'}
                  </div>
                </div>
                
                <div className={`grid grid-cols-1 ${isMobile ? "gap-2" : "md:grid-cols-2 gap-3"} mt-2`}>
                  <div className="bg-dream-foreground/10 p-3 rounded-lg">
                    <div className="text-xs text-dream-foreground/60 mb-1">Token Contract</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium overflow-hidden text-ellipsis">
                        {formatAddress(token.mint)}
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={`https://solscan.io/token/${token.mint}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(token.mint, index)}
                                className="text-xs text-dream-accent2 hover:text-dream-accent1 transition-colors flex-shrink-0"
                              >
                                {copiedAddresses[index] ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Copy contract address</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dream-foreground/10 p-3 rounded-lg">
                    <div className="text-xs text-dream-foreground/60 mb-1">Created By</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium overflow-hidden text-ellipsis">
                        {formatAddress(token.traderPublicKey)}
                      </div>
                      <a 
                        href={`https://solscan.io/account/${token.traderPublicKey}`} 
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
                      {token.marketCapSol 
                        ? `${token.marketCapSol.toLocaleString()} SOL` 
                        : 'Unknown'}
                    </div>
                  </div>

                  <div className="bg-dream-foreground/10 p-3 rounded-lg">
                    <div className="text-xs text-dream-foreground/60 mb-1">Initial Supply</div>
                    <div className="text-sm font-medium">
                      {token.supply 
                        ? token.supply.toLocaleString() 
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
          );
        })}
      </div>
      
      {rawTokens.length > 5 && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-xs px-4 py-2 flex items-center gap-2 bg-dream-background/40 hover:bg-dream-accent1/10 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Show All ({rawTokens.length} Tokens)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default OpenBetsList;
