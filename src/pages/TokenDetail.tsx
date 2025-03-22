import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { fetchTokenById, trackTokenSearch } from '@/services/supabaseService';
import { fetchBetsByToken, acceptBet } from '@/api/mockData';
import { Bet, BetStatus } from '@/types/bet';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink, ChevronLeft, BarChart3, Users, DollarSign, ArrowUpRight, ArrowDownRight, HelpCircle, CheckCircle, XCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import CreateBetForm from '@/components/CreateBetForm';
import BetCard from '@/components/BetCard';
import { useToast } from '@/hooks/use-toast';
import { usePumpPortalWebSocket, getLatestPriceFromTrades, formatRawTrade, RawTokenTradeEvent } from '@/services/pumpPortalWebSocketService';
import OrbitingParticles from '@/components/OrbitingParticles';
import { fetchDexScreenerData, startDexScreenerPolling } from '@/services/dexScreenerService';
import TokenMarketCap from '@/components/TokenMarketCap';
import TokenVolume from '@/components/TokenVolume';
import TokenComments from '@/components/TokenComments';
import PriceChart from '@/components/PriceChart';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { usePumpPortal } from '@/hooks/usePumpPortal';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

const TokenChart = ({
  tokenId,
  tokenName,
  refreshData,
  loading,
  onPriceUpdate,
  setShowCreateBet
}) => {
  const [timeInterval, setTimeInterval] = useState('15');
  const [chartTheme, setChartTheme] = useState('dark');
  const handleRefreshChart = () => {
    refreshData();
  };
  useEffect(() => {
    const handleMessage = event => {
      try {
        if (event.data && typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.price) {
            onPriceUpdate(data.price, data.change || 0);
          }
        }
      } catch (error) {
        console.error("Error handling chart message:", error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPriceUpdate]);
  const chartUrl = `https://www.gmgn.cc/kline/sol/${tokenId}?theme=${chartTheme}&interval=${timeInterval}&send_price=true`;
  return <div className="glass-panel p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-bold">Price Chart</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="interval" className="text-sm text-dream-foreground/70">Interval:</label>
            <select id="interval" value={timeInterval} onChange={e => setTimeInterval(e.target.value)} className="bg-black/20 border border-dream-accent2/20 rounded px-2 py-1 text-sm">
              <option value="1S">1 Second</option>
              <option value="1">1 Minute</option>
              <option value="5">5 Minutes</option>
              <option value="15">15 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="240">4 Hours</option>
              <option value="720">12 Hours</option>
              <option value="1D">1 Day</option>
            </select>
          </div>
          <div className="flex gap-2">
            <a href={`https://dexscreener.com/solana/${tokenId}`} target="_blank" rel="noopener noreferrer" className="text-dream-accent2 hover:underline flex items-center text-sm">
              <ExternalLink className="w-3 h-3 mr-1" />
              DexScreener
            </a>
            <button onClick={handleRefreshChart} className="text-dream-foreground/70 hover:text-dream-foreground flex items-center text-sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full h-[400px] bg-black/10 rounded-lg overflow-hidden relative">
        <iframe src={chartUrl} className="w-full h-full border-0" title="GMGN Price Chart" loading="lazy"></iframe>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="relative group cursor-pointer glass-panel border border-dream-accent1/10 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-dream-accent1/30" onClick={() => {
        const moonPredictionEvent = new CustomEvent('predictionSelected', {
          detail: {
            prediction: 'moon',
            percentageChange: 80,
            defaultBetAmount: 10,
            defaultDuration: 30
          }
        });
        window.dispatchEvent(moonPredictionEvent);
        refreshData('up');
        setShowCreateBet(true);
      }}>
          <img src="/lovable-uploads/24c9c7f3-aec1-4095-b55f-b6198e22db19.png" alt="MOON" className="w-20 h-20 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(209,103,243,0.7)]" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-cyan-400/20 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
          <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">MOON</span>
        </div>
        
        <div className="relative group cursor-pointer glass-panel border border-dream-accent1/10 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-dream-accent1/30" onClick={() => {
        const dustPredictionEvent = new CustomEvent('predictionSelected', {
          detail: {
            prediction: 'die',
            percentageChange: 50,
            defaultBetAmount: 10,
            defaultDuration: 30
          }
        });
        window.dispatchEvent(dustPredictionEvent);
        refreshData('down');
        setShowCreateBet(true);
      }}>
          <img src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" alt="DUST" className="w-20 h-20 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(0,179,255,0.7)]" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-cyan-400/20 to-magenta-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
          <span className="font-bold text-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">DUST</span>
        </div>
      </div>
    </div>;
};

const TokenDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{
    time: string;
    price: number;
  }[]>([]);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const [newActiveBet, setNewActiveBet] = useState<Bet | null>(null);
  const [activeBetsCount, setActiveBetsCount] = useState(0);
  const {
    toast
  } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  const {
    connected,
    publicKey,
    wallet
  } = useWallet();
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
      setPriceData(current => {
        const newPoint = {
          time: new Date().toISOString(),
          price: price
        };
        return [...current, newPoint].slice(-60);
      });
    }
  }, []);
  const handleChartPriceUpdate = useCallback((price: number, change24h: number = 0) => {
    console.log("Received price update from chart:", price, change24h);
    updateTokenPrice(price, change24h);
    try {
      localStorage.setItem(`token_price_${id}`, JSON.stringify({
        price,
        change24h,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching price:", error);
    }
  }, [id, updateTokenPrice]);
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
        
        try {
          const cachedPrice = localStorage.getItem(`token_price_${id}`);
          if (cachedPrice) {
            const {
              price,
              change24h,
              timestamp
            } = JSON.parse(cachedPrice);
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              setToken(current => {
                if (!current) return null;
                return {
                  ...current,
                  currentPrice: price,
                  change24h: change24h
                };
              });
            }
          }
        } catch (e) {
          console.error("Error loading cached price:", e);
        }
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
            last_updated_time: webSocketToken.created_time
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
            migrationTime: new Date(tokenData.last_updated_time).getTime()
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
              price: tokenData.last_trade_price || 0
            });
          }
          setPriceData(initialData);
          const tokenBets = await fetchBetsByToken(id);
          setBets(tokenBets);
        } else if (id) {
          console.log("Creating placeholder for new token with ID:", id);
          let tokenName = "New Token";
          let tokenSymbol = "";
          const dexScreenerData = await fetchDexScreenerData(id);
          if (dexScreenerData) {
            console.log("Got DexScreener data for new token:", dexScreenerData);
            const baseTokenInfo = (dexScreenerData as any).baseToken;
            if (baseTokenInfo) {
              tokenName = baseTokenInfo.name || tokenName;
              tokenSymbol = baseTokenInfo.symbol || tokenSymbol;
            }
            setTokenMetrics({
              marketCap: dexScreenerData.marketCap,
              volume24h: dexScreenerData.volume24h,
              liquidity: dexScreenerData.liquidity,
              holders: 0
            });
          }
          setToken({
            id: id,
            name: tokenName,
            symbol: tokenSymbol,
            logo: '🪙',
            currentPrice: dexScreenerData?.priceUsd || 0,
            change24h: dexScreenerData?.priceChange24h || 0,
            migrationTime: new Date().getTime()
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
              price: dexScreenerData?.priceUsd || 0
            });
          }
          setPriceData(initialData);
          const tokenBets = await fetchBetsByToken(id);
          setBets(tokenBets);
          toast({
            title: "New token detected",
            description: "This appears to be a very new token. Limited information is available.",
            variant: "default"
          });
          trackTokenSearch(id, tokenName, tokenSymbol);
        } else {
          toast({
            title: "Token not found",
            description: "We couldn't find details for this token.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error loading token:", error);
        toast({
          title: "Failed to load token",
          description: "There was an error loading the token details.",
          variant: "destructive"
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
          const priceChange = currentPrice > 0 ? (latestPrice - currentPrice) / currentPrice * 100 : 0;
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
          const percentChange = (latestPrice - lastPrice) / lastPrice * 100;
          if (Math.abs(percentChange) > 5) {
            toast({
              title: `Price ${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(1)}%`,
              description: `${token?.symbol || 'Token'} is now $${formatPrice(latestPrice)}`,
              variant: percentChange > 0 ? "default" : "destructive"
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
      const stopPolling = startDexScreenerPolling(id, data => {
        if (data) {
          updateTokenPrice(data.priceUsd, data.priceChange24h);
          updateTokenMetrics({
            marketCap: data.marketCap,
            volume24h: data.volume24h,
            liquidity: data.liquidity
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
  useEffect(() => {
    if (bets.length > 0) {
      const activeBets = bets.filter(bet => bet.status === 'open' || bet.status === 'matched');
      if (activeBets.length > activeBetsCount) {
        const latestBet = [...activeBets].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        setNewActiveBet(latestBet);
        toast({
          title: "New Active Bet!",
          description: `A ${latestBet.amount} SOL bet is now active on ${token?.symbol || 'this token'}`,
          variant: "default"
        });
      }
      setActiveBetsCount(activeBets.length);
    }
  }, [bets, activeBetsCount, toast, token]);
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
          symbol: webSocketToken.token_symbol || current?.symbol || ""
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
            migrationTime: new Date(tokenData.last_updated_time).getTime()
          });
        }
      }
      const dexScreenerData = await fetchDexScreenerData(id);
      if (dexScreenerData) {
        console.log("Refreshed DexScreener data:", dexScreenerData);
        if (token && (!token.name || token.name === "New Token")) {
          setToken(current => ({
            ...current,
            currentPrice: dexScreenerData.priceUsd || current?.currentPrice || 0,
            change24h: dexScreenerData.priceChange24h || current?.change24h || 0
          }));
        }
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [id, pumpPortal, toast, updateTokenMetrics, token]);
  const handleAcceptBet = async (bet: Bet) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept a bet",
        variant: "destructive"
      });
      return;
    }
    try {
      await acceptBet(bet, publicKey.toString(), wallet);
      toast({
        title: "Bet accepted!",
        description: `You've successfully accepted the bet on ${bet.tokenSymbol}`
      });
      setNewActiveBet(bet);
      toast({
        title: "New Active Bet!",
        description: `A ${bet.amount} SOL bet is now active on ${token?.symbol || 'this token'}`
      });
      await refreshData();
    } catch (error) {
      console.error("Error accepting bet:", error);
      toast({
        title: "Failed to accept bet",
        description: "There was an error processing the blockchain transaction",
        variant: "destructive"
      });
    }
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

  const formatLargeNumber = (num: number | null) => {
    if (num === null || num === undefined) return "N/A";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const isLive = pumpPortal.connected && id && pumpPortal.recentTrades[id];
  const renderActiveBetBanner = () => {
    if (!newActiveBet) return null;
    return <div className="bg-gradient-to-r from-dream-accent1/20 to-dream-accent3/20 border border-dream-accent2/30 rounded-md p-3 mb-4 animate-pulse-slow">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-dream-accent2 rounded-full mr-2 animate-pulse"></div>
            <span className="text-dream-accent2 font-semibold">New Active Bet!</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNewActiveBet(null)} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        <p className="text-sm mt-1">
          A {newActiveBet.amount} PXB bet that this token will {newActiveBet.prediction} is now active!
        </p>
      </div>;
  };
  const {
    userProfile,
    bets: userPXBBets,
    fetchUserBets,
    isLoading: pxbLoading
  } = usePXBPoints();
  const [tokenPXBBets, setTokenPXBBets] = useState([]);
  const [loadingMarketCaps, setLoadingMarketCaps] = useState({});
  const [marketCapData, setMarketCapData] = useState({});
  useEffect(() => {
    if (userProfile && userPXBBets && userPXBBets.length > 0 && id) {
      const filteredBets = userPXBBets.filter(bet => bet.tokenMint === id);
      setTokenPXBBets(filteredBets);
    } else {
      setTokenPXBBets([]);
    }
  }, [userProfile, userPXBBets, id]);
  useEffect(() => {
    const fetchMarketCapData = async () => {
      if (!tokenPXBBets || tokenPXBBets.length === 0) return;
      for (const bet of tokenPXBBets) {
        if (!bet.tokenMint) continue;
        if (marketCapData[bet.id]?.currentMarketCap) continue;
        setLoadingMarketCaps(prev => ({
          ...prev,
          [bet.id]: true
        }));
        try {
          const data = await fetchDexScreenerData(bet.tokenMint);
          if (data) {
            setMarketCapData(prev => ({
              ...prev,
              [bet.id]: {
                initialMarketCap: bet.initialMarketCap || data.marketCap,
                currentMarketCap: data.marketCap
              }
            }));
          }
        } catch (error) {
          console.error(`Error fetching data for token ${bet.tokenSymbol}:`, error);
        } finally {
          setLoadingMarketCaps(prev => ({
            ...prev,
            [bet.id]: false
          }));
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };
    fetchMarketCapData();
    const interval = setInterval(() => {
      const pendingBets = tokenPXBBets.filter(bet => bet.status === 'pending');
      if (pendingBets.length > 0) {
        fetchMarketCapData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [tokenPXBBets, marketCapData]);
  const calculateProgress = bet => {
    if (bet.status !== 'pending') {
      return bet.status === 'won' ? 100 : 0;
    }
    
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    
    if (currentMarketCap && initialMarketCap) {
      const actualChange = (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
      const targetChange = bet.percentageChange;
      
      if (bet.betType === 'up') {
        if (actualChange < 0) return 0;
        return Math.min(100, actualChange / targetChange * 100);
      } else {
        if (actualChange > 0) return 0;
        return Math.min(100, Math.abs(actualChange) / targetChange * 100);
      }
    }
    
    return 0;
  };
  const calculateTargetMarketCap = bet => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    if (!initialMarketCap) return null;
    if (bet.betType === 'up') {
      return initialMarketCap * (1 + bet.percentageChange / 100);
    } else {
      return initialMarketCap * (1 - bet.percentageChange / 100);
    }
  };
  const calculateMarketCapChange = bet => {
    const initialMarketCap = bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap;
    const currentMarketCap = marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap;
    if (currentMarketCap && initialMarketCap) {
      return (currentMarketCap - initialMarketCap) / initialMarketCap * 100;
    }
    return null;
  };
  useEffect(() => {
    if (userProfile && id) {
      fetchUserBets();
    }
  }, [userProfile, id, fetchUserBets]);
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
              
              {renderActiveBetBanner()}
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-3xl border border-white/10 mr-4">
                    {token.symbol ? token.symbol.charAt(0) : '🪙'}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-display font-bold flex items-center">
                      {token.name}
                      <span className="text-dream-foreground/50 ml-2">{token.symbol}</span>
                      <button 
                        className="ml-2 p-1 hover:bg-dream-accent1/10 rounded-full" 
                        onClick={() => {
                          navigator.clipboard.writeText(token.id);
                          toast({
                            title: "Copied",
                            description: "Token address copied to clipboard",
                          });
                        }}
                      >
                        <Copy size={14} />
                      </button>
                    </h1>
                    
                    <div className="flex items-center mt-1">
                      <span className="text-xl font-semibold mr-2">${formatPrice(token.currentPrice)}</span>
                      <div className={`flex items-center ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {token.change24h >= 0 
                          ? <ArrowUpRight size={16} className="mr-1" /> 
                          : <ArrowDownRight size={16} className="mr-1" />}
                        {Math.abs(token.change24h).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Card className="bg-black/20 border-dream-accent1/20">
                    <CardContent className="p-4 flex items-center">
                      <BarChart3 size={20} className="mr-2 text-dream-accent2" />
                      <div>
                        <div className="text-sm text-dream-foreground/70">Market Cap</div>
                        <div className="font-semibold">{formatLargeNumber(tokenMetrics.marketCap)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/20 border-dream-accent1/20">
                    <CardContent className="p-4 flex items-center">
                      <DollarSign size={20} className="mr-2 text-dream-accent3" />
                      <div>
                        <div className="text-sm text-dream-foreground/70">24h Volume</div>
                        <div className="font-semibold">{formatLargeNumber(tokenMetrics.volume24h)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/20 border-dream-accent1/20">
                    <CardContent className="p-4 flex items-center">
                      <Users size={20} className="mr-2 text-dream-accent1" />
                      <div>
                        <div className="text-sm text-dream-foreground/70">Holders</div>
                        <div className="font-semibold">{tokenMetrics.holders.toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <TokenChart 
                tokenId={token.id}
                tokenName={token.name}
                refreshData={refreshData}
                loading={loading}
                onPriceUpdate={handleChartPriceUpdate}
                setShowCreateBet={setShowCreateBet}
              />
              
              {/* Token PXB Bets Section */}
              {tokenPXBBets && tokenPXBBets.length > 0 && (
                <div className="glass-panel p-6 mb-8">
                  <h2 className="text-xl font-display font-bold mb-4">Your Bets on This Token</h2>
                  <div className="grid gap-4">
                    {tokenPXBBets.map(bet => (
                      <Card key={bet.id} className="bg-black/20 border-dream-accent1/20">
                        <CardHeader className="pb-0">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded-full ${bet.betType === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {bet.betType === 'up' 
                                  ? <ArrowUp className="h-4 w-4 text-green-500" /> 
                                  : <ArrowDown className="h-4 w-4 text-red-500" />}
                              </div>
                              <h3 className="text-lg font-semibold">{bet.betAmount} PXB</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                bet.status === 'won' ? 'bg-green-500/20 text-green-500' : 
                                bet.status === 'lost' ? 'bg-red-500/20 text-red-500' : 
                                'bg-blue-500/20 text-blue-500'
                              }`}>
                                {bet.status === 'won' ? 'Won' : 
                                 bet.status === 'lost' ? 'Lost' : 
                                 'Active'}
                              </span>
                              <span className="text-xs text-dream-foreground/50">
                                {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mt-2">
                            <div className="text-sm mb-1 flex justify-between">
                              <span>Prediction: {bet.betType === 'up' ? 'Price Up' : 'Price Down'} by {bet.percentageChange}%</span>
                              <span>
                                {bet.status === 'pending' ? (
                                  <>
                                    Expires: {formatDistanceToNow(new Date(bet.expiresAt), { addSuffix: true })}
                                  </>
                                ) : bet.status === 'won' ? (
                                  <span className="text-green-500 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Won {bet.pointsWon} PXB
                                  </span>
                                ) : (
                                  <span className="text-red-500 flex items-center">
                                    <XCircle className="h-3 w-3 mr-1" /> Lost
                                  </span>
                                )}
                              </span>
                            </div>
                            
                            {bet.status === 'pending' && (
                              <>
                                <Progress 
                                  value={calculateProgress(bet)} 
                                  className={`h-2 ${bet.betType === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`} 
                                />
                                
                                <div className="grid grid-cols-3 text-xs mt-1 text-dream-foreground/70">
                                  <div>
                                    <div>Initial</div>
                                    <div className="font-medium">
                                      {formatLargeNumber(bet.initialMarketCap || marketCapData[bet.id]?.initialMarketCap)}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div>Current ({loadingMarketCaps[bet.id] && 'updating...'})</div>
                                    <div className="font-medium">
                                      {formatLargeNumber(marketCapData[bet.id]?.currentMarketCap || bet.currentMarketCap)}
                                    </div>
                                    {calculateMarketCapChange(bet) !== null && (
                                      <div className={calculateMarketCapChange(bet) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {calculateMarketCapChange(bet) >= 0 ? '+' : ''}{calculateMarketCapChange(bet).toFixed(2)}%
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div>Target</div>
                                    <div className="font-medium">
                                      {formatLargeNumber(calculateTargetMarketCap(bet))}
                                    </div>
                                    <div className={bet.betType === 'up' ? 'text-green-500' : 'text-red-500'}>
                                      {bet.betType === 'up' ? '+' : '-'}{bet.percentageChange}%
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Token bets section */}
              <div className="glass-panel p-6 mb-8">
                <h2 className="text-xl font-display font-bold mb-4">Token Bets</h2>
                
                {bets.length === 0 ? (
                  <div className="bg-black/20 rounded-lg p-6 text-center">
                    <p className="text-dream-foreground/70 mb-4">No bets on this token yet.</p>
                    {connected ? (
                      <Button onClick={() => setShowCreateBet(true)}>Create First Bet</Button>
                    ) : (
                      <p className="text-dream-foreground/50 text-sm">Connect your wallet to create a bet</p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {bets.map(bet => (
                      <BetCard 
                        key={bet.id} 
                        bet={bet} 
                        onAcceptBet={handleAcceptBet} 
                        isConnected={connected}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {showCreateBet && (
                <CreateBetForm 
                  tokenId={token.id} 
                  tokenName={token.name} 
                  tokenSymbol={token.symbol} 
                  onClose={() => setShowCreateBet(false)} 
                  onSuccess={refreshData}
                />
              )}
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Market cap chart */}
                <TokenMarketCap tokenId={token.id} />
                
                {/* Volume chart */}
                <TokenVolume tokenId={token.id} />
              </div>
              
              {/* Comments section */}
              <TokenComments tokenId={token.id} />
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default TokenDetail;

