
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUp, ArrowDown, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchUserBets } from '@/api/mockData';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Bet } from '@/types/bet';

const MyBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    const loadBets = async () => {
      try {
        if (connected && publicKey) {
          const userBets = await fetchUserBets(publicKey.toString());
          setBets(userBets);
        }
      } catch (error) {
        console.error('Error loading bets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBets();
  }, [connected, publicKey]);

  const filteredBets = bets.filter(bet => {
    if (activeFilter === 'all') return true;
    return bet.status === activeFilter;
  });

  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m left`;
  };

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-display font-bold mb-6">My Bets</h1>
          
          {!connected ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-xl text-dream-foreground/70 mb-4">Connect your wallet to view your bets</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex overflow-x-auto mb-6 p-1 gap-2">
                {['all', 'open', 'matched', 'completed', 'expired'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                      activeFilter === filter
                      ? 'bg-dream-accent1 text-white'
                      : 'bg-dream-surface/50 text-dream-foreground/70 hover:bg-dream-surface'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              
              {filteredBets.length === 0 ? (
                <div className="glass-panel p-8 text-center">
                  <p className="text-dream-foreground/70">
                    {activeFilter === 'all' 
                      ? "You haven't placed any bets yet." 
                      : `You don't have any ${activeFilter} bets.`}
                  </p>
                  <Link to="/betting" className="text-dream-accent1 hover:underline mt-2 inline-block">
                    Go to the dashboard to place a bet
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBets.map(bet => (
                    <Link 
                      key={bet.id} 
                      to={`/betting/token/${bet.tokenId}`} 
                      className="block transition-transform hover:scale-[1.01]"
                    >
                      <div className="glass-panel p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-display font-semibold">{bet.tokenName} ({bet.tokenSymbol})</h3>
                            <div className="flex items-center text-sm mt-1">
                              <span className={`${bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                                {bet.prediction === 'migrate' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                Betting {bet.prediction === 'migrate' ? 'MIGRATE' : 'DIE'}
                              </span>
                              <span className="mx-2 text-dream-foreground/50">•</span>
                              <span className="font-semibold">{bet.amount} SOL</span>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm ${
                            bet.status === 'open' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : bet.status === 'matched' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : bet.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                          }`}>
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-dream-foreground/70">
                            Created: {new Date(bet.timestamp).toLocaleString()}
                          </div>
                          {bet.status !== 'completed' && bet.status !== 'expired' && (
                            <div className="flex items-center text-sm text-dream-foreground/70">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimeRemaining(bet.expiresAt)}
                            </div>
                          )}
                        </div>
                        
                        {bet.counterParty && (
                          <div className="mt-3 pt-3 border-t border-dream-foreground/10">
                            <div className="text-sm text-dream-foreground/70">
                              Matched with: {bet.counterParty.slice(0, 8)}...{bet.counterParty.slice(-8)}
                            </div>
                            {bet.status === 'completed' && bet.winner && (
                              <div className={`text-sm mt-1 ${bet.winner === publicKey?.toString() ? 'text-green-400' : 'text-red-400'}`}>
                                {bet.winner === publicKey?.toString() ? 'You won this bet! 🎉' : 'You lost this bet'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default MyBets;
