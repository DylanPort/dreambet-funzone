import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fetchMigratingTokens, fetchBetsByToken } from '@/api/mockData';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import PriceChart from '@/components/PriceChart';
import CountdownTimer from '@/components/CountdownTimer';
import CreateBetForm from '@/components/CreateBetForm';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Bet } from '@/types/bet';
import { useToast } from '@/hooks/use-toast';

const TokenBetting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<any>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();
  const { toast } = useToast();

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

  const handleBetCreated = async () => {
    if (id) {
      const tokenBets = await fetchBetsByToken(id);
      setBets(tokenBets);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <Navbar />
        <div className="pt-24 min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-display font-bold mb-4">Token Not Found</h1>
          <p className="mb-6 text-dream-foreground/70">The token you're looking for doesn't exist or has been removed.</p>
          <Link to="/betting">
            <Button>Back to Betting Dashboard</Button>
          </Link>
        </div>
      </>
    );
  }

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
    return diffMins < 60; // Less than 1 hour
  };

  const countdownEndTime = new Date(token.migrationTime + 60 * 60 * 1000);

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
            
            <div className="h-64">
              <PriceChart />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {isBettingOpen() ? (
              <CreateBetForm 
                tokenId={token.id}
                tokenName={token.name}
                tokenSymbol={token.symbol}
                onBetCreated={handleBetCreated}
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
