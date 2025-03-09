import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
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

const TokenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<{ time: string; price: number }[]>([]);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const { toast } = useToast();
  const pumpPortal = usePumpPortalWebSocket();
  const { connected, publicKey } = useWallet();
  const [tokenMetrics, setTokenMetrics] = useState({
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
    holders: 0
  });
  
  useEffect(() => {
    const loadToken = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log("Loading token with ID:", id);
        
        // First check if the token exists in the PumpPortal service
        let tokenData = null;
        let isWebSocketToken = false;
        
        // Check recent tokens from WebSocket
        const recentTokens = pumpPortal.recentTokens || [];
        const webSocketToken = recentTokens.find(t => t.token_mint === id);
        
        if (webSocketToken) {
          console.log("Found token in WebSocket data:", webSocketToken);
          isWebSocketToken = true;
          tokenData = {
            token_mint: webSocketToken.token_mint,
            token_name: webSocketToken.token_name,
            token_symbol: webSocketToken.token_symbol || '',
            last_trade_price: 0, // New tokens may not have a price yet
            last_updated_time: webSocketToken.created_time,
          };
        }
        
        // If not found in WebSocket, check Supabase
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
            change24h: 0, // We don't have historical data yet
            migrationTime: new Date(tokenData.last_updated_time).getTime(),
          });
          
          // Generate mock metrics for this token
          setTokenMetrics({
            marketCap: (tokenData.last_trade_price || 0.001) * 1000000 * (0.5 + Math.random()),
            volume24h: (tokenData.last_trade_price || 0.001) * 50000 * (0.5 + Math.random()),
            liquidity: (tokenData.last_trade_price || 0.001) * 20000 * (0.5 + Math.random()),
            holders: Math.floor(100 + Math.random() * 900)
          });
          
          // Subscribe to real-time trades for this token
          if (pumpPortal.connected) {
            pumpPortal.subscribeToToken(id);
          }
          
          // Create some initial price data
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
          
          // Load bets for this token
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
          
          // Generate mock metrics for this token
          setTokenMetrics({
            marketCap: 10000 * (0.5 + Math.random()),
            volume24h: 5000 * (0.5 + Math.random()),
            liquidity: 2000 * (0.5 + Math.random()),
            holders: Math.floor(50 + Math.random() * 150)
          });
          
          // Subscribe to real-time trades for this token
          if (pumpPortal.connected) {
            pumpPortal.subscribeToToken(id);
          }
          
          // Create some initial price data
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
          
          // Still try to load bets
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
        
        setToken(current => {
          if (!current) return null;
          
          const priceChange = current.currentPrice > 0 
            ? ((latestPrice - current.currentPrice) / current.currentPrice) * 100 
            : 0;
            
          return {
            ...current,
            currentPrice: latestPrice,
            change24h: priceChange
          };
        });
        
        setPriceData(current => {
          const newPoint = {
            time: new Date().toISOString(),
            price: latestPrice
          };
          
          return [...current, newPoint].slice(-60);
        });
        
        setTokenMetrics(current => {
          return {
            ...current,
            marketCap: latestPrice * 1000000 * (0.5 + Math.random()),
            volume24h: current.volume24h + (latestPrice * 1000 * Math.random())
          };
        });
        
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
  }, [id, pumpPortal.recentTrades, toast]);
  
  const refreshData = async () => {
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
      
      const tokenBets = await fetchBetsByToken(id);
      setBets(tokenBets);
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
  };

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
      await acceptBet(bet.id, publicKey.toString());
      toast({
        title: "Bet accepted!",
        description: `You've successfully accepted the bet on ${bet.tokenSymbol}`,
      });
      await refreshData();
    } catch (error) {
      console.error("Error accepting bet:", error);
      toast({
        title: "Failed to accept bet",
        description: "There was an error accepting the bet",
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

  const formatLargeNumber = (num: number) => {
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
          {loading ? (
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-panel p-4">
                  <div className="flex items-center text-dream-foreground/70 mb-1">
                    <BarChart3 size={16} className="mr-2" />
                    <span className="text-sm">Market Cap</span>
                  </div>
                  <div className="text-xl font-bold">{formatLargeNumber(tokenMetrics.marketCap)}</div>
                </div>
                
                <div className="glass-panel p-4">
                  <div className="flex items-center text-dream-foreground/70 mb-1">
                    <RefreshCw size={16} className="mr-2" />
                    <span className="text-sm">24h Volume</span>
                  </div>
                  <div className="text-xl font-bold">{formatLargeNumber(tokenMetrics.volume24h)}</div>
                </div>
                
                <div className="glass-panel p-4">
                  <div className="flex items-center text-dream-foreground/70 mb-1">
                    <DollarSign size={16} className="mr-2" />
                    <span className="text-sm">Liquidity</span>
                  </div>
                  <div className="text-xl font-bold">{formatLargeNumber(tokenMetrics.liquidity)}</div>
                </div>
                
                <div className="glass-panel p-4">
                  <div className="flex items-center text-dream-foreground/70 mb-1">
                    <Users size={16} className="mr-2" />
                    <span className="text-sm">Holders</span>
                  </div>
                  <div className="text-xl font-bold">{tokenMetrics.holders}</div>
                </div>
              </div>
              
              <div className="glass-panel p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-display font-bold">Price Chart</h2>
                  <button 
                    onClick={refreshData}
                    className="text-dream-foreground/70 hover:text-dream-foreground flex items-center text-sm"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                
                <PriceChart data={priceData} isLoading={loading} />
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setShowCreateBet(true)}
                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Bet to Migrate
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => setShowCreateBet(true)}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Bet to Die
                  </Button>
                </div>
              </div>
              
              {

