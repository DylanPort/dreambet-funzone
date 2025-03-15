import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Rocket, Sparkles, ExternalLink, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';
import TokenCard from './TokenCard';

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
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

  const formatMarketCap = (marketCap: number | undefined) => {
    if (marketCap === undefined || isNaN(marketCap)) return "$0";
    
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    }
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
    if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(2)}K`;
    }
    return `$${marketCap.toFixed(2)}`;
  };

  const getTokensForDisplay = () => {
    let displayTokens = [];
    if (loading) {
      for (let i = 0; i < 10; i++) {
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
        displayTokens = wsTokens.slice(0, 10).map(token => ({
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
      if (displayTokens.length < 10) {
        for (let i = displayTokens.length; i < 10; i++) {
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
      displayTokens = tokens.slice(0, 10);
      if (displayTokens.length < 10) {
        for (let i = displayTokens.length; i < 10; i++) {
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
    
    switch(sortBy) {
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

  const toggleSortMenu = () => {
    setSortMenuOpen(!sortMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (sortMenuOpen) {
        setSortMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen]);

  const handleBetClick = (tokenId: string, prediction: 'moon' | 'dust') => {
    if (!tokenId || tokenId.startsWith('placeholder-') || tokenId.startsWith('empty-')) {
      toast({
        title: "Cannot place bet",
        description: "This token is not available for betting",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: `${prediction === 'moon' ? 'MOON' : 'DUST'} bet selected`,
      description: `Redirecting to place a ${prediction} bet on this token`,
      variant: "default"
    });
    
    window.location.href = `/token/${tokenId}/bet?prediction=${prediction}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <span>NEWLY CREATED</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs gap-1.5 h-8"
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort By: {sortBy.replace('-', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
              {sortMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-dream-background/95 backdrop-blur-md border border-dream-accent1/20 rounded-md shadow-lg z-20 overflow-hidden">
                  <div className="py-1">
                    {[
                      {value: 'newest', label: 'Newest First'},
                      {value: 'oldest', label: 'Oldest First'},
                      {value: 'price-high', label: 'Price: High to Low'},
                      {value: 'price-low', label: 'Price: Low to High'},
                      {value: 'change-high', label: 'Change: High to Low'},
                      {value: 'change-low', label: 'Change: Low to High'},
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={`block w-full text-left px-4 py-2 text-xs hover:bg-dream-accent1/10 transition-colors ${sortBy === option.value ? 'bg-dream-accent1/20 text-dream-accent1' : 'text-dream-foreground/80'}`}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortMenuOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
              <Sparkles className="w-4 h-4" />
              <span>{pumpPortal.connected ? 'Connected' : 'Connecting...'}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
        <table className="min-w-full">
          <thead className="bg-dream-background/50 backdrop-blur-sm">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Market Cap</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70 bg-green-500/10">MOON</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70 bg-red-500/10">DUST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dream-accent1/10">
            {displayTokens.map((token, index) => (
              <tr 
                key={token.id || `token-${index}`} 
                className={`hover:bg-dream-accent1/5 transition-colors ${token.isPlaceholder ? 'opacity-60' : ''}`}
              >
                <td className="py-3 px-4">
                  <Link to={token.isPlaceholder ? '#' : `/token/${token.id}`} className="flex items-center">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center">
                      <img 
                        src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" 
                        alt="Token"
                        className="w-full h-full object-contain"
                      />
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
                <td className="py-3 px-4 text-right font-medium">
                  {formatMarketCap(token.marketCap || (token.currentPrice && token.supply ? token.currentPrice * token.supply : 0))}
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-500 h-8 px-3 w-full max-w-24"
                    onClick={() => handleBetClick(token.id, 'moon')}
                    disabled={token.isPlaceholder}
                  >
                    <Rocket className="h-3.5 w-3.5 mr-1" />
                    <span>MOON</span>
                  </Button>
                </td>
                <td className="py-3 px-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-500 h-8 px-3 w-full max-w-24"
                    onClick={() => handleBetClick(token.id, 'dust')}
                    disabled={token.isPlaceholder}
                  >
                    <ArrowDown className="h-3.5 w-3.5 mr-1" />
                    <span>DUST</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MigratingTokenList;
