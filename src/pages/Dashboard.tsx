
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Search, SlidersHorizontal, Filter, Zap, Clock, ArrowUp, ArrowDown, Wallet, ExternalLink } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenBets, fetchUserBets } from '@/services/supabaseService';
import { Bet } from '@/types/bet';
import { formatTimeRemaining } from '@/utils/betUtils';
import { Link } from 'react-router-dom';
import CountdownTimer from '@/components/CountdownTimer';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { connected, publicKey } = useWallet();
  const [localBets, setLocalBets] = useState<Bet[]>([]);
  
  // Fetch all open bets
  const { data: supabaseBets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['openBets'],
    queryFn: fetchOpenBets,
  });
  
  // Fetch user's bets if wallet is connected
  const { data: userBets = [] } = useQuery({
    queryKey: ['userBets', publicKey?.toString()],
    queryFn: () => publicKey ? fetchUserBets(publicKey.toString()) : Promise.resolve([]),
    enabled: !!connected && !!publicKey,
  });
  
  // Load local bets from localStorage
  useEffect(() => {
    try {
      const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
      const fallbackBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
      
      // Filter out bets that already exist in supabaseBets
      const filteredLocalBets = fallbackBets.filter(localBet => {
        return !supabaseBets.some(
          (bet: Bet) => bet.id === localBet.id || 
          (bet.onChainBetId && localBet.onChainBetId && bet.onChainBetId === localBet.onChainBetId)
        );
      });
      
      setLocalBets(filteredLocalBets);
      console.log('Combined local bets with Supabase bets:', {supabaseBets, fallbackBets, filteredLocalBets});
    } catch (error) {
      console.error('Error loading local bets:', error);
      setLocalBets([]);
    }
  }, [supabaseBets]);
  
  // Combine all bets from different sources
  const allBets = [...supabaseBets, ...localBets, ...userBets];
  
  // Remove duplicates from combined bets
  const uniqueBets = allBets.filter((bet, index, self) => 
    index === self.findIndex((b) => b.id === bet.id)
  );
  
  // Filter and categorize bets
  const getFilteredBets = () => {
    const now = new Date().getTime();
    
    // First filter by search query if present
    const searchFiltered = searchQuery.trim() === '' 
      ? uniqueBets 
      : uniqueBets.filter(bet => 
          bet.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) || 
          bet.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
    // Group by categories
    const newlyCreated = searchFiltered
      .filter(bet => (now - bet.timestamp) < 1000 * 60 * 60) // Created within last hour
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const expiring = searchFiltered
      .filter(bet => bet.expiresAt > now && (bet.expiresAt - now) < 1000 * 60 * 60) // Expiring within the hour
      .sort((a, b) => a.expiresAt - b.expiresAt);
    
    const expired = searchFiltered
      .filter(bet => bet.expiresAt < now) // Already expired
      .sort((a, b) => b.expiresAt - a.expiresAt); // Most recently expired first
    
    return { newlyCreated, expiring, expired };
  };
  
  const { newlyCreated, expiring, expired } = getFilteredBets();
  
  // Force refresh when component is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard became visible, refreshing bets data');
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);
  
  // Listen for new bet events
  useEffect(() => {
    const handleNewBet = () => {
      console.log("New bet created event received in Dashboard");
      refetch();
    };

    window.addEventListener('newBetCreated', handleNewBet as EventListener);
    
    return () => {
      window.removeEventListener('newBetCreated', handleNewBet as EventListener);
    };
  }, [refetch]);
  
  const handleRefresh = () => {
    toast.info("Refreshing bets data...");
    refetch();
  };
  
  // Render a bet card
  const renderBetCard = (bet: Bet) => {
    const now = new Date().getTime();
    const isExpired = bet.expiresAt < now;
    const isExpiringSoon = !isExpired && (bet.expiresAt - now) < 1000 * 60 * 60; // Within an hour
    const isNew = (now - bet.timestamp) < 1000 * 60 * 60; // Created within last hour
    
    return (
      <Link 
        key={bet.id} 
        to={`/betting/token/${bet.tokenId}`}
        className="token-card relative overflow-hidden group mb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
        
        {/* Status indicators */}
        {isNew && !isExpired && !isExpiringSoon && (
          <div className="absolute -left-2 -top-2 w-24 h-24">
            <div className="absolute left-2 top-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              New
            </div>
          </div>
        )}
        
        {isExpiringSoon && !isExpired && (
          <div className="absolute -left-2 -top-2 w-24 h-24">
            <div className="absolute left-2 top-2 bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full flex items-center">
              <Clock className="w-3 h-3 mr-1 animate-pulse" />
              Expiring Soon
            </div>
          </div>
        )}
        
        {isExpired && (
          <div className="absolute -left-2 -top-2 w-24 h-24">
            <div className="absolute left-2 top-2 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Expired
            </div>
          </div>
        )}
        
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
        
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
        <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
        
        <div className={`glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300 ${
          isExpired ? 'opacity-70' : (isExpiringSoon ? 'border-yellow-400/30' : '')
        }`}>
          <div className="flex items-center justify-between mb-3">
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
                <Zap className="w-3 h-3" />
                <span>0.6</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm
                ${bet.prediction === 'migrate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {bet.prediction === 'migrate' 
                  ? <ArrowUp className="h-3.5 w-3.5 mr-1" /> 
                  : <ArrowDown className="h-3.5 w-3.5 mr-1" />}
                <span>{bet.prediction === 'migrate' ? 'Moon' : 'Die'}</span>
              </div>
            </div>
            <div className="flex items-center text-sm bg-dream-accent2/10 px-2 py-1 rounded-lg">
              <Wallet className="h-3.5 w-3.5 mr-1.5 text-dream-accent2" />
              <span className="font-semibold">{bet.amount} SOL</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-dream-foreground/60 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className={isExpiringSoon && !isExpired ? 'text-yellow-400' : (isExpired ? 'text-red-400' : '')}>
                {isExpired ? 'Expired' : formatTimeRemaining(bet.expiresAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Created by {bet.initiator.substring(0, 4)}...{bet.initiator.substring(bet.initiator.length - 4)}</span>
            </div>
          </div>

          <button className="bet-button w-full py-2 text-sm font-semibold">
            <span className="z-10 relative">
              {isExpired ? 'View Details' : 'Accept Bet'}
            </span>
          </button>
        </div>
      </Link>
    );
  };
  
  const renderSectionColumn = (title: string, bets: Bet[], icon: React.ReactNode) => {
    return (
      <div className="w-full px-2 relative flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-display font-bold text-dream-foreground flex items-center gap-1">
            {title}
            <span className="bg-dream-accent1/20 text-dream-accent1 text-xs px-2 py-0.5 rounded-full ml-2">
              {bets.length}
            </span>
          </h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-full bg-dream-background/40 text-dream-foreground/60 hover:text-dream-foreground transition-colors"
              title="Refresh"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {bets.length === 0 ? (
            <div className="glass-panel p-6 text-center h-32 flex items-center justify-center">
              <p className="text-dream-foreground/60 text-sm">
                {title === "NEWLY CREATED" 
                  ? "No new bets created recently" 
                  : title === "EXPIRING SOON" 
                    ? "No bets expiring within the hour" 
                    : "No expired bets"}
              </p>
            </div>
          ) : (
            <div className="space-y-0 flex flex-col">
              {bets.map(renderBetCard)}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">MEMESCOPE</h1>
          <p className="text-dream-foreground/70">Customized real-time feeds of new tokens matching your selected preset filters.</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="glass-panel flex items-center w-full md:w-auto">
            <Search className="w-5 h-5 ml-3 text-dream-foreground/60" />
            <input
              type="text"
              placeholder="Search tokens..."
              className="bg-transparent border-none outline-none px-3 py-2 w-full md:w-64 text-dream-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleRefresh}
            className="glass-panel flex items-center px-4 py-2"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Bet Sections */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="glass-panel p-10 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
              <p className="text-dream-foreground/70">Loading bets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-xl text-red-400 mb-4">Failed to load bets</p>
            <p className="text-dream-foreground/70">There was an error fetching the bet data. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {renderSectionColumn("NEWLY CREATED", newlyCreated, <Clock />)}
            {renderSectionColumn("EXPIRING SOON", expiring, <Clock />)}
            {renderSectionColumn("EXPIRED", expired, <Clock />)}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="glass-panel mt-8 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dream-foreground/40 text-sm">
            © {new Date().getFullYear()} PumpXBounty. All rights reserved.
          </p>
        </div>
      </footer>
      
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .bet-button {
          position: relative;
          background: linear-gradient(90deg, rgba(255, 61, 252, 0.2), rgba(0, 238, 255, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        .bet-button:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: all 0.5s;
        }
        .bet-button:hover:before {
          left: 100%;
        }
        `}
      </style>
    </>
  );
};

export default Dashboard;
