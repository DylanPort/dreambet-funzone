import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchBetsByToken, acceptBet } from '@/api/mockData';
import { Bet } from '@/types/bet';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink, ChevronLeft, BarChart3, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateBetForm from '@/components/CreateBetForm';
import BetCard from '@/components/BetCard';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, getLatestPriceFromTrades } from '@/services/pumpPortalWebSocketService';
import OrbitingParticles from '@/components/OrbitingParticles';
import { fetchDexScreenerData, startDexScreenerPolling } from '@/services/dexScreenerService';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import TokenComments from '@/components/TokenComments';

const TokenChart = ({ tokenId, tokenName, refreshData, loading }) => {
  const [iframeKey, setIframeKey] = useState(Date.now());
  
  const handleRefreshChart = () => {
    setIframeKey(Date.now());
    refreshData();
  };
  
  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-bold">Price Chart</h2>
        <div className="flex gap-2">
          <a 
            href={`https://dexscreener.com/solana/${tokenId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-dream-accent2 hover:underline flex items-center text-sm"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            DexScreener
          </a>
          <button 
            onClick={handleRefreshChart}
            className="text-dream-foreground/70 hover:text-dream-foreground flex items-center text-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="w-full h-[400px] bg-black/10 rounded-lg overflow-hidden relative">
        <iframe 
          key={iframeKey}
          src={`https://dexscreener.com/solana/${tokenId}?embed=1&theme=dark&trades=0&info=0`} 
          className="w-full h-full border-0"
          title="DexScreener Chart"
        ></iframe>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Button
          onClick={() => refreshData('up')}
          className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          Bet to Migrate
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => refreshData('down')}
        >
          <ArrowDown className="w-4 h-4 mr-2" />
          Bet to Die
        </Button>
      </div>
    </div>
  );
};

