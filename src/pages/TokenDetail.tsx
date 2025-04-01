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
import { fetchTokenImage } from '@/services/moralisService';
import { Skeleton } from '@/components/ui/skeleton';
import TokenTrading from '@/components/TokenTrading';

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
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const lastPriceUpdateRef = useRef<number>(0);
  const lastMetricsUpdateRef = useRef<number>(0);
  const dexScreenerCleanupRef = useRef<Function | null>(null);
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
    const loadTokenImage = async () => {
      if (!id || !token) return;
      try {
        setImageLoading(true);
        setImageError(false);
        const imageUrl = await fetchTokenImage(id, token.symbol);
        setTokenImage(imageUrl);
      } catch (error) {
        console.error("Error loading token image:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };
    loadTokenImage();
  }, [id, token]);
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
            <span className="font-semibold text-[#28f900]">New Active Bet!</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNewActiveBet(null)} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        
      </div>;
  };
  const {
    userProfile,
    bets: userPXBBets,
    fetchUserBets,
    isLoading: pxbLoading
  } = usePXBPoints();
  const [tokenPXBBets, setTokenPXBBets] = useState<any[]>([]);
  const [loadingMarketCaps, setLoadingMarketCaps] = useState<Record<string, boolean>>({});
  const [marketCapData, setMarketCapData] = useState<Record<string, {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  }>>({});
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
  const renderTokenImage = () => {
    if (imageLoading) {
      return <Skeleton className="w-16 h-16 rounded-full" />;
    }
    if (tokenImage && !imageError) {
      return <img src={tokenImage} alt={token?.symbol || 'Token'} className="w-16 h-16 rounded-full object-cover border border-white/10" onError={() => setImageError(true)} />;
    }
    const colorGradient = token?.symbol ? generateColorFromSymbol(token.symbol) : 'from-dream-accent1/20 to-dream-accent3/20';
    return <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-3xl border border-white/10`}>
        {token?.symbol ? token.symbol.charAt(0) : '🪙'}
      </div>;
  };
  const generateColorFromSymbol = (symbol: string) => {
    const colors = ['from-pink-500 to-purple-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-yellow-500 to-orange-500', 'from-red-500 to-pink-500', 'from-indigo-500 to-blue-500'];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderTokenTrading = () => {
    if (!token) return null;
    
    return (
      <TokenTrading 
        tokenId={token.id}
        tokenName={token.name}
        tokenSymbol={token.symbol}
        tokenPrice={token.currentPrice}
      />
    );
  };

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
                  {renderTokenImage()}
                  
                  <div className="ml-4">
                    <h1 className="text-2xl font-display font-bold flex items-center">
                      {token.name}
                      {isLive && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                          LIVE
                        </span>}
                    </h1>
                    <div className="flex items-center text-dream-foreground/70">
                      <span className="mr-2">{token.symbol}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(token.id);
                        toast({
                          title: "Copied to clipboard",
                          description: "Token address has been copied to your clipboard"
                        });
                      }} className="text-xs text-dream-foreground/50 hover:text-dream-foreground/80 flex items-center">
                        <Copy size={12} className="mr-1" />
                        {token.id.substring(0, 4)}...{token.id.substring(token.id.length - 4)}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-bold flex items-center">
                      ${formatPrice(token.currentPrice)}
                      <span className={`ml-2 text-sm ${token.change24h > 0 ? 'text-green-400 flex' : token.change24h < 0 ? 'text-red-400 flex' : 'text-dream-foreground/50 hidden'} items-center`}>
                        {token.change24h > 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                        {Math.abs(token.change24h).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-dream-foreground/50 mt-1">
                      Last updated: {formatDistanceToNow(lastPriceUpdateRef.current || Date.now(), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refreshData()}
                      disabled={loading}
                      className="flex items-center"
                    >
                      <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://dexscreener.com/solana/${token.id}`, '_blank')}
                      className="flex items-center"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View on DexScreener
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Market Data Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <TokenMarketCap tokenId={token.id} />
                <TokenVolume tokenId={token.id} />
                <Card className="bg-dream-card/30 backdrop-blur-md border-dream-card-border p-4">
                  <div className="flex items-center text-dream-foreground/80 mb-2">
                    <Users size={18} className="mr-2 text-dream-accent3" />
                    <span className="text-sm font-semibold">Holders</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {tokenMetrics.holders.toLocaleString() || 'N/A'}
                  </div>
                </Card>
              </div>
              
              {/* Trading Section */}
              {renderTokenTrading()}
              
              {/* Chart */}
              <TokenChart 
                tokenId={token.id} 
                tokenName={token.name} 
                refreshData={refreshData} 
                loading={loading} 
                onPriceUpdate={handleChartPriceUpdate}
                setShowCreateBet={setShowCreateBet}
              />
              
              {/* User Bets Section */}
              {tokenPXBBets.length > 0 && (
                <div className="glass-panel mb-8 p-6">
                  <h2 className="text-xl font-bold mb-4">Your PXB Bets on {token.symbol}</h2>
                  <div className="grid gap-6">
                    {tokenPXBBets.map(bet => (
                      <div key={bet.id} className="bg-black/30 border border-dream-accent2/20 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                bet.status === 'won' ? 'bg-green-500/20 text-green-400' : 
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {bet.status === 'pending' ? 'In Progress' : 
                                 bet.status === 'won' ? 'Won' : 'Lost'}
                              </span>
                              <span className="ml-2 text-sm">
                                {bet.betType === 'up' ? 
                                  <span className="flex items-center text-green-400">
                                    <ArrowUp size={14} className="mr-1" /> {bet.percentageChange}% Up
                                  </span> : 
                                  <span className="flex items-center text-red-400">
                                    <ArrowDown size={14} className="mr-1" /> {bet.percentageChange}% Down
                                  </span>
                                }
                              </span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="text-dream-foreground/70">Bet amount:</span> <span className="text-dream-accent2 font-semibold">{bet.amount} PXB</span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="text-dream-foreground/70">Created:</span> {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {bet.status === 'pending' ? (
                              <div className="text-sm text-dream-foreground/70">
                                <span className="font-semibold text-green-400">+{bet.potentialWinnings} PXB</span> if correct
                              </div>
                            ) : bet.status === 'won' ? (
                              <div className="text-sm font-semibold text-green-400">
                                +{bet.winAmount} PXB
                              </div>
                            ) : (
                              <div className="text-sm font-semibold text-red-400">
                                -{bet.amount} PXB
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {bet.status === 'pending' && (
                          <>
                            <div className="flex justify-between text-xs mb-1">
                              <div className="flex items-center">
                                <span className="mr-1">Initial:</span>
                                <span className="font-semibold">{marketCapData[bet.id]?.initialMarketCap 
                                  ? formatLargeNumber(marketCapData[bet.id].initialMarketCap) 
                                  : 'Calculating...'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">Target:</span>
                                <span className="font-semibold">
                                  {calculateTargetMarketCap(bet) 
                                    ? formatLargeNumber(calculateTargetMarketCap(bet)) 
                                    : 'Calculating...'}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">Current:</span>
                                <span className="font-semibold">
                                  {marketCapData[bet.id]?.currentMarketCap 
                                    ? formatLargeNumber(marketCapData[bet.id].currentMarketCap) 
                                    : 'Calculating...'}
                                </span>
                              </div>
                            </div>
                            
                            <Progress 
                              value={calculateProgress(bet)} 
                              className="h-2 mb-2" 
                              indicatorClassName={bet.betType === 'up' ? 'bg-green-400' : 'bg-red-400'} 
                            />
                            
                            <div className="text-xs text-center">
                              {loadingMarketCaps[bet.id] ? (
                                <span className="text-dream-foreground/50">Updating market cap data...</span>
                              ) : (
                                <span className={
                                  calculateMarketCapChange(bet) === null ? 'text-dream-foreground/50' :
                                  calculateMarketCapChange(bet) > 0 ? 'text-green-400' : 'text-red-400'
                                }>
                                  Market cap has changed{' '}
                                  {calculateMarketCapChange(bet) === null ? '...' :
                                   `${calculateMarketCapChange(bet) > 0 ? '+' : ''}${calculateMarketCapChange(bet).toFixed(2)}% since bet was placed`}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bets Section */}
              <div className="glass-panel mb-8 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display font-bold">Open Bets</h2>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateBet(true)}
                      className={`transition-all ${bets.filter(b => b.status === 'open').length > 0 ? 'opacity-100' : 'opacity-70'}`}
                    >
                      <ArrowUp size={14} className="mr-1 text-green-400" />
                      Create UP bet
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateBet(true)}
                      className={`transition-all ${bets.filter(b => b.status === 'open').length > 0 ? 'opacity-100' : 'opacity-70'}`}
                    >
                      <ArrowDown size={14} className="mr-1 text-red-400" />
                      Create DOWN bet
                    </Button>
                  </div>
                </div>
                
                {showCreateBet ? (
                  <div className="mb-6">
                    <CreateBetForm
                      tokenId={token.id}
                      tokenSymbol={token.symbol}
                      tokenName={token.name}
                      onClose={() => setShowCreateBet(false)}
                      onSuccess={() => {
                        setShowCreateBet(false);
                        refreshData();
                      }}
                    />
                  </div>
                ) : null}
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bets.filter(bet => bet.status === 'open').map((bet) => (
                    <BetCard
                      key={bet.id}
                      bet={bet}
                      tokenPrice={token?.currentPrice || 0}
                      onAcceptBet={handleAcceptBet}
                    />
                  ))}
                  
                  {bets.filter(bet => bet.status === 'open').length === 0 && (
                    <div className="col-span-3 text-center py-8 text-dream-foreground/70">
                      <HelpCircle className="mx-auto mb-2 text-dream-foreground/40" size={32} />
                      <p>No open bets for this token yet.</p>
                      <p className="mt-2">Be the first to create a bet!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Active Bets */}
              {bets.filter(bet => bet.status === 'matched').length > 0 && (
                <div className="glass-panel mb-8 p-6">
                  <h2 className="text-xl font-display font-bold mb-4">Active Bets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {bets.filter(bet => bet.status === 'matched').map((bet) => (
                      <Card key={bet.id} className="overflow-hidden border-dream-accent2/20 bg-black/30">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 text-xs rounded-full">
                                Active
                              </span>
                              <span className="ml-2 text-xs text-dream-foreground/50">
                                Ends in 12h
                              </span>
                            </div>
                            <div className="text-lg font-bold">{bet.amount} SOL</div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between mb-2">
                            <div className="text-sm">
                              <div className="text-dream-foreground/70">Created by</div>
                              <div className="font-mono text-xs">{bet.creatorAddress.substring(0, 4)}...{bet.creatorAddress.substring(bet.creatorAddress.length - 4)}</div>
                            </div>
                            <div className="text-sm">
                              <div className="text-dream-foreground/70">Challenger</div>
                              <div className="font-mono text-xs">{bet.acceptorAddress?.substring(0, 4)}...{bet.acceptorAddress?.substring(bet.acceptorAddress.length - 4)}</div>
                            </div>
                          </div>
                          
                          <div className="bg-dream-accent1/10 p-3 rounded-md flex justify-between items-center mb-3">
                            <div className="text-sm">
                              <div className="text-dream-foreground/70">Direction</div>
                              <div className="font-semibold flex items-center">
                                {bet.direction === 'up' ? (
                                  <span className="flex items-center text-green-400">
                                    <ArrowUp size={14} className="mr-1" /> UP
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-400">
                                    <ArrowDown size={14} className="mr-1" /> DOWN
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <div className="text-dream-foreground/70">Target</div>
                              <div className="font-semibold">${formatPrice(bet.targetPrice)}</div>
                            </div>
                            
                            <div className="text-sm">
                              <div className="text-dream-foreground/70">Current</div>
                              <div className="font-semibold">${formatPrice(token?.currentPrice || 0)}</div>
                            </div>
                          </div>
                          
                          <Progress 
                            value={bet.direction === 'up' 
                              ? Math.min(100, (token?.currentPrice || 0) / bet.targetPrice * 100) 
                              : Math.min(100, bet.targetPrice / (token?.currentPrice || 1) * 100)} 
                            className="h-2" 
                            indicatorClassName={bet.direction === 'up' ? 'bg-green-400' : 'bg-red-400'}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Comments */}
              <TokenComments tokenId={token.id} tokenName={token.name} />
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default TokenDetail;
