
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowUp, ArrowDown, Clock, ArrowLeft, Zap, Activity, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchUserBets } from '@/api/mockData';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Bet } from '@/types/bet';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const MyBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { connected, publicKey } = useWallet();
  const [activeBetsCount, setActiveBetsCount] = useState(0);
  const { toast } = useToast();

  const loadBets = async () => {
    try {
      setLoading(true);
      if (connected && publicKey) {
        console.log('Fetching bets for user:', publicKey.toString());
        
        // Get bets from the API
        const userBets = await fetchUserBets(publicKey.toString());
        console.log('Fetched user bets from API:', userBets);
        
        // Get locally stored bets (fallback)
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        let localBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        console.log('Retrieved local bets from storage:', localBets);
        
        // Filter local bets to only include those created by the current user
        localBets = localBets.filter(bet => bet.initiator === publicKey.toString());
        
        // Combine bets, avoiding duplicates
        const allBets = [...userBets];
        for (const localBet of localBets) {
          const exists = allBets.some(
            existingBet => existingBet.id === localBet.id || 
            (existingBet.onChainBetId && localBet.onChainBetId && existingBet.onChainBetId === localBet.onChainBetId)
          );
          
          if (!exists) {
            allBets.push(localBet);
          }
        }
        
        console.log('Combined user bets:', allBets);
        setBets(allBets);
        
        // Count active bets (open or matched)
        const activeCount = allBets.filter(bet => 
          bet.status === 'open' || bet.status === 'matched'
        ).length;
        setActiveBetsCount(activeCount);
      } else {
        setBets([]);
      }
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
    // Refresh every 30 seconds
    const interval = setInterval(loadBets, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  // Force refresh when component is visible
  useEffect(() => {
    // Set up a visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing my bets data');
        loadBets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredBets = bets.filter(bet => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return bet.status === 'open' || bet.status === 'matched';
    return bet.status === activeFilter;
  });

  const handleRefresh = () => {
    toast({
      title: "Refreshing your bets",
      description: "Fetching your latest bet data..."
    });
    loadBets();
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m left`;
  };

  const getBetStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'from-yellow-500/20 to-yellow-500/30 text-yellow-400 border-yellow-400/30';
      case 'matched': return 'from-blue-500/20 to-blue-500/30 text-blue-400 border-blue-400/30';
      case 'completed': return 'from-green-500/20 to-green-500/30 text-green-400 border-green-400/30';
      case 'expired': return 'from-red-500/20 to-red-500/30 text-red-400 border-red-400/30';
      default: return 'from-gray-500/20 to-gray-500/30 text-gray-400 border-gray-400/30';
    }
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
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold">My Bets</h1>
            
            <div className="flex items-center gap-3">
              {connected && !loading && activeBetsCount > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-dream-accent1/20 to-dream-accent2/20 px-4 py-2 rounded-full border border-dream-accent2/30 text-dream-accent2">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">{activeBetsCount} Active {activeBetsCount === 1 ? 'Bet' : 'Bets'}</span>
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full bg-dream-surface/50 text-dream-foreground/60 hover:text-dream-accent1 transition-colors"
                title="Refresh bets"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {!connected ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-xl text-dream-foreground/70 mb-4">Connect your wallet to view your bets</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-dream-foreground/70">Loading your bets...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filter tabs with animation */}
              <motion.div 
                className="flex overflow-x-auto mb-6 p-1 gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {['all', 'active', 'open', 'matched', 'completed', 'expired'].map(filter => (
                  <motion.button
                    key={filter}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-md whitespace-nowrap transition-all ${
                      activeFilter === filter
                      ? 'bg-gradient-to-r from-dream-accent1 to-dream-accent2 text-white shadow-lg shadow-dream-accent1/20'
                      : 'bg-dream-surface/50 text-dream-foreground/70 hover:bg-dream-surface'
                    }`}
                  >
                    {filter === 'active' && <Activity className="w-3.5 h-3.5 inline mr-1" />}
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </motion.button>
                ))}
              </motion.div>
              
              <AnimatePresence mode="wait">
                {filteredBets.length === 0 ? (
                  <motion.div 
                    className="glass-panel p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-dream-foreground/70">
                      {activeFilter === 'all' 
                        ? "You haven't placed any bets yet." 
                        : `You don't have any ${activeFilter} bets.`}
                    </p>
                    <Link to="/betting" className="text-dream-accent1 hover:underline mt-2 inline-block">
                      Go to the dashboard to place a bet
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {filteredBets.map((bet, index) => (
                      <motion.div 
                        key={bet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link 
                          to={`/betting/token/${bet.tokenId}`} 
                          className="block transition-all hover:scale-[1.01] relative overflow-hidden"
                        >
                          <div className={`glass-panel p-5 relative border border-white/5 ${
                            (bet.status === 'open' || bet.status === 'matched') ? 'shadow-lg shadow-dream-accent2/5' : ''
                          }`}>
                            {/* Status indicator */}
                            <div className="absolute -right-10 -top-10 w-20 h-20 rounded-full blur-3xl bg-gradient-to-br from-dream-accent1/10 to-dream-accent2/10 opacity-70"></div>
                            
                            {/* Active bet indicator */}
                            {(bet.status === 'open' || bet.status === 'matched') && (
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent"></div>
                            )}
                            
                            <div className="flex justify-between items-start mb-3 relative">
                              <div>
                                <h3 className="text-xl font-display font-semibold flex items-center gap-1.5">
                                  {bet.tokenName} 
                                  <span className="text-sm text-dream-foreground/50">({bet.tokenSymbol})</span>
                                  {(bet.status === 'open' || bet.status === 'matched') && (
                                    <Sparkles className="w-4 h-4 text-dream-accent2 ml-1 animate-pulse" />
                                  )}
                                </h3>
                                <div className="flex items-center text-sm mt-1">
                                  <span className={`${bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                                    {bet.prediction === 'migrate' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                    Betting {bet.prediction === 'migrate' ? 'MIGRATE' : 'DIE'}
                                  </span>
                                  <span className="mx-2 text-dream-foreground/50">•</span>
                                  <span className="font-semibold flex items-center">
                                    <Zap className="w-3 h-3 mr-1 text-dream-accent2" />
                                    {bet.amount} SOL
                                  </span>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${getBetStatusColor(bet.status)}`}>
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
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default MyBets;
