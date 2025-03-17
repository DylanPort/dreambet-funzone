import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowUp, ArrowDown, Wallet, Clock, ExternalLink, Filter, RefreshCw, Users, BarChart, Trophy, XCircle, Activity, TrendingUp } from 'lucide-react';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BetCard from './BetCard';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Progress } from '@/components/ui/progress';

const OpenBetsList = () => {
  const {
    toast
  } = useToast();
  const {
    connected,
    publicKey
  } = useWallet();
  const [filter, setFilter] = useState('all');
  const [localBets, setLocalBets] = useState<Bet[]>([]);
  const {
    bets: pxbBets
  } = usePXBPoints();
  const [betCountsByToken, setBetCountsByToken] = useState<Record<string, {
    moon: number;
    dust: number;
    moonPercentage: number;
    dustPercentage: number;
    moonWins: number;
    dustWins: number;
    moonLosses: number;
    dustLosses: number;
    averageMoonMarketCap: number;
    averageDustMarketCap: number;
    totalVolume: number;
  }>>({});
  const {
    data: supabaseBets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
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
    refetchInterval: 30000
  });

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

  useEffect(() => {
    try {
      const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
      let fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
      const now = Date.now();
      fallbackBets = fallbackBets.filter(bet => bet.expiresAt > now && bet.status === 'open');
      const pxbFallbackBets: Bet[] = pxbBets.filter(pb => pb.status === 'pending').map(pb => ({
        id: pb.id,
        tokenId: pb.tokenMint,
        tokenName: pb.tokenName,
        tokenSymbol: pb.tokenSymbol,
        tokenMint: pb.tokenMint,
        initiator: publicKey?.toString() || '',
        amount: pb.betAmount,
        prediction: pb.betType === 'up' ? 'migrate' : 'die',
        timestamp: new Date(pb.createdAt).getTime(),
        expiresAt: new Date(pb.expiresAt).getTime(),
        status: 'open' as BetStatus,
        duration: 30,
        onChainBetId: '',
        transactionSignature: ''
      }));
      const combinedBets = [...fallbackBets, ...pxbFallbackBets].filter(localBet => {
        return !supabaseBets.some(bet => bet.id === localBet.id || bet.onChainBetId && localBet.onChainBetId && bet.onChainBetId === localBet.onChainBetId);
      });
      setLocalBets(combinedBets);
      console.log('Combined local bets with Supabase bets:', {
        supabaseBets,
        fallbackBets,
        pxbBets,
        pxbFallbackBets,
        combinedLocalBets: combinedBets
      });
    } catch (error) {
      console.error('Error loading local bets:', error);
      setLocalBets([]);
    }
  }, [supabaseBets, pxbBets, publicKey]);

  useEffect(() => {
    const allBets = [...supabaseBets, ...localBets];
    const counts: Record<string, {
      moon: number;
      dust: number;
      moonPercentage: number;
      dustPercentage: number;
      moonWins: number;
      dustWins: number;
      moonLosses: number;
      dustLosses: number;
      averageMoonMarketCap: number;
      averageDustMarketCap: number;
      totalVolume: number;
    }> = {};
    allBets.forEach(bet => {
      if (!counts[bet.tokenId]) {
        counts[bet.tokenId] = {
          moon: 0,
          dust: 0,
          moonPercentage: 0,
          dustPercentage: 0,
          moonWins: 0,
          dustWins: 0,
          moonLosses: 0,
          dustLosses: 0,
          averageMoonMarketCap: 0,
          averageDustMarketCap: 0,
          totalVolume: 0
        };
      }
      counts[bet.tokenId].totalVolume += bet.amount;
      if (bet.prediction === 'migrate') {
        counts[bet.tokenId].moon += 1;
        if (bet.initialMarketCap) {
          const currentTotal = counts[bet.tokenId].averageMoonMarketCap * (counts[bet.tokenId].moon - 1);
          const newTotal = currentTotal + bet.initialMarketCap;
          counts[bet.tokenId].averageMoonMarketCap = newTotal / counts[bet.tokenId].moon;
        }
        if (bet.status === 'completed') {
          if (bet.winner === bet.initiator) {
            counts[bet.tokenId].moonWins += 1;
          } else {
            counts[bet.tokenId].moonLosses += 1;
          }
        }
      } else if (bet.prediction === 'die') {
        counts[bet.tokenId].dust += 1;
        if (bet.initialMarketCap) {
          const currentTotal = counts[bet.tokenId].averageDustMarketCap * (counts[bet.tokenId].dust - 1);
          const newTotal = currentTotal + bet.initialMarketCap;
          counts[bet.tokenId].averageDustMarketCap = newTotal / counts[bet.tokenId].dust;
        }
        if (bet.status === 'completed') {
          if (bet.winner === bet.initiator) {
            counts[bet.tokenId].dustWins += 1;
          } else {
            counts[bet.tokenId].dustLosses += 1;
          }
        }
      }
    });
    Object.keys(counts).forEach(tokenId => {
      const total = counts[tokenId].moon + counts[tokenId].dust;
      if (total > 0) {
        counts[tokenId].moonPercentage = Math.round(counts[tokenId].moon / total * 100);
        counts[tokenId].dustPercentage = Math.round(counts[tokenId].dust / total * 100);
      }
    });
    console.log('Calculated bet counts and percentages by token:', counts);
    setBetCountsByToken(counts);
  }, [supabaseBets, localBets]);

  useEffect(() => {
    const handleNewBet = (event: CustomEvent) => {
      console.log("New bet created event received in OpenBetsList:", event.detail);
      const {
        bet
      } = event.detail;
      try {
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        const fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        const exists = fallbackBets.some(existingBet => existingBet.id === bet.id);
        if (!exists) {
          fallbackBets.push(bet);
          localStorage.setItem('pumpxbounty_fallback_bets', JSON.stringify(fallbackBets));
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

  const formatMarketCap = (marketCap: number) => {
    if (!marketCap || isNaN(marketCap)) return 'N/A';
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(2)}K`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return "No data";
    return `${Math.round(wins / total * 100)}%`;
  };

  if (isLoading) {
    return <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
            <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-6 w-6" />
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
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-panel p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-700/50 rounded mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-8 bg-gray-700/50 rounded"></div>
            </div>)}
        </div>
      </div>;
  }

  if (error) {
    console.error('Error in OpenBetsList:', error);
    return <div className="glass-panel p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load open bets</p>
        <p className="text-dream-foreground/60 text-sm">
          There was an error fetching the open bets. Please try again later.
        </p>
        <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-dream-accent1/20 border border-dream-accent1/30 text-dream-accent1 rounded-md flex items-center mx-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>;
  }

  return <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold text-dream-foreground flex items-center gap-2">
          <img src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" alt="Crown" className="h-6 w-6" />
          <span>ACTIVE BETS</span>
          <span className="text-sm bg-dream-accent2/20 px-2 py-0.5 rounded-full text-dream-accent2">
            {filteredBets.length}
          </span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-dream-accent1/20 text-dream-accent1 border border-dream-accent1/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
              All
            </button>
            <button onClick={() => setFilter('migrate')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'migrate' ? 'bg-green-500/20 text-green-400 border border-green-400/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
              <ArrowUp className="w-3 h-3 inline mr-1" />
              Moon
            </button>
            <button onClick={() => setFilter('die')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'die' ? 'bg-red-500/20 text-red-400 border border-red-400/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
              <ArrowDown className="w-3 h-3 inline mr-1" />
              Dust
            </button>
          </div>
          
          <button onClick={handleRefresh} className="p-2 rounded-full bg-dream-background/30 text-dream-foreground/60 hover:text-dream-foreground transition-colors" title="Refresh bets">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredBets.length === 0 ? <div className="glass-panel p-6 text-center">
          <p className="text-dream-foreground/80 mb-2">No open bets available</p>
          <p className="text-dream-foreground/60 text-sm">
            Be the first to create a bet on a token migration!
          </p>
        </div> : <div className="space-y-4">
          <AnimatePresence>
            {filteredBets.map(bet => <motion.div key={bet.id} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} transition={{
          duration: 0.3
        }}>
                <Link to={`/token/${bet.tokenId}`} className="block w-full">
                  <div className="glass-panel p-4 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 via-[#2a203e]/10 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:via-[#2a203e]/20 group-hover:to-dream-accent3/10 transition-all duration-500 animate-pulse-slow">
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                            </pattern>
                          </defs>
                          <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
                    
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                          <span className="font-display font-bold text-lg">{bet.tokenSymbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-display font-semibold text-lg">{bet.tokenName}</h3>
                            <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
                          </div>
                          <p className="text-dream-foreground/60 text-sm">{bet.tokenSymbol}</p>
                        </div>
                      </div>
                      
                      
                      
                      
                      
                      <div className="flex items-center gap-1 text-sm text-dream-foreground/60">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTimeRemaining(bet.expiresAt)}</span>
                      </div>
                      
                      {betCountsByToken[bet.tokenId] && <div className="flex flex-col w-[280px] space-y-2 bg-black/20 p-3 rounded-lg border border-white/5">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-dream-foreground/70">Collective Betting Stats</span>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-dream-accent2" />
                              <span className="text-dream-accent2 font-medium">
                                {betCountsByToken[bet.tokenId].moon + betCountsByToken[bet.tokenId].dust} bets
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <ArrowUp className="h-3 w-3 text-green-400" />
                              <span className="font-semibold text-green-400">
                                Moon ({betCountsByToken[bet.tokenId].moon})
                              </span>
                            </div>
                            <span className="font-bold text-dream-accent2">
                              {betCountsByToken[bet.tokenId].moonPercentage}%
                            </span>
                          </div>
                          
                          <div className="relative">
                            <Progress value={betCountsByToken[bet.tokenId].moonPercentage} className="h-1.5 w-full bg-black/30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <ArrowDown className="h-3 w-3 text-red-400" />
                              <span className="font-semibold text-red-400">
                                Dust ({betCountsByToken[bet.tokenId].dust})
                              </span>
                            </div>
                            <span className="font-bold text-dream-accent1">
                              {betCountsByToken[bet.tokenId].dustPercentage}%
                            </span>
                          </div>
                          
                          <div className="relative">
                            <Progress value={betCountsByToken[bet.tokenId].dustPercentage} className="h-1.5 w-full bg-black/30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
                          </div>
                          
                          <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-dream-foreground/50">Total Volume</span>
                              <span className="text-xs font-bold text-dream-accent2">
                                {betCountsByToken[bet.tokenId].totalVolume.toFixed(2)} PXB
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[10px] text-dream-foreground/50">Win Rate</span>
                              <div className="flex justify-between text-xs">
                                <div className="flex items-center gap-1 mr-2">
                                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                  <span className="text-green-400">
                                    {calculateWinRate(betCountsByToken[bet.tokenId].moonWins, betCountsByToken[bet.tokenId].moonLosses)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-red-400"></div>
                                  <span className="text-red-400">
                                    {calculateWinRate(betCountsByToken[bet.tokenId].dustWins, betCountsByToken[bet.tokenId].dustLosses)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex flex-col">
                              <span className="text-dream-foreground/50">Moon MCAP</span>
                              <span className="text-green-400 font-medium">
                                {formatMarketCap(betCountsByToken[bet.tokenId].averageMoonMarketCap)}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-dream-foreground/50">Dust MCAP</span>
                              <span className="text-red-400 font-medium">
                                {formatMarketCap(betCountsByToken[bet.tokenId].averageDustMarketCap)}
                              </span>
                            </div>
                          </div>
                        </div>}
                    </div>
                  </div>
                </Link>
              </motion.div>)}
          </AnimatePresence>
        </div>}
    </div>;
};

export default OpenBetsList;
