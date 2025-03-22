import React, { useState, useEffect, useRef } from 'react';
import { usePumpPortalWebSocket, formatRawTrade, getLatestPriceFromTrades } from '@/services/pumpPortalWebSocketService';
import { ArrowUp, ArrowDown, ExternalLink, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const RecentTokenTrades = () => {
  const [latestTokens, setLatestTokens] = useState<any[]>([]);
  const [visibleTokens, setVisibleTokens] = useState<any[]>([]);
  const pumpPortal = usePumpPortalWebSocket();
  const [filter, setFilter] = useState<'all' | 'up' | 'down'>('all');
  const isMobile = useIsMobile();
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollMadeRef = useRef(false);
  
  useEffect(() => {
    let allTokens: any[] = [];
    
    if (pumpPortal.recentTrades) {
      Object.keys(pumpPortal.recentTrades).forEach(tokenId => {
        const trades = pumpPortal.recentTrades[tokenId];
        trades.forEach((trade, index) => {
          const formattedTrade = formatRawTrade(trade, tokenId);
          if (formattedTrade) {
            // Only add the most recent trade for this token
            if (index === 0) {
              allTokens.push(formattedTrade);
            }
          }
        });
      });
    }
    
    if (pumpPortal.rawTokens) {
      pumpPortal.rawTokens.forEach(token => {
        if (!allTokens.some(t => t.tokenMint === token.mint)) {
          allTokens.push({
            tokenMint: token.mint,
            tokenName: token.name || 'Unknown Token',
            tokenSymbol: token.symbol || '',
            price: token.lastPrice || 0,
            time: new Date().toISOString(),
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: Math.random() * 5,
            change24h: (Math.random() * 40) - 20
          });
        }
      });
    }
    
    if (pumpPortal.recentTokens) {
      pumpPortal.recentTokens.forEach(token => {
        if (!allTokens.some(t => t.tokenMint === token.token_mint)) {
          const tokenMint = token.token_mint;
          
          if (pumpPortal.recentTrades[tokenMint] && pumpPortal.recentTrades[tokenMint].length > 0) {
            const latestPrice = getLatestPriceFromTrades(pumpPortal.recentTrades[tokenMint]);
            
            allTokens.push({
              tokenMint,
              tokenName: token.token_name || 'Unknown Token',
              tokenSymbol: token.token_symbol || '',
              price: latestPrice || 0,
              time: new Date().toISOString(),
              type: Math.random() > 0.5 ? 'buy' : 'sell',
              amount: Math.random() * 5,
              change24h: (Math.random() * 40) - 20
            });
          }
        }
      });
    }
    
    // Sort by time, most recent first
    allTokens.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    // Filter by type if needed
    if (filter !== 'all') {
      allTokens = allTokens.filter(token => {
        if (filter === 'up' && token.type === 'buy') return true;
        if (filter === 'down' && token.type === 'sell') return true;
        return false;
      });
    }
    
    // Keep only the most recent 30 tokens
    allTokens = allTokens.slice(0, 30);
    
    setLatestTokens(allTokens);
    
    // Initially show only 5 tokens or all if fewer than 5
    setVisibleTokens(allTokens.slice(0, 5));
  }, [pumpPortal.recentTrades, pumpPortal.rawTokens, pumpPortal.recentTokens, filter]);
  
  const loadMoreTokens = () => {
    setLoadingMore(true);
    
    // Add the next 5 tokens, or all remaining if fewer than 5
    const currentCount = visibleTokens.length;
    const nextBatch = latestTokens.slice(currentCount, currentCount + 5);
    
    // Simulate a loading delay
    setTimeout(() => {
      setVisibleTokens(prev => [...prev, ...nextBatch]);
      setLoadingMore(false);
    }, 500);
  };
  
  const handleFilterChange = (newFilter: 'all' | 'up' | 'down') => {
    setFilter(newFilter);
    // Reset visible tokens when filter changes
    setVisibleTokens([]);
    
    // Allow the effect to recompute tokens before scrolling
    setTimeout(() => {
      initialScrollMadeRef.current = false;
    }, 100);
  };
  
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  const formatTokenSymbol = (symbol: string) => {
    return symbol || 'Unknown';
  };
  
  const getPriceChangeClass = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };
  
  const formatTimeAgo = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };
  
  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden backdrop-blur-sm glass-panel border border-white/10">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold">Recent Token Activity</h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => handleFilterChange('all')} 
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-dream-accent2/20 text-dream-accent2 border border-dream-accent2/30' 
                  : 'bg-dream-foreground/5 text-dream-foreground/70 hover:bg-dream-foreground/10'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => handleFilterChange('up')} 
              className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${
                filter === 'up' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-dream-foreground/5 text-dream-foreground/70 hover:bg-dream-foreground/10'
              }`}
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              MOON
            </button>
            <button 
              onClick={() => handleFilterChange('down')} 
              className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${
                filter === 'down' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-dream-foreground/5 text-dream-foreground/70 hover:bg-dream-foreground/10'
              }`}
            >
              <ArrowDown className="w-3 h-3 mr-1" />
              DUST
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {visibleTokens.map((token, index) => (
            <div 
              key={`${token.tokenMint}-${index}`} 
              className="relative overflow-hidden group backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-300"
            >
              <Link to={`/token/${token.tokenMint}`} className="block p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-lg font-bold border border-white/10">
                      {formatTokenSymbol(token.tokenSymbol).charAt(0)}
                    </div>
                    
                    <div>
                      <div className="font-medium">{token.tokenName}</div>
                      <div className="text-sm text-dream-foreground/60">{formatTokenSymbol(token.tokenSymbol)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">${formatPrice(token.price)}</div>
                    <div className={`text-sm ${getPriceChangeClass(token.change24h)}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className={`flex items-center text-sm ${token.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {token.type === 'buy' ? (
                      <>
                        <ArrowUp className="w-3 h-3 mr-1" />
                        MOON
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-3 h-3 mr-1" />
                        DUST
                      </>
                    )}
                    <span className="ml-1 text-white/60">{token.amount.toFixed(2)} SOL</span>
                  </div>
                  
                  <div className="text-sm text-dream-foreground/60">
                    {formatTimeAgo(token.time)}
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-dream-accent1/0 via-dream-accent2/70 to-dream-accent3/0 w-0 group-hover:w-full transition-all duration-500"></div>
              </Link>
            </div>
          ))}
          
          {visibleTokens.length === 0 && (
            <div className="text-center py-6 text-dream-foreground/60">
              No tokens found for the selected filter.
            </div>
          )}
          
          {visibleTokens.length > 0 && visibleTokens.length < latestTokens.length && (
            <div className="mt-4 text-center">
              <button 
                onClick={loadMoreTokens} 
                disabled={loadingMore}
                className="px-4 py-2 bg-dream-accent2/20 text-dream-accent2 rounded-md hover:bg-dream-accent2/30 transition-colors"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-dream-accent2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentTokenTrades;
