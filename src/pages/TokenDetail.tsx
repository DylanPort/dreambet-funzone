
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
  const { tokenId } = useParams<{ tokenId: string }>();
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
      if (!tokenId) return;
      
      try {
        setLoading(true);
        
        // First check if the token exists in the PumpPortal service
        let tokenData = null;
        let isWebSocketToken = false;
        
        // Check recent tokens from WebSocket
        const recentTokens = pumpPortal.recentTokens || [];
        const webSocketToken = recentTokens.find(t => t.token_mint === tokenId);
        
        if (webSocketToken) {
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
          const supabaseTokenData = await fetchTokenById(tokenId);
          if (supabaseTokenData) {
            tokenData = supabaseTokenData;
          }
        }
        
        if (tokenData) {
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
            pumpPortal.subscribeToToken(tokenId);
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
          const tokenBets = await fetchBetsByToken(tokenId);
          setBets(tokenBets);
        } else if (tokenId) {
          // If we can't find the token in either source but have an ID,
          // create a minimal placeholder for a very new token
          setToken({
            id: tokenId,
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
            pumpPortal.subscribeToToken(tokenId);
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
          const tokenBets = await fetchBetsByToken(tokenId);
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
  }, [tokenId, toast, pumpPortal.connected, pumpPortal.recentTokens]);
  
  // Handle real-time trade updates
  useEffect(() => {
    if (tokenId && pumpPortal.recentTrades[tokenId]) {
      const trades = pumpPortal.recentTrades[tokenId];
      
      // Update current price if we have trades
      if (trades.length > 0) {
        const latestPrice = getLatestPriceFromTrades(trades);
        
        // Update token price
        setToken(current => {
          if (!current) return null;
          
          // Calculate price change
          const priceChange = current.currentPrice > 0 
            ? ((latestPrice - current.currentPrice) / current.currentPrice) * 100 
            : 0;
            
          return {
            ...current,
            currentPrice: latestPrice,
            change24h: priceChange
          };
        });
        
        // Add new price data point
        setPriceData(current => {
          const newPoint = {
            time: new Date().toISOString(),
            price: latestPrice
          };
          
          // Keep only the last 60 points
          return [...current, newPoint].slice(-60);
        });
        
        // Update metrics based on new price
        setTokenMetrics(current => {
          return {
            ...current,
            marketCap: latestPrice * 1000000 * (0.5 + Math.random()),
            volume24h: current.volume24h + (latestPrice * 1000 * Math.random())
          };
        });
        
        // Show toast for significant price changes (>5%)
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
  }, [tokenId, pumpPortal.recentTrades, toast]);

  const refreshData = async () => {
    if (!tokenId) return;
    
    try {
      setLoading(true);
      
      // Check recent tokens from WebSocket first
      const recentTokens = pumpPortal.recentTokens || [];
      const webSocketToken = recentTokens.find(t => t.token_mint === tokenId);
      
      if (webSocketToken) {
        setToken(current => ({
          ...current,
          name: webSocketToken.token_name || current?.name || "New Token",
          symbol: webSocketToken.token_symbol || current?.symbol || "",
        }));
      } else {
        // Try Supabase as fallback
        const tokenData = await fetchTokenById(tokenId);
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
      
      // Refresh bets
      const tokenBets = await fetchBetsByToken(tokenId);
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

  // Handler for accepting a bet
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

  // Format price with appropriate decimals
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return "0.000000";
    
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Format large numbers with abbreviations (K, M, B)
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

  // Check if WebSocket connection is active
  const isLive = pumpPortal.connected && tokenId && pumpPortal.recentTrades[tokenId];
  
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
              {/* Back Button */}
              <Link to="/betting" className="flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
                <ChevronLeft size={20} />
                <span>Back to Tokens</span>
              </Link>
            
              {/* Token Header */}
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
              
              {/* Token Metrics */}
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
              
              {/* Price Chart and Trading Actions */}
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
              
              {/* Create Bet Form */}
              {showCreateBet && (
                <div className="glass-panel p-6 mb-8">
                  <h2 className="text-xl font-display font-bold mb-4">Create a Bet</h2>
                  <CreateBetForm 
                    tokenId={token.id}
                    tokenName={token.name}
                    tokenSymbol={token.symbol}
                    onBetCreated={refreshData}
                    token={token}
                    onSuccess={() => {
                      setShowCreateBet(false);
                      refreshData();
                    }}
                    onCancel={() => setShowCreateBet(false)}
                  />
                </div>
              )}
              
              {/* Open Bets */}
              <div className="glass-panel p-6 mb-8">
                <h2 className="text-xl font-display font-bold mb-4">Open Bets for {token.name}</h2>
                
                {bets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-dream-foreground/70">No open bets for this token yet.</p>
                    <p className="text-sm mt-2">Be the first to place a bet!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {bets.map(bet => (
                      <BetCard 
                        key={bet.id} 
                        bet={bet}
                        connected={connected}
                        publicKeyString={publicKey ? publicKey.toString() : null}
                        onAcceptBet={handleAcceptBet}
                        onBetAccepted={refreshData}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default TokenDetail;
