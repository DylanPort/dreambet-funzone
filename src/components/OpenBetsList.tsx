import React, { useState, useEffect, useRef } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatDistanceToNow } from 'date-fns';
import { formatAddress } from '@/utils/betUtils';
import { ExternalLink, Clock, Loader, Zap, Filter, ChevronDown, ChevronUp, Copy, CheckCheck, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from './ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [sortBy, setSortBy] = useState('newest');
  const { rawTokens } = usePumpPortal();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const sortTokens = (tokensToSort: TokenData[]) => {
    const tokens = [...tokensToSort];
    
    switch(sortBy) {
      case 'newest':
        return tokens.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return tokens.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateA - dateB;
        });
      case 'market-cap-high':
        return tokens.sort((a, b) => (b.marketCapSol || 0) - (a.marketCapSol || 0));
      case 'market-cap-low':
        return tokens.sort((a, b) => (a.marketCapSol || 0) - (b.marketCapSol || 0));
      case 'supply-high':
        return tokens.sort((a, b) => (b.supply || 0) - (a.supply || 0));
      case 'supply-low':
        return tokens.sort((a, b) => (a.supply || 0) - (b.supply || 0));
      default:
        return tokens;
    }
  };
  
  const visibleTokens = isExpanded ? sortTokens(rawTokens) : sortTokens(rawTokens).slice(0, 5);
  
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      
      setCopiedAddresses(prev => ({
        ...prev,
        [index]: true
      }));
      
      toast({
        title: "Address copied",
        description: "Token contract address copied to clipboard",
      });
      
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
  
  const navigateToTokenDetail = (tokenMint: string) => {
    navigate(`/token/${tokenMint}`);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1.5 h-9"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sort: {sortBy.replace('-', ' ')}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md">
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'newest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('newest')}
            >
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'oldest' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('oldest')}
            >
              Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'market-cap-high' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('market-cap-high')}
            >
              Market Cap: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'market-cap-low' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('market-cap-low')}
            >
              Market Cap: Low to High
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'supply-high' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('supply-high')}
            >
              Supply: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem 
              className={`text-xs px-4 py-2 cursor-pointer ${sortBy === 'supply-low' ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
              onClick={() => setSortBy('supply-low')}
            >
              Supply: Low to High
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative">
        {isMobile && (
          <>
            <button 
              onClick={scrollLeft} 
              className="scroll-button scroll-button-left"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={scrollRight} 
              className="scroll-button scroll-button-right"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        
        <ScrollArea className="w-full pb-4">
          <div 
            ref={scrollRef} 
            className={`flex ${isMobile ? 'space-x-4 flex-nowrap' : 'flex-col space-y-4'} pb-2 px-1`}
          >
            {visibleTokens.map((token, index) => {
              const creationDate = token.timestamp ? new Date(token.timestamp) : new Date();
              
              const timeAgo = formatDistanceToNow(creationDate, { addSuffix: true });
              
              return (
                <div 
                  key={`${token.mint}-${index}`} 
                  className={`${isMobile ? 'flex-shrink-0 w-[300px]' : 'w-full'} flex items-center justify-between gap-4 relative z-10 p-4 bg-dream-background/40 rounded-lg border border-dream-accent1/10`}
                >
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
                    
                    <div className="flex justify-around py-4 mt-3">
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => navigateToTokenDetail(token.mint)}
                      >
                        <img 
                          src="/lovable-uploads/24c9c7f3-aec1-4095-b55f-b6198e22db19.png" 
                          alt="MOON" 
                          className="w-16 h-16 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(209,103,243,0.7)]"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-cyan-400/20 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">MOON</span>
                      </div>
                      
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => navigateToTokenDetail(token.mint)}
                      >
                        <img 
                          src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" 
                          alt="DUST" 
                          className="w-16 h-16 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(0,179,255,0.7)]"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-cyan-400/20 to-magenta-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">DUST</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
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
