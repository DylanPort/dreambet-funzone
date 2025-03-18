
import React, { useState, useEffect } from 'react';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { formatRawTrade } from '@/services/pumpPortalWebSocketService';
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, User, Users, Layers, DollarSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RawTokenCreationEvent, RawTokenTradeEvent } from '@/services/pumpPortalWebSocketService';
import { useIsMobile } from '@/hooks/use-mobile';

const RecentTokenTrades: React.FC = () => {
  const { recentRawTrades, rawTokens, isConnected } = usePumpPortal();
  const [displayLimit, setDisplayLimit] = useState(5);
  const isMobile = useIsMobile();

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatTokenCreation = (token: RawTokenCreationEvent) => {
    // Default supply value if not provided
    const tokenSupply = token.supply || token.token_supply ? 
      Number(token.supply || token.token_supply) : 
      1000000000;
      
    return {
      mint: token.mint,
      type: 'create',
      name: token.name || 'Unknown Token',
      symbol: token.symbol || '',
      marketCap: token.marketCapSol || 0,
      supply: tokenSupply,
      pool: token.pool || '',
      holders: token.holders || 0,
      volume24h: token.volume24h || 0,
      liquidity: token.liquidity || 0,
      timestamp: new Date().toISOString()
    };
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };
  
  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (isNaN(price)) return "0.000000";
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Show more trades
  const handleShowMore = () => {
    setDisplayLimit(prev => prev + 5);
  };

  if (!isConnected) {
    return (
      <div className="bg-dream-foreground/5 backdrop-blur-sm p-4 rounded-lg border border-dream-accent1/20">
        <div className="text-center py-4">
          <p className="text-dream-foreground/60">Connecting to Pump Portal...</p>
        </div>
      </div>
    );
  }

  if (!rawTokens || rawTokens.length === 0) {
    return null;
  }

  return (
    <div className="bg-dream-foreground/5 backdrop-blur-sm rounded-lg border border-dream-accent1/20 overflow-hidden">
      <div className="p-4 border-b border-dream-accent1/20 flex justify-between items-center">
        <h3 className="font-display font-semibold text-lg">
          New Tokens
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-xs flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            Live from PumpPortal
          </span>
        </div>
      </div>
      
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-dream-accent1/10">
          {rawTokens.slice(0, displayLimit).map((token, index) => {
            const formattedToken = formatTokenCreation(token);
            // Calculate price safely with defaults
            const tokenSupply = token.supply || token.token_supply ? 
              Number(token.supply || token.token_supply) : 
              1000000000;
            const tokenPrice = token.marketCapSol && tokenSupply ? token.marketCapSol / tokenSupply : 0;
            
            return (
              <div key={`token-${index}`} className="p-4 hover:bg-dream-accent1/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="text-dream-accent2">{formattedToken.name}</span>
                      <span className="text-xs text-dream-foreground/60">{formattedToken.symbol}</span>
                    </div>
                    <div className="text-xs text-dream-foreground/60 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(formattedToken.timestamp)}
                      </span>
                      {formattedToken.pool && (
                        <a 
                          href={`https://dexscreener.com/solana/${formattedToken.pool}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-dream-accent1 hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-dream-accent1/10 text-dream-accent1 text-xs px-2 py-1 rounded">
                    <span className="font-mono font-medium">${formatPrice(tokenPrice)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                    <span className="text-dream-foreground/60 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      MCAP
                    </span>
                    <span className="font-medium">${formatNumber(formattedToken.marketCap)}</span>
                  </div>
                  <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                    <span className="text-dream-foreground/60 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Supply
                    </span>
                    <span className="font-medium">{formatNumber(formattedToken.supply)}</span>
                  </div>
                  {formattedToken.holders > 0 && (
                    <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                      <span className="text-dream-foreground/60 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Holders
                      </span>
                      <span className="font-medium">{formattedToken.holders}</span>
                    </div>
                  )}
                  {formattedToken.liquidity > 0 && (
                    <div className="bg-dream-foreground/5 p-2 rounded flex items-center justify-between">
                      <span className="text-dream-foreground/60 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Liquidity
                      </span>
                      <span className="font-medium">${formatNumber(formattedToken.liquidity)}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs">
                  <div className="truncate text-dream-foreground/40">
                    {formattedToken.mint}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {rawTokens.length > displayLimit && (
        <div className="p-3 text-center border-t border-dream-accent1/20">
          <button 
            onClick={handleShowMore}
            className="text-dream-accent1 text-sm hover:underline"
          >
            Show more tokens
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTokenTrades;
