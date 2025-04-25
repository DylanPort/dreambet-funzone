import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Clock, Activity, Zap, Sparkles } from 'lucide-react';
import { fetchTrendingBets } from '@/api/mockData';
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { Bet } from '@/types/bet';
import { Link } from 'react-router-dom';
import { formatTimeRemaining } from '@/utils/betUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrendingBetsListProps {
  // No props needed for now
}

const TrendingBetsList: React.FC<TrendingBetsListProps> = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBetAlert, setNewBetAlert] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const { connected, publicKey } = useWallet();
  const isMobile = useIsMobile();
  const [activeBetsCount, setActiveBetsCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadBets = async () => {
    try {
      setLoading(true);
      console.log(`Fetching trending bets`);
      const trendingBets = await fetchTrendingBets();
      console.log('Received trending bets:', trendingBets);
      setBets(trendingBets);
    } catch (error) {
      console.error('Error loading bets:', error);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
    // Refresh every 30 seconds
    const interval = setInterval(loadBets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Force refresh when component is visible
  useEffect(() => {
    // Set up a visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing bets data');
        setLastRefresh(new Date());
        loadBets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for new bet events
  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in BetsList:", event.detail);
      
      const { amount, prediction } = event.detail;
      
      setNewBetAlert({
        visible: true,
        message: `New ${amount} SOL bet created predicting token will ${prediction}!`
      });
      
      // Refresh the bets immediately when a new bet is created
      loadBets();
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setNewBetAlert({ visible: false, message: '' });
      }, 5000);
    };

    const handleBetAccepted = () => {
      // Also refresh when any bet is accepted
      loadBets();
    };

    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    window.addEventListener('betAccepted', handleBetAccepted as EventListener);
    
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
      window.removeEventListener('betAccepted', handleBetAccepted as EventListener);
    };
  }, []);

  const manualRefresh = () => {
    console.log("Refreshing bets");
    setLastRefresh(new Date());
    loadBets();
  };

  const getBetStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'matched': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl bg-dream-accent2/10 opacity-70"></div>
      <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full blur-3xl bg-dream-accent1/10 opacity-70"></div>
      
      <div className="flex justify-between items-center relative z-10">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          Trending Trades
        </h2>
        <button 
          onClick={manualRefresh}
          className="text-dream-foreground/60 hover:text-dream-foreground p-1 rounded-full transition-colors"
          title="Refresh bets"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>
      
      <AnimatePresence>
        {newBetAlert.visible && (
          <motion.div 
            className="bg-gradient-to-r from-green-500/20 to-green-400/20 border border-green-500/30 text-green-400 rounded-md p-3 flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              {newBetAlert.message}
            </p>
            <button 
              onClick={() => setNewBetAlert({ visible: false, message: '' })}
              className="text-green-400/70 hover:text-green-400 text-sm"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-dream-foreground/70 text-sm">Loading bets...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {bets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-dream-foreground/70">No trending bets found</p>
              <p className="text-sm mt-2">Start betting on trending tokens now!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {bets.map((bet, index) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link 
                      to={`/betting/token/${bet.tokenId}`} 
                      className="block transition-all duration-300 hover:scale-[1.02] relative"
                    >
                      <div className="border border-dream-foreground/10 bg-gradient-to-br from-dream-surface/80 to-dream-surface/60 backdrop-blur-md rounded-md p-4 relative overflow-hidden">
                        {/* Active bet indicator */}
                        {(bet.status === 'open' || bet.status === 'matched') && (
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent"></div>
                        )}
                        
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-display font-semibold flex items-center">
                              {bet.tokenName} 
                              <span className="text-xs text-dream-foreground/50 ml-1">({bet.tokenSymbol})</span>
                              {(bet.status === 'open' || bet.status === 'matched') && (
                                <Sparkles className="w-3.5 h-3.5 text-dream-accent2 ml-1.5 animate-pulse" />
                              )}
                            </h3>
                            <div className="flex items-center text-sm">
                              <span className={`${bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                                {bet.prediction === 'migrate' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                {bet.prediction === 'migrate' ? 'MIGRATE' : 'DIE'}
                              </span>
                              <span className="mx-2 text-dream-foreground/50">•</span>
                              <span className="flex items-center">
                                <Zap className="w-3 h-3 mr-1 text-dream-accent2" />
                                {bet.amount} SOL
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-dream-foreground/70">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeRemaining(bet.expiresAt)}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="text-dream-foreground/50">
                            {new Date(bet.timestamp).toLocaleDateString()}
                          </div>
                          <div className={`px-2 py-1 rounded-full ${getBetStatusColor(bet.status)}`}>
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendingBetsList;
