import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, AlertCircle, Zap, Sparkles, ExternalLink, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';
import TokenCard from './TokenCard';
const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const {
    toast
  } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  useEffect(() => {
    if (pumpPortal.connected) {
      pumpPortal.subscribeToNewTokens();
    }
  }, [pumpPortal.connected]);
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const data = await fetchMigratingTokens();
        setTokens(data);
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast({
          title: "Failed to load tokens",
          description: "There was an error loading token data from Pump.fun.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadTokens();
    const interval = setInterval(loadTokens, 120000);
    return () => clearInterval(interval);
  }, [toast]);
  const processRawWebSocketData = (data: any) => {
    if (!data) return null;
    if (data.txType === 'create' && data.mint) {
      return {
        id: data.mint,
        name: data.name || 'Unknown Token',
        symbol: data.symbol || '',
        logo: '🪙',
        currentPrice: data.marketCapSol ? parseFloat((data.marketCapSol / data.supply || 0).toFixed(6)) : 0,
        change24h: 0,
        migrationTime: new Date().getTime()
      };
    }
    return null;
  };
  useEffect(() => {
    if (pumpPortal.recentTokens.length > 0) {
      const newTokens = pumpPortal.recentTokens.map(formatWebSocketTokenData).filter(token => token);
      setTokens(currentTokens => {
        const existingIds = new Set(currentTokens.map(t => t.id));
        const newUniqueTokens = newTokens.filter(t => !existingIds.has(t.id));
        if (newUniqueTokens.length > 0) {
          toast({
            title: "New tokens created!",
            description: `${newUniqueTokens.length} new tokens from Pump.fun`,
            variant: "default"
          });
        }
        return [...newUniqueTokens, ...currentTokens];
      });
      if (loading) {
        setLoading(false);
      }
    }
  }, [pumpPortal.recentTokens, loading, toast]);
  useEffect(() => {
    const handleRawWebSocketMessages = () => {
      const logs = console.__logs || [];
      const rawMessages = logs.filter((log: any) => log.message && typeof log.message === 'string' && log.message.includes('Unknown message type:')).slice(-10);
      if (rawMessages.length === 0) return;
      const processedTokens = rawMessages.map((log: any) => {
        try {
          const match = log.message.match(/Unknown message type: (.+)/);
          if (!match || !match[1]) return null;
          const data = JSON.parse(match[1]);
          return processRawWebSocketData(data);
        } catch (e) {
          return null;
        }
      }).filter(token => token);
      if (processedTokens.length > 0) {
        setTokens(currentTokens => {
          const existingIds = new Set(currentTokens.map(t => t.id));
          const newUniqueTokens = processedTokens.filter(t => !existingIds.has(t.id));
          if (newUniqueTokens.length > 0) {
            toast({
              title: "New tokens detected!",
              description: `${newUniqueTokens.length} new tokens from Pump.fun`,
              variant: "default"
            });
          }
          return [...newUniqueTokens, ...currentTokens];
        });
        if (loading) {
          setLoading(false);
        }
      }
    };
    handleRawWebSocketMessages();
    const interval = setInterval(handleRawWebSocketMessages, 5000);
    return () => clearInterval(interval);
  }, [loading, toast]);
  const formatTimeSince = (timestamp: number) => {
    const now = new Date().getTime();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m ago`;
    }
  };
  const getTokenIcon = (symbol: string) => {
    if (!symbol) return '🪙';
    return symbol.charAt(0);
  };
  const getRawTokensForDisplay = () => {
    const logs = console.__logs || [];
    const rawMessages = logs.filter((log: any) => log.message && typeof log.message === 'string' && log.message.includes('Unknown message type:')).slice(-10);
    if (rawMessages.length === 0) return [];
    return rawMessages.map((log: any) => {
      try {
        const match = log.message.match(/Unknown message type: (.+)/);
        if (!match || !match[1]) return null;
        const data = JSON.parse(match[1]);
        if (!data.txType || data.txType !== 'create' || !data.mint) return null;
        return {
          token_mint: data.mint,
          token_name: data.name || 'Unknown Token',
          token_symbol: data.symbol || '',
          created_time: new Date().toISOString()
        };
      } catch (e) {
        return null;
      }
    }).filter(token => token);
  };
  const getTokensForEmptyState = () => {
    const standardTokens = pumpPortal.recentTokens || [];
    const rawTokens = getRawTokensForDisplay();
    const allTokens = [...standardTokens, ...rawTokens];
    const uniqueTokens = Array.from(new Map(allTokens.map(token => [token.token_mint, token])).values());
    return uniqueTokens.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
  };
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "0.000000";
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  };
  const getTokensForDisplay = () => {
    let displayTokens = [];
    if (loading) {
      for (let i = 0; i < 20; i++) {
        displayTokens.push({
          id: `placeholder-${i}`,
          name: 'Loading...',
          symbol: '...',
          logo: '🪙',
          currentPrice: 0,
          change24h: 0,
          migrationTime: new Date().getTime() - i * 60000,
          isPlaceholder: true
        });
      }
    } else if (tokens.length === 0) {
      const wsTokens = getTokensForEmptyState();
      if (wsTokens.length > 0) {
        displayTokens = wsTokens.slice(0, 20).map(token => ({
          id: token.token_mint,
          name: token.token_name || 'Unknown Token',
          symbol: token.token_symbol || '???',
          logo: '🪙',
          currentPrice: 0,
          change24h: 0,
          migrationTime: new Date(token.created_time).getTime(),
          fromWebSocket: true
        }));
      }
      if (displayTokens.length < 20) {
        for (let i = displayTokens.length; i < 20; i++) {
          displayTokens.push({
            id: `empty-${i}`,
            name: 'New Token Coming Soon',
            symbol: '???',
            logo: '🪙',
            currentPrice: 0,
            change24h: 0,
            migrationTime: new Date().getTime() - i * 60000,
            isPlaceholder: true
          });
        }
      }
    } else {
      displayTokens = tokens.slice(0, 20);
      if (displayTokens.length < 20) {
        for (let i = displayTokens.length; i < 20; i++) {
          displayTokens.push({
            id: `empty-${i}`,
            name: 'New Token Coming Soon',
            symbol: '???',
            logo: '🪙',
            currentPrice: 0,
            change24h: 0,
            migrationTime: new Date().getTime() - i * 60000,
            isPlaceholder: true
          });
        }
      }
    }
    return displayTokens;
  };
  const sortTokens = (tokensToSort: any[]) => {
    const tokens = [...tokensToSort];
    switch (sortBy) {
      case 'newest':
        return tokens.sort((a, b) => (b.migrationTime || 0) - (a.migrationTime || 0));
      case 'oldest':
        return tokens.sort((a, b) => (a.migrationTime || 0) - (b.migrationTime || 0));
      case 'price-high':
        return tokens.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
      case 'price-low':
        return tokens.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
      case 'change-high':
        return tokens.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
      case 'change-low':
        return tokens.sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
      default:
        return tokens;
    }
  };
  const displayTokens = sortTokens(getTokensForDisplay());
  return <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <span>NEWLY CREATED</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="text-xs gap-1.5 h-8">
              {viewMode === 'grid' ? <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>List View</span>
                </> : <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grid View</span>
                </>}
            </Button>
            
            <div className="relative">
              
              <div className="absolute right-0 top-full mt-1 w-40 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md shadow-lg z-20 overflow-hidden">
                <div className="py-1">
                  {[{
                  value: 'newest',
                  label: 'Newest First'
                }, {
                  value: 'oldest',
                  label: 'Oldest First'
                }, {
                  value: 'price-high',
                  label: 'Price: High to Low'
                }, {
                  value: 'price-low',
                  label: 'Price: Low to High'
                }, {
                  value: 'change-high',
                  label: 'Change: High to Low'
                }, {
                  value: 'change-low',
                  label: 'Change: Low to High'
                }].map(option => <button key={option.value} className={`block w-full text-left px-4 py-2 text-xs hover:bg-dream-accent1/10 transition-colors ${sortBy === option.value ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`} onClick={() => setSortBy(option.value)}>
                      {option.label}
                    </button>)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
              <Zap className="w-4 h-4" />
              <span>{pumpPortal.connected ? 'Connected' : 'Connecting...'}</span>
            </span>
          </div>
        </div>
      </div>
      
      {viewMode === 'grid' ? <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayTokens.map((token, index) => <Link key={token.id || `token-${index}`} to={token.isPlaceholder ? '#' : `/token/${token.id}`} className={`token-card group relative overflow-hidden ${token.isPlaceholder ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <div className={`glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300 h-full ${token.isPlaceholder ? 'animate-pulse' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                      <span className="font-display font-bold text-lg">{token.symbol?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-display font-semibold text-lg truncate max-w-[150px]">{token.name || 'Unknown'}</h3>
                        <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40 flex-shrink-0" />
                      </div>
                      <p className="text-dream-foreground/60 text-sm">{token.symbol || '???'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 h-6 px-2 rounded-md bg-dream-background/40 text-xs">
                      <Clock className="w-3 h-3 text-dream-accent2" />
                      <span className="text-dream-foreground/60">{token.migrationTime ? formatTimeSince(token.migrationTime) : 'New'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dream-background/30 p-3 rounded-md mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-dream-foreground/60">Price</span>
                    <span className="font-medium">${formatPrice(token.currentPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dream-foreground/60">Change</span>
                    <span className={`text-sm font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h || 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-dream-foreground/60 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span>SOL {formatPrice((token.currentPrice || 0) / 100)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Supply {token.supply || 'Unknown'}</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button className="btn-moon py-1.5 flex items-center justify-center gap-1.5" disabled={token.isPlaceholder}>
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Moon</span>
                  </button>
                  <button className="btn-die py-1.5 flex items-center justify-center gap-1.5" disabled={token.isPlaceholder}>
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Die</span>
                  </button>
                </div>
              </div>
            </Link>)}
        </div> : <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
          <table className="min-w-full">
            <thead className="bg-dream-background/50 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Price</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Change</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Time</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dream-accent1/10">
              {displayTokens.map((token, index) => <tr key={token.id || `token-${index}`} className={`hover:bg-dream-accent1/5 transition-colors ${token.isPlaceholder ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4">
                    <Link to={token.isPlaceholder ? '#' : `/token/${token.id}`} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 mr-3">
                        <span className="font-display font-bold text-sm">{token.symbol?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <div className="font-medium text-dream-foreground flex items-center gap-1">
                          <span className="truncate max-w-[150px]">{token.name || 'Unknown'}</span>
                          <ExternalLink className="w-3 h-3 text-dream-foreground/40" />
                        </div>
                        <div className="text-xs text-dream-foreground/60">{token.symbol || '???'}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">${formatPrice(token.currentPrice || 0)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h || 0}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-dream-foreground/70">
                    {token.migrationTime ? formatTimeSince(token.migrationTime) : 'New'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <button className="btn-moon py-1 px-2 text-xs flex items-center gap-1" disabled={token.isPlaceholder}>
                        <ArrowUp className="w-3 h-3" />
                        <span>Moon</span>
                      </button>
                      <button className="btn-die py-1 px-2 text-xs flex items-center gap-1" disabled={token.isPlaceholder}>
                        <ArrowDown className="w-3 h-3" />
                        <span>Die</span>
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};
export default MigratingTokenList;