const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{ time: string; price: number }[]>([]);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const { toast } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  const { connected, publicKey, wallet } = useWallet();
  const [tokenMetrics, setTokenMetrics] = useState({
    marketCap: null,
    volume24h: null,
    liquidity: null,
    holders: 0
  });
  
  const lastPriceUpdateRef = useRef<number>(0);
  const lastMetricsUpdateRef = useRef<number>(0);
  const dexScreenerCleanupRef = useRef<Function | null>(null);
  
  const updateTokenPrice = useCallback((price: number, change24h: number) => {
    const now = Date.now();
    if (now - lastPriceUpdateRef.current > 2000) {
      lastPriceUpdateRef.current = now;
      setToken(current => {
        if (!current) return null;
        return {
          ...current,
          currentPrice: price,
          change24h: change24h
        };
      });
    }
  }, []);
  
  const updateTokenMetrics = useCallback((newMetrics: any) => {
    const now = Date.now();
    if (now - lastMetricsUpdateRef.current > 2000) {
      lastMetricsUpdateRef.current = now;
      setTokenMetrics(current => ({
        ...current,
        ...newMetrics
      }));
    }
  }, []);
  
  useEffect(() => {
    const loadToken = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log("Loading token with ID:", id);
        
        let tokenData = null;
        let isWebSocketToken = false;
        
        const recentTokens = pumpPortal.recentTokens || [];
        const webSocketToken = recentTokens.find(t => t.token_mint === id);
        
        if (webSocketToken) {
          console.log("Found token in WebSocket data:", webSocketToken);
          isWebSocketToken = true;
          tokenData = {
            token_mint: webSocketToken.token_mint,
            token_name: webSocketToken.token_name,
            token_symbol: webSocketToken.token_symbol || '',
            last_trade_price: 0,
            last_updated_time: webSocketToken.created_time,
          };
        }
        
        if (!tokenData) {
          console.log("Checking Supabase for token");
          const supabaseTokenData = await fetchTokenById(id);
          if (supabaseTokenData) {
            console.log("Found token in Supabase:", supabaseTokenData);
            tokenData = supabaseTokenData;
          }
        }
        
        if (tokenData) {
          console.log("Setting token data:", tokenData);
          setToken({
            id: tokenData.token_mint,
            name: tokenData.token_name,
            symbol: tokenData.token_symbol || '',
            logo: '🪙',
            currentPrice: tokenData.last_trade_price || 0,
            change24h: 0,
            migrationTime: new Date(tokenData.last_updated_time).getTime(),
          });
          
          setTokenMetrics({
            marketCap: null,
            volume24h: null,
            liquidity: null,
            holders: 0
          });
          
          const dexScreenerData = await fetchDexScreenerData(tokenData.token_mint);
          if (dexScreenerData) {
            console.log("Got DexScreener data:", dexScreenerData);
            setTokenMetrics({
              marketCap: dexScreenerData.marketCap,
              volume24h: dexScreenerData.volume24h,
              liquidity: dexScreenerData.liquidity,
              holders: tokenMetrics.holders
            });
          }
          
          if (pumpPortal.connected) {
            pumpPortal.subscribeToToken(id);
          }
          
          const now = new Date();
          const initialData = [];
          
          for (let i = -30; i <= 0; i++) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() + i);
            
            initialData.push({
              time: time.toISOString(),
              price: tokenData.last_trade_price || 0,
            });
          }
          
          setPriceData(initialData);
          
          const tokenBets = await fetchBetsByToken(id);
          setBets(tokenBets);
        } else if (id) {
          console.log("Creating placeholder for new token with ID:", id);
          setToken({
            id: id,
            name: "New Token",
            symbol: "",
            logo: '🪙',
            currentPrice: 0,
            change24h: 0,
            migrationTime: new Date().getTime(),
          });
          
          setTokenMetrics({
            marketCap: null,
            volume24h: null,
            liquidity: null,
            holders: 0
          });
          
          if (pumpPortal.connected) {
            pumpPortal.subscribeToToken(id);
          }
          
          const now = new Date();
          const initialData = [];
          
          for (let i = -30; i <= 0; i++) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() + i);
            
            initialData.push({
              time: time.toISOString(),
              price: 0,
            });
          }
          
          setPriceData(initialData);
          
          const tokenBets = await fetchBetsByToken(id);
          setBets(tokenBets);
          
          toast({
            title: "New token detected",
            description: "This appears to be a very new token. Limited information is available.",
            variant: "default",
          });
        } else {
          toast({
            title: "Token not found",
            description: "We couldn't find details for this token.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading token:", error);
        toast({
          title: "Failed to load token",
          description: "There was an error loading the token details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadToken();
  }, [id, toast, pumpPortal.connected, pumpPortal.recentTokens]);
  
  useEffect(() => {
    if (id && pumpPortal.recentTrades[id]) {
      const trades = pumpPortal.recentTrades[id];
      
      if (trades.length > 0) {
        const latestPrice = getLatestPriceFromTrades(trades);
        
        const currentPrice = token?.currentPrice || 0;
        
        if (Math.abs(latestPrice - currentPrice) / (currentPrice || 1) > 0.001) {
          const priceChange = currentPrice > 0 
            ? ((latestPrice - currentPrice) / currentPrice) * 100 
            : 0;
            
          updateTokenPrice(latestPrice, priceChange);
          
          setPriceData(current => {
            const newPoint = {
              time: new Date().toISOString(),
              price: latestPrice
            };
            
            return [...current, newPoint].slice(-60);
          });
        }
        
        if (Date.now() - lastMetricsUpdateRef.current > 5000) {
          if (pumpPortal.tokenMetrics[id]) {
            const metrics = pumpPortal.tokenMetrics[id];
            updateTokenMetrics({
              marketCap: metrics.market_cap,
              volume24h: metrics.volume_24h,
              liquidity: metrics.liquidity,
              holders: metrics.holders
            });
          }
        }
        
        const lastPrice = priceData[priceData.length - 1]?.price || 0;
        if (lastPrice > 0) {
          const percentChange = ((latestPrice - lastPrice) / lastPrice) * 100;
          if (Math.abs(percentChange) > 5) {
            toast({
              title: `Price ${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(1)}%`,
              description: `${token?.symbol || 'Token'} is now $${formatPrice(latestPrice)}`,
              variant: percentChange > 0 ? "default" : "destructive",
            });
          }
        }
      }
    }
  }, [id, pumpPortal.recentTrades, updateTokenPrice, priceData]);
  
  useEffect(() => {
    if (id && pumpPortal.tokenMetrics[id]) {
      const metrics = pumpPortal.tokenMetrics[id];
      
      updateTokenMetrics({
        marketCap: metrics.market_cap,
        volume24h: metrics.volume_24h,
        liquidity: metrics.liquidity,
        holders: metrics.holders
      });
      
      console.log("Updated token metrics from WebSocket:", metrics);
    }
  }, [id, pumpPortal.tokenMetrics, updateTokenMetrics]);
  
  useEffect(() => {
    if (id) {
      const stopPolling = startDexScreenerPolling(id, (data) => {
        if (data) {
          updateTokenPrice(data.priceUsd, data.priceChange24h);
          
          updateTokenMetrics({
            marketCap: data.marketCap,
            volume24h: data.volume24h,
            liquidity: data.liquidity,
          });
        }
      }, 30000);
      
      dexScreenerCleanupRef.current = stopPolling;
      
      return () => {
        if (dexScreenerCleanupRef.current) {
          dexScreenerCleanupRef.current();
          dexScreenerCleanupRef.current = null;
        }
      };
    }
  }, [id, updateTokenPrice, updateTokenMetrics]);
  
  const refreshData = useCallback(async (betType = null) => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const recentTokens = pumpPortal.recentTokens || [];
      const webSocketToken = recentTokens.find(t => t.token_mint === id);
      
      if (webSocketToken) {
        setToken(current => ({
          ...current,
          name: webSocketToken.token_name || current?.name || "New Token",
          symbol: webSocketToken.token_symbol || current?.symbol || "",
        }));
      } else {
        const tokenData = await fetchTokenById(id);
        if (tokenData) {
          setToken({
            id: tokenData.token_mint,
            name: tokenData.token_name,
            symbol: tokenData.token_symbol || '',
            logo: '🪙',
            currentPrice: tokenData.last_trade_price || 0,
            change24h: 0,
            migrationTime: new Date(tokenData.last_updated_time).getTime(),
          });
        }
      }
      
      const dexScreenerData = await fetchDexScreenerData(id);
      if (dexScreenerData) {
        console.log("Refreshed DexScreener data:", dexScreenerData);
        updateTokenMetrics({
          marketCap: dexScreenerData.marketCap,
          volume24h: dexScreenerData.volume24h,
          liquidity: dexScreenerData.liquidity
        });
      } else if (pumpPortal.connected) {
        pumpPortal.fetchTokenMetrics(id);
      }
      
      const tokenBets = await fetchBetsByToken(id);
      setBets(tokenBets);
      
      if (betType) {
        setShowCreateBet(true);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh token data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, pumpPortal, toast, updateTokenMetrics]);

  const handleAcceptBet = async (bet: Bet) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept a bet",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await acceptBet(bet, publicKey.toString(), wallet);
      toast({
        title: "Bet accepted!",
        description: `You've successfully accepted the bet on ${bet.tokenSymbol}`,
      });
      await refreshData();
    } catch (error) {
      console.error("Error accepting bet:", error);
      toast({
        title: "Failed to accept bet",
        description: "There was an error processing the blockchain transaction",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return "0.000000";
    
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatLargeNumber = (num: number | null) => {
    if (num === null) return "Loading...";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const isLive = pumpPortal.connected && id && pumpPortal.recentTrades[id];
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading && !token ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !token ? (
            <div className="glass-panel p-8 text-center">
              <h2 className="text-2xl font-display font-bold mb-2">Token Not Found</h2>
              <p className="text-dream-foreground/70 mb-4">
                The token you're looking for could not be found or has been removed.
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          ) : (
            <>
              <Link to="/betting" className="flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
                <ChevronLeft size={20} />
                <span>Back to Tokens</span>
              </Link>
            
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-3xl border border-white/10 mr-4">
                    {token.symbol ? token.symbol.charAt(0) : '🪙'}
                  </div>
                  
                  <div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold">{token.name}</h1>
                    <div className="flex items-center gap-3">
                      <span className="text-dream-foreground/70">{token.symbol}</span>
                      <a 
                        href={`https://solscan.io/token/${token.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-dream-accent2 hover:underline inline-flex items-center text-sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View on SolScan
                      </a>
                      <span className={`flex items-center gap-1 text-sm ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isLive ? 'Live' : 'Static'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold">${formatPrice(token.currentPrice)}</div>
                  <div className={`flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                    {Math.abs(token.change24h).toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <TokenMarketCap tokenId={token.id} />
                
                <TokenVolume tokenId={token.id} />
                
                <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-dream-accent3/10 to-dream-accent1/10 animate-gradient-move"></div>
                  <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
                    <Users size={20} className="mr-3 text-dream-accent3" />
                    <span className="text-lg font-semibold">Active Bets</span>
                  </div>
                  <div className="text-3xl font-bold relative z-10">{bets.length}</div>
                  <div className="absolute top-2 right-2 flex items-center">
                    <button 
                      onClick={() => refreshData()}
                      className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
                      title="Refresh Data"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent3 to-dream-accent1 animate-pulse-glow" style={{ width: `${Math.min(100, (bets.length / 10) * 100)}%` }}></div>
                </div>
              </div>
              
              <TokenChart 
                tokenId={token.id}
                tokenName={token.name}
                refreshData={refreshData}
                loading={loading}
              />
              
              {showCreateBet && (
                <div className="glass-panel p-6 mb-8">
                  <h2 className="text-xl font-display font-bold mb-4">Create a Bet</h2>
                  <CreateBetForm 
                    tokenId={token.id}
                    tokenName={token.name}
                    tokenSymbol={token.symbol || ''}
                    onBetCreated={async () => {
                      setShowCreateBet(false);
                      await refreshData();
                    }}
                  />
                </div>
              )}
              
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-display font-bold">Active Bets</h2>
                  <div className="text-sm text-dream-foreground/70">{bets.length} bets</div>
                </div>
                
                {bets.length === 0 ? (
                  <div className="text-center py-8 text-dream-foreground/70">
                    No active bets for this token yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bets.map(bet => (
                      <BetCard 
                        key={bet.id}
                        bet={bet}
                        connected={connected}
                        publicKeyString={publicKey ? publicKey.toString() : null}
                        onAcceptBet={handleAcceptBet}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="glass-panel p-6 mt-8">
                <TokenComments 
                  tokenId={token.id}
                  tokenName={token.name}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default TokenDetail;
