import React, { useState, useEffect } from 'react';
import { fetchMigratingTokens } from '@/api/mockData';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, AlertCircle, Zap, Filter, ArrowUpDown, ChevronDown, ExternalLink, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

const MigratingTokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [tokenBetStats, setTokenBetStats] = useState<Record<string, { 
    upBets: number, 
    downBets: number, 
    totalVolume: number 
  }>>({});
  const { toast } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  const isMobile = useIsMobile();

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

  useEffect(() => {
    const fetchTokenBetStatistics = async () => {
      try {
        const { data, error } = await supabase
          .from('bets')
          .select('token_mint, prediction_bettor1, sol_amount');
        
        if (error) {
          console.error('Error fetching bet statistics:', error);
          return;
        }
        
        const stats: Record<string, { upBets: number, downBets: number, totalVolume: number }> = {};
        
        data?.forEach(bet => {
          if (!stats[bet.token_mint]) {
            stats[bet.token_mint] = { upBets: 0, downBets: 0, totalVolume: 0 };
          }
          
          if (bet.prediction_bettor1 === 'up') {
            stats[bet.token_mint].upBets += 1;
          } else if (bet.prediction_bettor1 === 'down') {
            stats[bet.token_mint].downBets += 1;
          }
          
          stats[bet.token_mint].totalVolume += Number(bet.sol_amount) || 0;
        });
        
        setTokenBetStats(stats);
      } catch (err) {
        console.error('Error processing bet statistics:', err);
      }
    };
    
    fetchTokenBetStatistics();
    
    const interval = setInterval(fetchTokenBetStatistics, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const renderMobileTokenCards = () => {
    return (
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:ml-0">
          {displayTokens.map((token, index) => (
            <CarouselItem key={token.id || `token-${index}`} className="pl-2 md:pl-0 basis-[85%] sm:basis-[60%] md:basis-full">
              <div 
                className={`glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 h-full ${token.isPlaceholder ? 'opacity-60' : ''} hover:bg-dream-accent1/5 transition-colors`}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 mr-3 flex items-center justify-center">
                    <img 
                      src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" 
                      alt="Token"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={token.isPlaceholder ? '#' : `/token/${token.id}`} className="font-medium text-dream-foreground flex items-center gap-1">
                      <span className="truncate max-w-[150px]">{token.name || 'Unknown'}</span>
                      <ExternalLink className="w-3 h-3 text-dream-foreground/40 flex-shrink-0" />
                    </Link>
                    <div className="text-xs text-dream-foreground/60">{token.symbol || '???'}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm text-dream-foreground/60">Price</div>
                    <div className="font-medium">${formatPrice(token.currentPrice || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-dream-foreground/60">Change</div>
                    <span className={`${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h || 0}%
                    </span>
                  </div>
                </div>
                
                {!token.isPlaceholder && tokenBetStats[token.id] && (
                  <div className="mb-4 text-xs text-dream-foreground/60 space-y-1.5">
                    <div className="flex justify-between items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-dream-accent2/80" />
                        <span>Bets</span>
                      </div>
                      <span>{tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets || 0}</span>
                    </div>
                    
                    {tokenBetStats[token.id].totalVolume > 0 && (
                      <div className="flex justify-between items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-dream-accent1/80" />
                          <span>Volume</span> 
                        </div>
                        <span>{tokenBetStats[token.id].totalVolume.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {(tokenBetStats[token.id].upBets > 0 || tokenBetStats[token.id].downBets > 0) && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-green-400">▲ {Math.round((tokenBetStats[token.id].upBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100)}%</span>
                          <span className="text-red-400">▼ {Math.round((tokenBetStats[token.id].downBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-dream-foreground/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                            style={{ 
                              width: `${tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets > 0 
                                ? (tokenBetStats[token.id].upBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-dream-foreground/60 mb-3">
                  Created {token.migrationTime ? formatTimeSince(token.migrationTime) : 'New'}
                </div>
                
                <div className="flex justify-center gap-2">
                  <button className="btn-moon py-1.5 px-3 text-sm flex items-center gap-1 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-lg hover:from-green-500/30 hover:to-green-500/20 transition-all" disabled={token.isPlaceholder}>
                    <ArrowUp className="w-3 h-3" />
                    <span className="text-green-400 font-bold">MOON</span>
                  </button>
                  <button className="btn-die py-1.5 px-3 text-sm flex items-center gap-1 bg-gradient-to-r from-red-500/20 to-red-500/10 rounded-lg hover:from-red-500/30 hover:to-red-500/20 transition-all" disabled={token.isPlaceholder}>
                    <ArrowDown className="w-3 h-3" />
                    <span className="text-red-400 font-bold">DIE</span>
                  </button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex items-center gap-2">
            <CarouselPrevious className="relative inset-auto h-8 w-8" />
            <div className="text-xs text-dream-foreground/60">Swipe for more</div>
            <CarouselNext className="relative inset-auto h-8 w-8" />
          </div>
        </div>
      </Carousel>
    );
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
                onClick={toggleSortMenu}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sort By: {sortBy.replace('-', ' ')}</span>
                <span className="sm:hidden">Sort</span>
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
          
          <div className="hidden sm:flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
            <span className="font-medium">Filter</span>
          </div>
          
          <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
            <span className={`flex items-center gap-1 ${pumpPortal.connected ? 'text-green-400' : 'text-yellow-400'}`}>
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{pumpPortal.connected ? 'Connected' : 'Connecting...'}</span>
            </span>
          </div>
        </div>
      </div>
      
      {isMobile ? (
        renderMobileTokenCards()
      ) : (
        <div className="rounded-lg overflow-hidden border border-dream-accent1/20">
          <Table>
            <TableHeader className="bg-dream-background/50 backdrop-blur-sm">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-semibold text-dream-foreground/70">Token</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Price</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Change</TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-dream-foreground/70">Time</TableHead>
                <TableHead className="py-3 px-4 text-center text-xs font-semibold text-dream-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-dream-accent1/10">
              {displayTokens.map((token, index) => (
                <TableRow 
                  key={token.id || `token-${index}`} 
                  className={`hover:bg-dream-accent1/5 transition-colors ${token.isPlaceholder ? 'opacity-60' : ''}`}
                >
                  <TableCell className="py-3 px-4">
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
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="font-medium">${formatPrice(token.currentPrice || 0)}</div>
                    
                    {!token.isPlaceholder && tokenBetStats[token.id] && (
                      <div className="mt-1 text-xs text-dream-foreground/60 space-y-0.5">
                        <div className="flex justify-end items-center gap-1.5">
                          <Users className="w-3 h-3 text-dream-accent2/80" />
                          <span>{tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets || 0} bets</span>
                        </div>
                        
                        {tokenBetStats[token.id].totalVolume > 0 && (
                          <div className="flex justify-end items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-dream-accent1/80" />
                            <span>{tokenBetStats[token.id].totalVolume.toFixed(2)} volume</span>
                          </div>
                        )}
                        
                        {(tokenBetStats[token.id].upBets > 0 || tokenBetStats[token.id].downBets > 0) && (
                          <div className="flex justify-end items-center gap-1">
                            <div className="h-1.5 w-16 bg-dream-foreground/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                                style={{ 
                                  width: `${tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets > 0 
                                    ? (tokenBetStats[token.id].upBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-[10px]">
                              {tokenBetStats[token.id].upBets > 0 && (
                                <span className="text-green-400">{Math.round((tokenBetStats[token.id].upBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100)}% ▲</span>
                              )}
                              {tokenBetStats[token.id].downBets > 0 && (
                                <span className="text-red-400"> {Math.round((tokenBetStats[token.id].downBets / (tokenBetStats[token.id].upBets + tokenBetStats[token.id].downBets)) * 100)}% ▼</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <span className={`${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right text-xs text-dream-foreground/70">
                    {token.migrationTime ? formatTimeSince(token.migrationTime) : 'New'}
                  </TableCell>
                  <TableCell className="py-3 px-4">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MigratingTokenList;
