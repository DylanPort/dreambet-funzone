import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchBetsByToken, acceptBet } from '@/api/mockData';
import { Bet, BetStatus } from '@/types/bet';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink, ChevronLeft, BarChart3, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const TokenChart = ({
  tokenId,
  tokenName,
  refreshData,
  loading,
  onPriceUpdate
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
        <div className="relative overflow-hidden group transition-all duration-500
          transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer"
          onClick={() => refreshData('up')}>
          
          <img 
            src="/lovable-uploads/5fbe719e-2eae-4c8e-ade1-fb21115ea119.png" 
            alt="Bet to Moon" 
            className="w-full h-auto filter drop-shadow-[0_0_30px_rgba(22,163,74,0.7)]
            transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(22,163,74,0.9)]"
          />
          
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-400/10 to-green-500/10 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
            text-xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent
            drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
            Bet to Moon
            <ArrowUp className="ml-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
        
        <div className="relative overflow-hidden group transition-all duration-500
          transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer"
          onClick={() => refreshData('down')}>
          
          <img 
            src="/lovable-uploads/c97a2ff8-a872-40d8-9b65-59831498a464.png" 
            alt="Bet to Die" 
            className="w-full h-auto filter drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]
            transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(239,68,68,0.9)]"
          />
          
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-400/10 to-red-500/10 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
            text-xl font-bold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent
            drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
            Bet to Die
            <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-[2px] transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
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
          setToken({
            id: id,
            name: "New Token",
            symbol: "",
            logo: '🪙',
            currentPrice: 0,
            change24h: 0,
            migrationTime: new Date().getTime()
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
              price: 0
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
  }, [id, pumpPortal, toast, updateTokenMetrics]);
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
          A {newActiveBet.amount} SOL bet that this token will {newActiveBet.prediction} is now active!
        </p>
      </div>;
  };
  const {
    userProfile,
    bets: userPXBBets,
    fetchUserBets,
    isLoading
  } = usePXBPoints();
  const [lastCreatedBet, setLastCreatedBet] = useState(null);
  useEffect(() => {
    if (userProfile && userPXBBets && userPXBBets.length > 0 && id) {
      const tokenBets = userPXBBets.filter(bet => bet.tokenMint === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (tokenBets.length > 0) {
        setLastCreatedBet(tokenBets[0]);
      }
    }
  }, [userProfile, userPXBBets, id]);
  const renderYourLastBet = () => {
    if (!lastCreatedBet) {
      return <div className="text-center py-8 text-dream-foreground/70">
          You haven't placed any bets on this token yet.
        </div>;
    }
    const betForCard: Bet = {
      id: lastCreatedBet.id,
      tokenId: lastCreatedBet.tokenMint,
      tokenName: lastCreatedBet.tokenName,
      tokenSymbol: lastCreatedBet.tokenSymbol,
      initiator: userProfile?.id || '',
      amount: lastCreatedBet.betAmount,
      prediction: lastCreatedBet.betType === 'up' ? 'migrate' : 'die',
      timestamp: new Date(lastCreatedBet.createdAt).getTime(),
      expiresAt: new Date(lastCreatedBet.expiresAt).getTime(),
      status: lastCreatedBet.status as BetStatus,
      duration: 30,
      onChainBetId: '',
      transactionSignature: ''
    };
    return <div className="mb-4">
        <BetCard key={betForCard.id} bet={betForCard} connected={connected} publicKeyString={publicKey ? publicKey.toString() : null} onAcceptBet={() => {}} />
      </div>;
  };
  const ActiveTokenTrades = ({
    tokenId
  }: {
    tokenId: string;
  }) => {
    const {
      recentRawTrades
    } = usePumpPortal(tokenId);
    const tokenTrades = recentRawTrades.filter(trade => trade && trade.mint === tokenId).slice(0, 10);
    if (!tokenTrades || tokenTrades.length === 0) {
      return <div className="text-center py-8 text-dream-foreground/70">
          No recent trades for this token. Trades will appear here when they happen.
        </div>;
    }
    return <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Type</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">Amount</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">Price</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-dream-foreground/70">SOL</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Trader</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-dream-foreground/70">Time</th>
            </tr>
          </thead>
          <tbody>
            {tokenTrades.map((trade, index) => {
            try {
              const formattedTrade = formatRawTrade(trade);
              return <tr key={`${trade.signature}-${index}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center">
                        {trade.txType === 'buy' ? <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" /> : <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />}
                        <span className={trade.txType === 'buy' ? 'text-green-500' : 'text-red-500'}>
                          {trade.txType.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.amount}</td>
                    <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.price}</td>
                    <td className="py-2 px-3 text-right font-mono text-sm">{formattedTrade.solAmount}</td>
                    <td className="py-2 px-3 text-sm">
                      <a href={`https://solscan.io/account/${trade.traderPublicKey}`} target="_blank" rel="noopener noreferrer" className="hover:text-dream-accent2 transition-colors">
                        {formattedTrade.trader}
                      </a>
                    </td>
                    <td className="py-2 px-3 text-sm text-dream-foreground/70">
                      {trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>;
            } catch (error) {
              console.error("Error rendering trade:", error, trade);
              return null;
            }
          })}
          </tbody>
        </table>
      </div>;
  };
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {(loading && !token) ? (
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center text-3xl border border-white/1
