import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { fetchTokenById } from '@/services/supabaseService';
import { fetchBetsByToken, acceptBet } from '@/api/mockData';
import { Bet, BetStatus } from '@/types/bet';
import { ArrowUp, ArrowDown, RefreshCw, ExternalLink, ChevronLeft, BarChart3, Users, DollarSign, ArrowUpRight, ArrowDownRight, HelpCircle, CheckCircle, XCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import CreateBetForm from '@/components/CreateBetForm';
import BetCard from '@/components/BetCard';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
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
  return (
    <div>
      {/* Placeholder for TokenChart component */}
      {/* Implement your chart logic here */}
      <p>Token Chart for {tokenName} (ID: {tokenId})</p>
      {loading && <p>Loading chart data...</p>}
      <button onClick={refreshData}>Refresh Data</button>
      <button onClick={() => setShowCreateBet(true)}>Create Bet</button>
    </div>
  );
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
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        sonnerToast.success(`${label} copied to clipboard`);
      })
      .catch(() => {
        sonnerToast.error('Failed to copy to clipboard');
      });
  };

  useEffect(() => {
    const loadToken = async () => {
      if (!id) return;
      try {
        setLoading(true);
        console.log("Loading token with ID:", id);
        try {
          const cachedPrice = localStorage.getItem(`token_price_${id}`);
          if (cachedPrice) {
            const { price, change24h, timestamp } = JSON.parse(cachedPrice);
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
        } 
        else if (id) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <div className="container mx-auto pt-8 pb-20 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl">Loading token data...</p>
          </div>
        ) : (
          token ? (
            <>
              {/* Back Button */}
              <div className="mb-6">
                <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                  <ChevronLeft className="mr-1 h-5 w-5" />
                  Back to Tokens
                </Link>
              </div>

              {/* Token Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                <div className="flex items-center">
                  <div className="relative mr-4">
                    <div className="text-4xl">{token.logo}</div>
                    <OrbitingParticles />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold flex items-center">
                      {token.name}
                      {token.symbol && <span className="ml-2 text-gray-400">({token.symbol})</span>}
                    </h1>
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center text-sm">
                        <button 
                          onClick={() => copyToClipboard(token.id, 'Token address')}
                          className="inline-flex items-center text-gray-400 hover:text-white"
                        >
                          {token.id.substring(0, 4)}...{token.id.substring(token.id.length - 4)}
                          <Copy className="ml-1 h-3 w-3" />
                        </button>
                      </div>
                      <a 
                        href={`https://solscan.io/token/${token.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
                      >
                        View on Solscan
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold">
                    ${typeof token.currentPrice === 'number' ? token.currentPrice.toFixed(6) : '0.00'}
                  </div>
                  <div className={`flex items-center ${token.change24h > 0 ? 'text-green-500' : token.change24h < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {token.change24h > 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : 
                     token.change24h < 0 ? <ArrowDownRight className="mr-1 h-4 w-4" /> : 
                     <div className="w-4 mr-1" />}
                    {token.change24h ? `${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(2)}%` : '0.00%'} (24h)
                  </div>
                </div>
              </div>

              {/* Token Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>Market Cap</span>
                      </div>
                      <div className="text-right">
                        {tokenMetrics.marketCap ? 
                          `$${Number(tokenMetrics.marketCap).toLocaleString()}` : 
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        <span>24h Volume</span>
                      </div>
                      <div className="text-right">
                        {tokenMetrics.volume24h ? 
                          `$${Number(tokenMetrics.volume24h).toLocaleString()}` : 
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Liquidity</span>
                      </div>
                      <div className="text-right">
                        {tokenMetrics.liquidity ? 
                          `$${Number(tokenMetrics.liquidity).toLocaleString()}` : 
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Holders</span>
                      </div>
                      <div className="text-right">
                        {tokenMetrics.holders ? 
                          Number(tokenMetrics.holders).toLocaleString() : 
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Chart and Market Data */}
                <div className="md:col-span-2 space-y-8">
                  {/* Price Chart */}
                  <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                    <CardHeader className="border-b border-gray-700 p-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Price Chart</h2>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {/* Refresh chart data */}}
                          className="h-8 px-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[300px]">
                      <PriceChart data={priceData} />
                    </CardContent>
                  </Card>

                  {/* Market Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TokenMarketCap tokenId={token.id} />
                    <TokenVolume tokenId={token.id} />
                  </div>
                </div>

                {/* Bets and Comments */}
                <div className="space-y-8">
                  {/* Create New Bet */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="border-b border-gray-700 p-4">
                      <h2 className="text-xl font-semibold">Place a Bet</h2>
                    </CardHeader>
                    <CardContent className="p-6">
                      {showCreateBet ? (
                        <CreateBetForm 
                          tokenId={token.id}
                          tokenName={token.name}
                          tokenPrice={token.currentPrice}
                          onBetCreated={(bet) => {
                            setBets([bet, ...bets]);
                            setNewActiveBet(bet);
                            setShowCreateBet(false);
                          }}
                          onCancel={() => setShowCreateBet(false)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <p className="text-gray-400 mb-4 text-center">
                            Think you know where the price is heading? Create a new bet!
                          </p>
                          <Button 
                            onClick={() => setShowCreateBet(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Create New Bet
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Bets */}
                  {bets.length > 0 && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="border-b border-gray-700 p-4">
                        <h2 className="text-xl font-semibold">Active Bets</h2>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {bets.map((bet) => (
                            <BetCard 
                              key={bet.id} 
                              bet={bet}
                              isHighlighted={newActiveBet?.id === bet.id}
                              showTokenInfo={false} 
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* PXB Bets Section */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="border-b border-gray-700 p-4">
                      <h2 className="text-xl font-semibold">Community Bets</h2>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {bets.length > 0 ? bets.map((bet) => (
                          <div 
                            key={bet.id}
                            className="p-4 rounded-lg bg-gray-750 border border-gray-700 transition-all hover:border-blue-500"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className={`text-sm px-2 py-0.5 rounded ${
                                    bet.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {bet.direction === 'up' ? 'Price Up' : 'Price Down'}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    ID: <button
                                      onClick={() => copyToClipboard(bet.id, 'Bet ID')}
                                      className="hover:text-white inline-flex items-center"
                                    >
                                      {bet.id.substring(0, 6)}...{bet.id.substring(bet.id.length - 4)}
                                      <Copy className="ml-1 h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="mt-2 mb-1 font-medium">
                                  {bet.amount} PXB on {token.name}
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-400">Bettor:</span>
                                  <button
                                    onClick={() => copyToClipboard(bet.createdBy, 'Wallet address')}
                                    className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                                  >
                                    {bet.createdBy.substring(0, 4)}...{bet.createdBy.substring(bet.createdBy.length - 4)}
                                    <Copy className="ml-1 h-3 w-3" />
                                  </button>
                                </div>
                                
                                <div className="flex gap-3 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400">Entry:</span>
                                    <span>${bet.entryPrice.toFixed(6)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400">Target:</span>
                                    <span>${bet.targetPrice.toFixed(6)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                <div className={`text-sm font-medium ${
                                  bet.status === 'won' ? 'text-green-400' : 
                                  bet.status === 'lost' ? 'text-red-400' : 
                                  bet.status === 'active' ? 'text-blue-400' : 'text-gray-400'
                                }`}>
                                  {bet.status === 'won' ? (
                                    <div className="flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Won</div>
                                  ) : bet.status === 'lost' ? (
                                    <div className="flex items-center"><XCircle className="h-4 w-4 mr-1" /> Lost</div>
                                  ) : bet.status === 'active' ? (
                                    <div className="flex items-center"><div className="h-2 w-2 rounded-full bg-blue-400 mr-1" /> Active</div>
                                  ) : (
                                    bet.status.charAt(0).toUpperCase() + bet.status.slice(1)
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                                </div>
                                
                                {/* Progress */}
                                {bet.status === 'active' && (
                                  <div className="mt-4 w-full max-w-[120px]">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>${bet.entryPrice.toFixed(2)}</span>
                                      <span>${bet.targetPrice.toFixed(2)}</span>
                                    </div>
                                    <Progress 
                                      value={Math.min(100, Math.max(0, 
                                        bet.direction === 'up'
                                          ? ((token.currentPrice - bet.entryPrice) / (bet.targetPrice - bet.entryPrice)) * 100
                                          : ((bet.entryPrice - token.currentPrice) / (bet.entryPrice - bet.targetPrice)) * 100
                                      ))} 
                                      className={`h-2 ${bet.direction === 'up' ? 'bg-green-950' : 'bg-red-950'}`}
                                      indicatorClassName={bet.direction === 'up' ? 'bg-green-500' : 'bg-red-500'}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <p className="text-gray-400 text-center">No community bets for this token yet.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Community Comments */}
                  <TokenComments tokenId={token.id} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <p className="text-2xl mb-4">Token not found</p>
              <Link to="/" className="text-blue-400 hover:text-blue-300">
                Return to Home
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TokenDetail;
