
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, ExternalLink, BarChart3, Users, DollarSign, RefreshCw } from 'lucide-react';
import { fetchMigratingTokens, fetchBetsByToken } from '@/api/mockData';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import CountdownTimer from '@/components/CountdownTimer';
import CreateBetForm from '@/components/CreateBetForm';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Bet } from '@/types/bet';
import { useToast } from '@/hooks/use-toast';
import { fetchDexScreenerData, startDexScreenerPolling } from '@/services/dexScreenerService';

const TokenBetting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();
  const { toast } = useToast();
  const [tokenMetrics, setTokenMetrics] = useState({
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
    holders: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Loading token with ID:", id);
        const tokens = await fetchMigratingTokens();
        console.log("Fetched tokens:", tokens);
        const foundToken = tokens.find(t => t.id === id);
        
        if (foundToken) {
          console.log("Found token:", foundToken);
          setToken(foundToken);
          const tokenBets = await fetchBetsByToken(id!);
          setBets(tokenBets);
          
          const dexScreenerData = await fetchDexScreenerData(id!);
          if (dexScreenerData) {
            console.log("Got DexScreener data:", dexScreenerData);
            setTokenMetrics({
              marketCap: dexScreenerData.marketCap,
              volume24h: dexScreenerData.volume24h,
              liquidity: dexScreenerData.liquidity,
              holders: Math.floor(100 + Math.random() * 900)
            });
          }
        } else {
          console.log("Token not found in migrating tokens. Redirecting to token detail page");
          navigate(`/token/${id}`);
        }
      } catch (error) {
        console.error('Error loading token data:', error);
        toast({
          title: "Error loading token",
          description: "There was a problem loading the token data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    if (id) {
      const stopPolling = startDexScreenerPolling(id, (data) => {
        if (data) {
          setTokenMetrics({
            marketCap: data.marketCap,
            volume24h: data.volume24h,
            liquidity: data.liquidity,
            holders: tokenMetrics.holders
          });
          
          if (token) {
            setToken({
              ...token,
              currentPrice: data.priceUsd,
              change24h: data.priceChange24h
            });
          }
        }
      }, 15000);
      
      return () => {
        stopPolling();
      };
    }
  }, [id, token]);

  const handleBetCreated = async () => {
    if (id) {
      const tokenBets = await fetchBetsByToken(id);
      setBets(tokenBets);
      
      toast({
        title: "On-chain bet created",
        description: "Your bet has been successfully recorded on the Solana blockchain",
      });
    }
  };

  const refreshData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const dexScreenerData = await fetchDexScreenerData(id);
      if (dexScreenerData) {
        console.log("Refreshed DexScreener data:", dexScreenerData);
        setTokenMetrics({
          marketCap: dexScreenerData.marketCap,
          volume24h: dexScreenerData.volume24h,
          liquidity: dexScreenerData.liquidity,
          holders: tokenMetrics.holders
        });
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

  const migrationTimeAgo = () => {
    const now = new Date().getTime();
    const diffMs = now - token.migrationTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m ago`;
    }
  };

  const isBettingOpen = () => {
    const now = new Date().getTime();
    const diffMs = now - token.migrationTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins < 60;
  };

  const countdownEndTime = new Date(token.migrationTime + 60 * 60 * 1000);

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

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-4xl mr-3">{token.logo}</div>
              <div>
                <h1 className="text-3xl font-display font-bold">{token.name}</h1>
                <p className="text-dream-foreground/70">{token.symbol}</p>
              </div>
            </div>
            
            <div className="glass-panel p-3">
              <div className="text-sm text-dream-foreground/70">
                Migrated {migrationTimeAgo()}
              </div>
              {isBettingOpen() ? (
                <div className="flex items-center text-dream-accent2">
                  <div className="w-2 h-2 bg-dream-accent2 rounded-full mr-2 animate-pulse"></div>
                  Betting Open
                </div>
              ) : (
                <div className="flex items-center text-dream-foreground/50">
                  <div className="w-2 h-2 bg-dream-foreground/50 rounded-full mr-2"></div>
                  Betting Closed
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent2/10 animate-gradient-move"></div>
              <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
                <BarChart3 size={20} className="mr-3 text-dream-accent1 animate-pulse-glow" />
                <span className="text-lg font-semibold">Market Cap</span>
              </div>
              <div className="text-3xl font-bold relative z-10">{formatLargeNumber(tokenMetrics.marketCap)}</div>
              <div className="absolute top-2 right-2 flex items-center">
                <a 
                  href={`https://dexscreener.com/solana/${token.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
                  title="View on DexScreener"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent1 to-dream-accent2 animate-pulse-glow" style={{ width: `${Math.min(100, (tokenMetrics.marketCap / 10000000) * 100)}%` }}></div>
            </div>
            
            <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
              <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
                <RefreshCw size={20} className="mr-3 text-dream-accent2 animate-spin-slow" />
                <span className="text-lg font-semibold">24h Volume</span>
              </div>
              <div className="text-3xl font-bold relative z-10">{formatLargeNumber(tokenMetrics.volume24h)}</div>
              <div className="absolute top-2 right-2 flex items-center">
                <a 
                  href={`https://dexscreener.com/solana/${token.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
                  title="View on DexScreener"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent2 to-dream-accent3 animate-pulse-glow" style={{ width: `${Math.min(100, (tokenMetrics.volume24h / 1000000) * 100)}%` }}></div>
            </div>
            
            <div className="glass-panel p-6 relative overflow-hidden transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-dream-accent3/10 to-dream-accent1/10 animate-gradient-move"></div>
              <div className="flex items-center text-dream-foreground/70 mb-2 relative z-10">
                <Users size={20} className="mr-3 text-dream-accent3" />
                <span className="text-lg font-semibold">Active Bets</span>
              </div>
              <div className="text-3xl font-bold relative z-10">{bets.length}</div>
              <div className="absolute top-2 right-2 flex items-center">
                <button 
                  onClick={refreshData}
                  className="text-dream-accent2 hover:text-dream-accent2/80 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-dream-accent3 to-dream-accent1 animate-pulse-glow" style={{ width: `${Math.min(100, (bets.length / 10) * 100)}%` }}></div>
            </div>
          </div>
          
          <div className="glass-panel p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <div className="text-sm text-dream-foreground/70 mb-1">Current Price</div>
                <div className="text-3xl font-bold">${token.currentPrice.toFixed(6)}</div>
                <div className={`flex items-center text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(token.change24h).toFixed(1)}% (24h)
                </div>
              </div>
              
              {isBettingOpen() && (
                <div className="mt-4 md:mt-0">
                  <div className="text-sm text-dream-foreground/70 mb-1">Betting closes in</div>
                  <CountdownTimer endTime={countdownEndTime} />
                </div>
              )}
            </div>
            
            <div className="w-full h-[300px] bg-black/10 rounded-lg overflow-hidden relative mb-4">
              <iframe 
                src={`https://dexscreener.com/solana/${token.id}?embed=1&theme=dark&trades=0&info=0`} 
                className="w-full h-full border-0"
                title="DexScreener Chart"
              ></iframe>
            </div>
            
            <div className="flex justify-end">
              <a 
                href={`https://dexscreener.com/solana/${token.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-dream-accent2 hover:underline inline-flex items-center text-sm"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on DexScreener
              </a>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {isBettingOpen() ? (
              <CreateBetForm 
                tokenId={token.id}
                tokenName={token.name}
                tokenSymbol={token.symbol}
                onSuccess={handleBetCreated}
              />
            ) : (
              <div className="glass-panel p-6 space-y-4">
                <h3 className="text-xl font-display font-semibold">Betting Closed</h3>
                <p className="text-dream-foreground/70">
                  The 1-hour betting window for this token has ended. Check other migrating tokens to place bets.
                </p>
                <Link to="/betting">
                  <Button className="w-full">
                    View Other Tokens
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-xl font-display font-semibold">Active Bets</h3>
              
              {bets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-dream-foreground/70">No active bets for this token yet.</p>
                  {isBettingOpen() && (
                    <p className="text-sm mt-2">Be the first to create a bet!</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {bets.map(bet => (
                    <div key={bet.id} className="border border-dream-foreground/10 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                            bet.prediction === 'migrate' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {bet.prediction === 'migrate' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          </div>
                          <span className="font-semibold">
                            {bet.amount} SOL
                          </span>
                        </div>
                        <div className="text-xs text-dream-foreground/50">
                          {bet.status === 'open' ? 'Needs Counter-Bet' : 'Matched'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-dream-foreground/70">
                        <div>
                          Initiator: {bet.initiator.slice(0, 4)}...{bet.initiator.slice(-4)}
                        </div>
                        {bet.counterParty && (
                          <div>
                            Counter: {bet.counterParty.slice(0, 4)}...{bet.counterParty.slice(-4)}
                          </div>
                        )}
                      </div>
                      
                      {bet.onChainBetId && (
                        <div className="mt-2 text-xs bg-dream-accent2/10 p-1 rounded text-dream-accent2 inline-flex items-center">
                          <span className="w-2 h-2 bg-dream-accent2 rounded-full animate-pulse mr-1"></span>
                          On-chain Bet #{bet.onChainBetId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default TokenBetting;
