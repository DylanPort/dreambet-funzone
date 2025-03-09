import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, AlertCircle, Zap, Sparkles, ExternalLink, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';
import TokenCard from './TokenCard';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <span>NEWLY CREATED</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter 3</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
              <Zap className="w-4 h-4" />
              <span>0.6</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {getTokensForDisplay().map((token, index) => (
          <Link 
            key={token.id || `token-${index}`} 
            to={token.isPlaceholder ? '#' : `/token/${token.id}`} 
            className={`token-card group relative overflow-hidden ${token.isPlaceholder ? 'opacity-60 pointer-events-none' : ''}`}
          >
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
                      <h3 className="font-display font-semibold text-lg">{token.name || 'Unknown'}</h3>
                      <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
                    </div>
                    <p className="text-dream-foreground/60 text-sm">{token.symbol || '???'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-1.5 bg-green-500"></span>
                    <span className="text-sm text-green-400">
                      {token.change24h || 0}%
                    </span>
                  </div>
                  <div className="text-xs text-dream-foreground/40 border border-dream-foreground/10 px-1.5 py-0.5 rounded">
                    +0%
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-1.5 bg-green-500"></span>
                    <span className="text-sm text-green-400">
                      {token.change24h || 0}%
                    </span>
                  </div>
                  <div className="text-xs text-dream-foreground/40 border border-dream-foreground/10 px-1.5 py-0.5 rounded">
                    +0%
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium flex items-center">
                    <span className="mr-1 text-dream-foreground/60">MC</span>
                    <span className="text-dream-foreground/90">${formatPrice(token.currentPrice || 0)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-dream-foreground/60">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>SOL {formatPrice((token.currentPrice || 0) / 100)}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
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
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MigratingTokenList;
