import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchBetsByToken } from '@/api/mockData';
import { Bet } from '@/types/bet';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink } from 'lucide-react';
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
  
  useEffect(() => {
    const loadToken = async () => {
      if (!tokenId) return;
      
      try {
        setLoading(true);
        const tokenData = await fetchTokenById(tokenId);
        
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
  }, [tokenId, toast, pumpPortal.connected]);
  
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
        
        // Show toast for significant price changes (>5%)
        const lastPrice = priceData[priceData.length - 1]?.price || 0;
        if (lastPrice > 0) {
          const percentChange = ((latestPrice - lastPrice) / lastPrice) * 100;
          if (Math.abs(percentChange) > 5) {
            toast({
              title: `Price ${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(1)}%`,
              description: `${token?.symbol || 'Token'} is now $${latestPrice.toFixed(6)}`,
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
        
        // Refresh bets
        const tokenBets = await fetchBetsByToken(tokenId);
        setBets(tokenBets);
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
                  <div className="text-3xl font-bold">${token.currentPrice.toFixed(6)}</div>
                  <div className={`flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change24h >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                    {Math.abs(token.change24h).toFixed(2)}%
                  </div>
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
