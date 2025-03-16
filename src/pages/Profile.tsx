import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { Clock, TrendingUp, TrendingDown, Settings, History, Coins, Activity, Filter, RefreshCw, User, Plus, Save, X, Edit2, ArrowUp, ArrowDown, Zap, Sparkles } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Button } from '@/components/ui/button';
import { fetchUserProfile, fetchUserBettingHistory, calculateUserStats, updateUsername, UserProfile, UserBet, UserStats } from '@/services/userService';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';
import { formatTimeRemaining } from '@/utils/betUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { fetchUserBets } from '@/api/mockData';
import { Bet } from '@/types/bet';

const Profile = () => {
  const {
    connected,
    publicKey
  } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [activeBets, setActiveBets] = useState<UserBet[]>([]);
  const [apiActiveBets, setApiActiveBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActiveBetsLoading, setIsActiveBetsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [usernameInput, setUsernameInput] = useState('');
  const {
    userProfile,
    isLoading: pxbLoading,
    mintPoints,
    fetchUserProfile: fetchPXBUserProfile
  } = usePXBPoints();
  const [betsFilter, setBetsFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isMintingPoints, setIsMintingPoints] = useState(false);
  const [localPxbPoints, setLocalPxbPoints] = useState<number | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  
  // New state for MyBets integration
  const [myBetsView, setMyBetsView] = useState<'standard' | 'detailed'>('standard');
  const [activeDetailFilter, setActiveDetailFilter] = useState<string>('all');
  
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      if (!connected || !publicKey) {
        setIsLoading(false);
        return;
      }
      try {
        const walletAddress = publicKey.toString();
        const profileData = await fetchUserProfile(walletAddress);
        setUser(profileData);
        if (profileData) {
          setUsernameInput(profileData.username || '');
        }
        const bettingHistory = await fetchUserBettingHistory(walletAddress);
        setBets(bettingHistory);
        const userStats = calculateUserStats(bettingHistory);
        setStats(userStats);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [connected, publicKey]);
  
  // MyBets function to load bets - used for the detailed view
  const loadDetailedBets = async () => {
    try {
      setIsActiveBetsLoading(true);
      if (connected && publicKey) {
        console.log('Fetching bets for user:', publicKey.toString());
        
        // Get bets from the API
        const userBets = await fetchUserBets(publicKey.toString());
        
        // Get locally stored bets (fallback)
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        let localBets: Bet[] = storedBets ? JSON.parse(storedBets) : [];
        
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
        
        setApiActiveBets(allBets);
        
        // Count active bets (open or matched)
        const activeCount = allBets.filter(bet => 
          bet.status === 'open' || bet.status === 'matched'
        ).length;
      } else {
        setApiActiveBets([]);
      }
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setIsActiveBetsLoading(false);
    }
  };
  
  useEffect(() => {
    const loadActiveBets = async () => {
      setIsActiveBetsLoading(true);
      if (!connected || !publicKey) {
        setIsActiveBetsLoading(false);
        return;
      }
      try {
        const walletAddress = publicKey.toString();
        const {
          data: supabaseBets,
          error
        } = await supabase.from('bets').select(`
            bet_id,
            token_mint,
            tokens (token_name, token_symbol),
            prediction_bettor1,
            sol_amount,
            status,
            created_at,
            duration,
            creator
          `).eq('creator', walletAddress).in('status', ['open', 'matched']).order('created_at', {
          ascending: false
        });
        if (error) {
          console.error("Error fetching active bets:", error);
          toast.error("Failed to load active bets");
          return;
        }
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        let localBets: any[] = storedBets ? JSON.parse(storedBets) : [];
        const now = Date.now();
        localBets = localBets.filter((bet: any) => bet.expiresAt > now && bet.status === 'open' && bet.initiator === walletAddress);
        const mappedSupabaseBets = supabaseBets.map(bet => {
          const createdDate = new Date(bet.created_at);
          const expiryTime = new Date(createdDate.getTime() + bet.duration * 60 * 60 * 1000);
          let prediction: 'moon' | 'die';
          if (bet.prediction_bettor1 === 'up' || bet.prediction_bettor1 === 'migrate') {
            prediction = 'moon';
          } else {
            prediction = 'die';
          }
          return {
            id: bet.bet_id,
            tokenName: bet.tokens?.token_name || 'Unknown Token',
            tokenSymbol: bet.tokens?.token_symbol || 'UNKNOWN',
            amount: bet.sol_amount,
            prediction: prediction,
            result: 'pending',
            date: bet.created_at,
            profit: 0,
            isActive: true,
            expiresAt: expiryTime.getTime()
          } as UserBet;
        });
        const mappedLocalBets = localBets.map((bet: any) => {
          return {
            id: bet.id,
            tokenName: bet.tokenName || 'Unknown Token',
            tokenSymbol: bet.tokenSymbol || 'UNKNOWN',
            amount: bet.amount,
            prediction: bet.prediction === 'migrate' ? 'moon' : 'die',
            result: 'pending',
            date: new Date(bet.timestamp).toISOString(),
            profit: 0,
            isActive: true,
            expiresAt: bet.expiresAt
          } as UserBet;
        });
        const allActiveBets: UserBet[] = [...mappedSupabaseBets];
        for (const localBet of mappedLocalBets) {
          const exists = allActiveBets.some(existingBet => existingBet.id === localBet.id);
          if (!exists) {
            allActiveBets.push(localBet);
          }
        }
        setActiveBets(allActiveBets);
      } catch (error) {
        console.error("Error loading active bets:", error);
        toast.error("Failed to load active bets");
      } finally {
        setIsActiveBetsLoading(false);
      }
    };
    
    loadActiveBets();
    loadDetailedBets();
    
    const interval = setInterval(() => {
      loadActiveBets();
      loadDetailedBets();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [connected, publicKey]);
  
  // Force refresh when component is visible
  useEffect(() => {
    // Set up a visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing my bets data');
        loadDetailedBets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleUpdateProfile = async () => {
    if (!usernameInput.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet to update your profile");
      return;
    }
    setIsSavingUsername(true);
    const walletAddress = publicKey.toString();
    const success = await updateUsername(walletAddress, usernameInput);
    if (success && user) {
      setUser({
        ...user,
        username: usernameInput
      });
      fetchPXBUserProfile();
      toast.success("Username updated successfully");
      setIsEditingUsername(false);
    }
    setIsSavingUsername(false);
  };
  
  const startEditingUsername = () => {
    setUsernameInput(user?.username || userProfile?.username || '');
    setIsEditingUsername(true);
  };
  
  const cancelEditingUsername = () => {
    setIsEditingUsername(false);
    setUsernameInput(user?.username || userProfile?.username || '');
  };
  
  const handleRefresh = () => {
    if (!connected || !publicKey) return;
    toast.info("Refreshing bets data...");
    const walletAddress = publicKey.toString();
    setIsLoading(true);
    setIsActiveBetsLoading(true);
    
    Promise.all([
      fetchUserBettingHistory(walletAddress), 
      fetchUserProfile(walletAddress),
      fetchUserBets(walletAddress)
    ]).then(([bettingHistory, profileData, apiBets]) => {
      setBets(bettingHistory);
      setUser(profileData);
      setApiActiveBets(apiBets);
      const userStats = calculateUserStats(bettingHistory);
      setStats(userStats);
    }).catch(error => {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }).finally(() => {
      setIsLoading(false);
      setIsActiveBetsLoading(false);
    });
  };
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchPXBUserProfile();
    }
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const usersSubscription = supabase.channel('users-points-changes').on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `wallet_address=eq.${walletAddress}`
      }, payload => {
        if (payload.new && typeof payload.new.points === 'number') {
          setLocalPxbPoints(payload.new.points);
        }
      }).subscribe();
      return () => {
        supabase.removeChannel(usersSubscription);
      };
    }
  }, [connected, publicKey]);
  
  useEffect(() => {
    if (userProfile && userProfile.pxbPoints !== undefined) {
      setLocalPxbPoints(userProfile.pxbPoints);
    }
  }, [userProfile]);
  
  const handleMintPXBPoints = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (userProfile?.pxbPoints > 0 || localPxbPoints > 0) {
      toast.error("You've already minted your PXB Points!");
      return;
    }
    setIsMintingPoints(true);
    try {
      await mintPoints(500);
      await fetchPXBUserProfile();
      toast.success("Successfully minted 500 PXB Points!");
    } catch (error) {
      console.error("Error minting PXB points:", error);
      toast.error("Failed to mint PXB Points");
    } finally {
      setIsMintingPoints(false);
    }
  };
  
  // Filter bets for the standard view
  const filteredBets = betsFilter === 'all' ? [...bets, ...activeBets.filter(active => !bets.some(bet => bet.id === active.id))] : betsFilter === 'active' ? activeBets : bets.filter(bet => bet.result !== 'pending');
  
  // Filter bets for the detailed view
  const filteredDetailedBets = apiActiveBets.filter(bet => {
    if (activeDetailFilter === 'all') return true;
    if (activeDetailFilter === 'active') return bet.status === 'open' || bet.status === 'matched';
    return bet.status === activeDetailFilter;
  });
  
  const getBetStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'from-yellow-500/20 to-yellow-500/30 text-yellow-400 border-yellow-400/30';
      case 'matched': return 'from-blue-500/20 to-blue-500/30 text-blue-400 border-blue-400/30';
      case 'completed': return 'from-green-500/20 to-green-500/30 text-green-400 border-green-400/30';
      case 'expired': return 'from-red-500/20 to-red-500/30 text-red-400 border-red-400/30';
      default: return 'from-gray-500/20 to-gray-500/30 text-gray-400 border-gray-400/30';
    }
  };

  if (!connected || !publicKey) {
    return <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 bg-dream-foreground/10 rounded-full flex items-center justify-center">
              <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-display font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-dream-foreground/70 text-center mb-6">You need to connect your wallet to access your profile.</p>
          </div>
        </main>
      </>;
  }
  
  if (isLoading) {
    return <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
            <p className="text-dream-foreground/70">Loading profile...</p>
          </div>
        </main>
      </>;
  }
  
  return <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
              <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" className="w-16 h-16" />
            </div>
            
            <div className="text-center md:text-left">
              {isEditingUsername ? <div className="flex flex-col md:flex-row gap-2 items-center">
                  <Input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="Enter new username" className="px-3 py-2 w-full md:w-auto" autoFocus />
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Button onClick={handleUpdateProfile} disabled={isSavingUsername} size="sm" className="bg-dream-accent1 hover:bg-dream-accent1/80">
                      {isSavingUsername ? <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Saving
                        </> : <>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </>}
                    </Button>
                    <Button onClick={cancelEditingUsername} variant="outline" size="sm" className="border-dream-foreground/20 hover:bg-dream-foreground/5">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div> : <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">
                    {user?.username || publicKey.toString().substring(0, 8) || 'DreamPredictor'}
                  </h1>
                  <Button onClick={startEditingUsername} variant="ghost" size="sm" className="text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-foreground/10">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="sr-only">Edit username</span>
                  </Button>
                </div>}
              <p className="text-dream-foreground/60">{publicKey.toString()}</p>
              <p className="text-dream-foreground/60 text-sm mt-1">
                <Clock className="inline w-3 h-3 mr-1" />
                Joined {user?.created_at ? formatDate(user.created_at) : 'Recently'}
              </p>
            </div>
            
            <div className="ml-auto flex flex-col md:flex-row gap-4">
              <div className="glass-panel p-4 text-center">
                <p className="text-dream-foreground/60 text-sm flex items-center justify-center">
                  <Coins className="w-4 h-4 mr-1 text-yellow-400" />
                  PXB Points
                </p>
                <p className="text-2xl font-display font-bold text-gradient">
                  {pxbLoading ? <span className="text-sm text-dream-foreground/40">Loading...</span> : localPxbPoints !== null && localPxbPoints > 0 ? `${localPxbPoints.toLocaleString()} PXB` : userProfile !== null && userProfile.pxbPoints > 0 ? `${userProfile.pxbPoints.toLocaleString()} PXB` : <span className="text-sm text-dream-foreground/40">0 PXB</span>}
                </p>
                {!userProfile?.pxbPoints && !localPxbPoints ? <Button onClick={handleMintPXBPoints} disabled={isMintingPoints} className="mt-2 text-xs h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" size="sm">
                    {isMintingPoints ? <div className="flex items-center">
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        <span>Minting...</span>
                      </div> : <>
                        <Plus className="w-3 h-3 mr-1" />
                        Mint 500 Points
                      </>}
                  </Button> : null}
              </div>
            </div>
          </div>
          
          <div className="flex border-b border-white/10 mt-6">
            <button className={`py-3 px-6 font-medium flex items-center ${activeTab === 'history' ? 'border-b-2 border-dream-accent1 text-dream-accent1' : 'text-dream-foreground/60 hover:text-dream-foreground'}`} onClick={() => setActiveTab('history')}>
              <History className="w-4 h-4 mr-2" />
              Betting History
            </button>
            
            <button className={`py-3 px-6 font-medium flex items-center ${activeTab === 'settings' ? 'border-b-2 border-dream-accent1 text-dream-accent1' : 'text-dream-foreground/60 hover:text-dream-foreground'}`} onClick={() => setActiveTab('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
        
        {activeTab === 'history' && (
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-display font-semibold">Betting History</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMyBetsView('standard')} 
                    className={`px-3 py-1 text-sm rounded ${myBetsView === 'standard' ? 'bg-dream-accent1 text-white' : 'bg-dream-background/30 text-dream-foreground/60'}`}
                  >
                    Simple
                  </button>
                  <button 
                    onClick={() => setMyBetsView('detailed')} 
                    className={`px-3 py-1 text-sm rounded ${myBetsView === 'detailed' ? 'bg-dream-accent1 text-white' : 'bg-dream-background/30 text-dream-foreground/60'}`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {myBetsView === 'standard' ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setBetsFilter('all')} className={`px-2.5 py-1 text-sm rounded-full transition-colors ${betsFilter === 'all' ? 'bg-dream-accent1/20 text-dream-accent1 border border-dream-accent1/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
                      All
                    </button>
                    <button onClick={() => setBetsFilter('active')} className={`px-2.5 py-1 text-sm rounded-full transition-colors flex items-center ${betsFilter === 'active' ? 'bg-dream-accent2/20 text-dream-accent2 border border-dream-accent2/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                      {activeBets.length > 0 && <span className="ml-1 bg-dream-accent2/30 text-dream-accent2 text-xs px-1.5 rounded-full">
                          {activeBets.length}
                        </span>}
                    </button>
                    <button onClick={() => setBetsFilter('completed')} className={`px-2.5 py-1 text-sm rounded-full transition-colors ${betsFilter === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-400/30' : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'}`}>
                      Completed
                    </button>
                  </div>
                ) : (
                  <div className="flex overflow-x-auto p-1 gap-2">
                    {['all', 'active', 'open', 'matched', 'completed', 'expired'].map(filter => (
                      <motion.button
                        key={filter}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setActiveDetailFilter(filter)}
                        className={`px-4 py-2 rounded-md whitespace-nowrap transition-all ${
                          activeDetailFilter === filter
                          ? 'bg-gradient-to-r from-dream-accent1 to-dream-accent2 text-white shadow-lg shadow-dream-accent1/20'
                          : 'bg-dream-surface/50 text-dream-foreground/70 hover:bg-dream-surface'
                        }`}
                      >
                        {filter === 'active' && <Activity className="w-3.5 h-3.5 inline mr-1" />}
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                )}
                
                <button onClick={handleRefresh} className="p-1.5 rounded-full bg-dream-background/30 text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-background/50 transition-colors" title="Refresh bets">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {myBetsView === 'standard' ? (
              // Standard view
              <>
                {betsFilter === 'active' && isActiveBetsLoading || betsFilter !== 'active' && isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-dream-foreground/70 text-sm">Loading bets...</p>
                    </div>
                  </div>
                ) : filteredBets.length === 0 ? (
                  <div className="text-center py-10 text-dream-foreground/60">
                    <p>No {betsFilter === 'all' ? '' : betsFilter} bets found.</p>
                    <Link to="/betting" className="mt-4 inline-block">
                      <Button className="bg-dream-accent1 hover:bg-dream-accent1/80">
                        Place Your First Bet
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Token</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Date</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Prediction</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Amount</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Status</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Remaining</th>
                          <th className="px-4 py-3 text-left text-dream-foreground/60">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBets.map(bet => (
                          <motion.tr 
                            key={bet.id} 
                            className={`border-b border-white/5 hover:bg-white/5 ${bet.isActive ? 'relative' : ''}`} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {bet.isActive && <div className="absolute left-0 top-0 h-full w-1 bg-dream-accent2/50"></div>}
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 mr-3">
                                  <span className="font-display font-bold text-sm">{bet.tokenSymbol.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{bet.tokenName}</p>
                                  <p className="text-dream-foreground/60 text-sm">{bet.tokenSymbol}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-dream-foreground/80">{formatDate(bet.date)}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bet.prediction === 'moon' ? 'bg-dream-accent1/20 text-dream-accent1' : 'bg-dream-accent2/20 text-dream-accent2'}`}>
                                {bet.prediction === 'moon' ? (
                                  <>
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Moon
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    Die
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-dream-foreground/80">{bet.amount} SOL</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bet.isActive ? 'bg-dream-accent2/20 text-dream-accent2' : bet.result === 'win' ? 'bg-green-500/20 text-green-500' : bet.result === 'loss' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {bet.isActive ? 'Active' : bet.result === 'win' ? 'Win' : bet.result === 'loss' ? 'Loss' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-dream-foreground/80">
                              {bet.isActive && bet.expiresAt ? (
                                <span className="text-sm text-dream-accent2/80">
                                  {formatTimeRemaining(bet.expiresAt)}
                                </span>
                              ) : (
                                <span className="text-sm text-dream-foreground/40">—</span>
                              )}
                            </td>
                            <td className={`px-4 py-4 font-medium ${bet.profit > 0 ? 'text-green-400' : bet.profit < 0 ? 'text-red-400' : 'text-dream-foreground/40'}`}>
                              {bet.profit > 0 ? `+${bet.profit.toFixed(2)} SOL` : bet.profit < 0 ? `${bet.profit.toFixed(2)} SOL` : '—'}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              // Detailed view from MyBets
              <>
                {isActiveBetsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-dream-accent2 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-dream-foreground/70">Loading your bets...</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {filteredDetailedBets.length === 0 ? (
                      <motion.div
