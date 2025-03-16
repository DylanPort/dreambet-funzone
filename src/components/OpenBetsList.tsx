
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowUp, ArrowDown, Wallet, Clock, ExternalLink, Filter, RefreshCw } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

const OpenBetsList = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [filter, setFilter] = useState('all');
  const [localBets, setLocalBets] = useState<Bet[]>([]);
  const { bets: pxbBets } = usePXBPoints(); // Get PXB bets from context
  
  // Fetch open bets from Supabase with debug info
  const { data: supabaseBets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['openBets'],
    queryFn: async () => {
      console.log('Fetching open bets from Supabase...');
      try {
        const bets = await fetchOpenBets();
        console.log('OpenBetsList - Fetched bets:', bets);
        return bets;
      } catch (err) {
        console.error('Error fetching open bets:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Add debug console logs
  useEffect(() => {
    console.log('OpenBetsList - Component state:', {
      connected,
      publicKeyExists: !!publicKey,
      publicKeyValue: publicKey?.toString(),
      supabaseBetsCount: supabaseBets?.length || 0,
      pxbBetsCount: pxbBets?.length || 0,
      localBetsCount: localBets?.length || 0,
      filterValue: filter
    });
  }, [connected, publicKey, supabaseBets, pxbBets, localBets, filter]);
  
  // Combine Supabase bets with local fallback bets
  useEffect(() => {
    try {
      const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
      let fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
      
      // Filter out expired bets
      const now = Date.now();
      fallbackBets = fallbackBets.filter(bet => bet.expiresAt > now && bet.status === 'open');
      
      // Convert PXB bets to regular Bet format if they exist
      const convertedPXBBets: Bet[] = pxbBets.filter(pb => pb.status === 'pending').map(pb => ({
        id: pb.id,
        tokenId: pb.tokenMint,
        tokenName: pb.tokenName,
        tokenSymbol: pb.tokenSymbol,
        initiator: publicKey?.toString() || '',
        amount: pb.betAmount,
        prediction: pb.betType === 'up' ? 'migrate' : 'die',
        timestamp: new Date(pb.createdAt).getTime(),
        expiresAt: new Date(pb.expiresAt).getTime(),
        status: 'open',
        duration: 30, // Default duration in minutes
        // Add the required properties with default values
        onChainBetId: '',
        transactionSignature: ''
      }));
      
      // Only add fallback bets and PXB bets that don't exist in supabaseBets
      const combinedBets = [...fallbackBets, ...convertedPXBBets].filter(localBet => {
        return !supabaseBets.some(
          bet => bet.id === localBet.id || 
          (bet.onChainBetId && localBet.onChainBetId && bet.onChainBetId === localBet.onChainBetId)
        );
      });
      
      setLocalBets(combinedBets);
      console.log('Combined local bets with Supabase bets:', {
        supabaseBets,
        fallbackBets,
        pxbBets,
        convertedPXBBets,
        combinedLocalBets: combinedBets
      });
    } catch (error) {
      console.error('Error loading local bets:', error);
      setLocalBets([]);
    }
  }, [supabaseBets, pxbBets, publicKey]);
  
  // Listen for new bet events
  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in OpenBetsList:", event.detail);
      const { bet } = event.detail;
      
      // Add the new bet to local storage to ensure persistence
      try {
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        const fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        
        // Check if this bet already exists
        const exists = fallbackBets.some(existingBet => existingBet.id === bet.id);
        
        if (!exists) {
          fallbackBets.push(bet);
          localStorage.setItem('pumpxbounty_fallback_bets', JSON.stringify(fallbackBets));
          
          // Update the local state
          setLocalBets(prev => {
            const exists = prev.some(existingBet => existingBet.id === bet.id);
            if (!exists) {
              return [bet, ...prev];
            }
            return prev;
          });
          
          console.log('Added new bet to local storage:', bet);
          toast({
            title: "New bet created",
            description: `Your ${bet.prediction} bet for ${bet.amount} SOL on ${bet.tokenSymbol} has been stored locally`
          });
        }
      } catch (error) {
        console.error('Error storing new bet in local storage:', error);
      }
    };
    
    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
    };
  }, [toast]);
  
  // All bets to display (Supabase + local)
  const allBets = [...supabaseBets, ...localBets];
  
  const filteredBets = allBets.filter(bet => {
    if (filter === 'all') return true;
    return filter === bet.prediction;
  });

  const handleRefresh = () => {
    toast({
      title: "Refreshing open bets",
      description: "Fetching the latest open bets..."
    });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
            <img 
              src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
              alt="Crown" 
              className="h-6 w-6"
            />
            <span>ACTIVE BETS</span>
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm bg-dream-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent1/30">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-dream-accent1" />
              <span className="font-medium">Filter</span>
            </div>
            
            <div className="flex items-center text-sm bg-dream-background/30 backdrop-blur-sm px-3 py-1 rounded-full border border-dream-accent2/20">
              <Zap className="w-4 h-4 text-dream-accent2" />
              <span>Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-8 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error in OpenBetsList:', error);
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load open bets</p>
        <p className="text-dream-foreground/60 text-sm">
          There was an error fetching the open bets. Please try again later.
        </p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-dream-accent1/20 border border-dream-accent1/30 text-dream-accent1 rounded-md flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <span>ACTIVE BETS</span>
          <span className="bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {filteredBets.length}
          </span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center bg-black/40 rounded-full overflow-hidden p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1 text-sm rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-dream-foreground/60'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('migrate')}
              className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'migrate' 
                  ? 'bg-green-700 text-white' 
                  : 'text-dream-foreground/60'
              }`}
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              Migrate
            </button>
            <button
              onClick={() => setFilter('die')}
              className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'die' 
                  ? 'bg-cyan-700 text-white' 
                  : 'text-dream-foreground/60'
              }`}
            >
              <ArrowDown className="w-3 h-3 mr-1" />
              Die
            </button>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full bg-dream-background/30 text-dream-foreground/60 hover:text-dream-foreground transition-colors"
            title="Refresh bets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredBets.length === 0 ? (
        <div className="glass-panel p-6 text-center">
          <p className="text-dream-foreground/80 mb-2">No open bets available</p>
          <p className="text-dream-foreground/60 text-sm">
            Be the first to create a bet on a token migration!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredBets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link 
                  to={`/token/${bet.tokenId}`}
                  className="block w-full"
                >
                  <div className="bg-black/40 rounded-md p-4 hover:bg-black/50 transition-colors group">
                    <div className="flex items-center gap-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-700 rounded-full w-12 h-12 flex items-center justify-center text-xl">
                          {bet.tokenSymbol.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-medium text-white">{bet.tokenName} <ExternalLink className="w-3.5 h-3.5 inline text-gray-400" /></h3>
                          </div>
                          <p className="text-gray-400">{bet.tokenSymbol}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {bet.prediction === 'migrate' ? (
                          <div className="bg-green-700 text-white rounded-md px-4 py-2">
                            <ArrowUp className="w-4 h-4 inline mr-1" /> Moon
                          </div>
                        ) : (
                          <div className="bg-cyan-700 text-white rounded-md px-4 py-2">
                            <ArrowDown className="w-4 h-4 inline mr-1" /> Die
                          </div>
                        )}
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
  );
};

export default OpenBetsList;
