
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets } from '@/services/betService';
import { Bet } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowUp, ArrowDown, Clock, ExternalLink, Filter, RefreshCw } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BetCard from './BetCard';
import { acceptPointsBet } from '@/services/betService';

const OpenBetsList = () => {
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const [filter, setFilter] = useState('all');
  
  // Fetch open bets using React Query
  const { data: bets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['openBets'],
    queryFn: fetchOpenBets,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const filteredBets = bets.filter(bet => {
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

  const handleAcceptBet = async (bet: Bet) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept bets",
        variant: "destructive"
      });
      return;
    }

    try {
      await acceptPointsBet(bet.id);
      refetch(); // Refresh the list after accepting
    } catch (error) {
      console.error("Error accepting bet:", error);
      toast({
        title: "Error accepting bet",
        description: "There was a problem accepting this bet. Please try again.",
        variant: "destructive"
      });
    }
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
          <img 
            src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
            alt="Crown" 
            className="h-6 w-6"
          />
          <span>ACTIVE BETS</span>
          <span className="text-sm bg-dream-accent2/20 px-2 py-0.5 rounded-full text-dream-accent2">
            {filteredBets.length}
          </span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-dream-accent1/20 text-dream-accent1 border border-dream-accent1/30' 
                  : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('migrate')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'migrate' 
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                  : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
              }`}
            >
              <ArrowUp className="w-3 h-3 inline mr-1" />
              Migrate
            </button>
            <button
              onClick={() => setFilter('die')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'die' 
                  ? 'bg-red-500/20 text-red-400 border border-red-400/30' 
                  : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
              }`}
            >
              <ArrowDown className="w-3 h-3 inline mr-1" />
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
        <div className="space-y-4">
          <AnimatePresence>
            {filteredBets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BetCard
                  bet={bet}
                  connected={connected}
                  publicKeyString={publicKey?.toString() || null}
                  onAcceptBet={handleAcceptBet}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default OpenBetsList;
