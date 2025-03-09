import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock, AlertCircle, Zap, Sparkles, ExternalLink, Rocket, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
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
        migrationTime: new Date().getTime(),
      };
    }
    
    return null;
  };
  
  useEffect(() => {
    if (pumpPortal.recentTokens.length > 0) {
      const newTokens = pumpPortal.recentTokens
        .map(formatWebSocketTokenData)
        .filter(token => token);
      
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
      const rawMessages = logs
        .filter((log: any) => 
          log.message && 
          typeof log.message === 'string' && 
          log.message.includes('Unknown message type:')
        )
        .slice(-10);
        
      if (rawMessages.length === 0) return;
      
      const processedTokens = rawMessages
        .map((log: any) => {
          try {
            const match = log.message.match(/Unknown message type: (.+)/);
            if (!match || !match[1]) return null;
            
            const data = JSON.parse(match[1]);
            return processRawWebSocketData(data);
          } catch (e) {
            return null;
          }
        })
        .filter(token => token);
      
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
    const rawMessages = logs
      .filter((log: any) => 
        log.message && 
        typeof log.message === 'string' && 
        log.message.includes('Unknown message type:')
      )
      .slice(-10);
    
    if (rawMessages.length === 0) return [];
    
    return rawMessages
      .map((log: any) => {
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
      })
      .filter(token => token);
  };

  const getTokensForEmptyState = () => {
    const standardTokens = pumpPortal.recentTokens || [];
    const rawTokens = getRawTokensForDisplay();
    
    const allTokens = [...standardTokens, ...rawTokens];
    const uniqueTokens = Array.from(
      new Map(allTokens.map(token => [token.token_mint, token])).values()
    );
    
    return uniqueTokens.sort((a, b) => 
      new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return "0.000000";
    
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-dream-foreground relative">
          <span className="relative z-10">Migrating Tokens</span>
          <span className="absolute -left-2 bottom-0 w-[120%] h-2 bg-gradient-to-r from-dream-accent1 to-transparent opacity-30"></span>
        </h2>
        
        <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
          <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
            <Zap className="w-4 h-4" />
            {pumpPortal.connected ? 'Live Feed' : 'Connecting...'}
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-dream-accent2/30 border-t-dream-accent2 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-dream-accent1/50 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="glass-panel p-6">
          {(pumpPortal.connected && pumpPortal.recentTokens.length > 0) || getRawTokensForDisplay().length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-dream-accent2" />
                  <h3 className="text-xl font-semibold">New Pump.fun Tokens</h3>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open('https://pump.fun', '_blank')}
                >
                  Pump.fun <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
              
              <div className="grid gap-3">
                {getTokensForEmptyState().slice(0, 5).map((token) => (
                  <div key={token.token_mint} className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-lg border border-white/10">
                        {token.token_symbol ? token.token_symbol.charAt(0) : '🪙'}
                      </div>
                      <div className="ml-2">
                        <h4 className="font-semibold">{token.token_name || 'Unknown Token'}</h4>
                        <p className="text-xs text-dream-foreground/70">{token.token_symbol || '???'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-dream-foreground/70 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {formatTimeSince(new Date(token.created_time).getTime())}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs mt-1 h-6 px-2 text-dream-accent2"
                      >
                        Place Bet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {getTokensForEmptyState().length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm">
                    View All Tokens
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-dream-accent2/70 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-center">No Tokens Found</h3>
              <p className="text-dream-foreground/70 text-center">
                No migrating tokens from Pump.fun are currently available.
                Check back soon for updates.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map(token => (
            <Link
              key={token.id}
              to={`/token/${token.id}`}
              className="token-card group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
              
              <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
              <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
              
              <div className="glass-panel p-5 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300 h-full">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {token.imageUrl ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/10 to-dream-accent3/10 rounded-full animate-pulse"></div>
                        <img 
                          src={token.imageUrl} 
                          alt={token.name} 
                          className="w-10 h-10 rounded-full object-cover relative z-10"
                          onError={(e) => {
                            const imgElement = e.target as HTMLImageElement;
                            imgElement.style.display = 'none';
                            const nextElement = imgElement.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      </div>
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 ${token.imageUrl ? 'hidden' : ''}`}
                    >
                      <span className="font-display font-bold">{getTokenIcon(token.symbol)}</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-display font-semibold group-hover:text-dream-accent2 transition-colors duration-300">{token.name || 'Unknown Token'}</h3>
                      <p className="text-sm text-dream-foreground/70">{token.symbol || '???'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 mr-1 text-dream-foreground/70" />
                    <span className="text-dream-foreground/70">
                      {formatTimeSince(token.migrationTime)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center mt-4 p-3 bg-gradient-to-r from-dream-background/40 to-dream-background/20 backdrop-blur-sm rounded-md border border-white/5 group-hover:border-white/10 transition-all">
                  <div className="flex-1">
                    <div className="text-lg font-bold group-hover:text-dream-accent2 transition-colors">${formatPrice(token.currentPrice)}</div>
                    <div className={`text-sm flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(token.change24h || 0).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center justify-end">
                    <div className="hover:scale-110 transition-transform">
                      <Rocket className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="hover:scale-110 transition-transform">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <button className="bet-button w-full py-2 text-sm font-semibold">
                    <span className="z-10 relative">Place Prediction</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
