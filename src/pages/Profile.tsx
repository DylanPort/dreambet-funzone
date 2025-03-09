import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { Clock, TrendingUp, TrendingDown, Settings, History, Wallet as WalletIcon, Activity, Filter, RefreshCw } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Button } from '@/components/ui/button';
import { fetchUserProfile, fetchUserBettingHistory, calculateUserStats, updateUsername, UserProfile, UserBet, UserStats } from '@/services/userService';
import useSolanaBalance from '@/hooks/useSolanaBalance';
import { toast } from 'sonner';
import { formatTimeRemaining } from '@/utils/betUtils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [activeBets, setActiveBets] = useState<UserBet[]>([]);
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
  const { balance: solanaBalance, isLoading: balanceLoading } = useSolanaBalance();
  const [betsFilter, setBetsFilter] = useState<'all' | 'active' | 'completed'>('all');
  
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

  useEffect(() => {
    const loadActiveBets = async () => {
      setIsActiveBetsLoading(true);
      
      if (!connected || !publicKey) {
        setIsActiveBetsLoading(false);
        return;
      }
      
      try {
        const walletAddress = publicKey.toString();
        
        const { data: supabaseBets, error } = await supabase
          .from('bets')
          .select(`
            bet_id,
            token_mint,
            tokens (token_name, token_symbol),
            prediction_bettor1,
            sol_amount,
            status,
            created_at,
            duration,
            creator
          `)
          .eq('creator', walletAddress)
          .in('status', ['open', 'matched'])
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching active bets:", error);
          toast.error("Failed to load active bets");
          return;
        }
        
        const storedBets = localStorage.getItem('pumpxbounty_fallback_bets');
        let localBets: any[] = storedBets ? JSON.parse(storedBets) : [];
        
        const now = Date.now();
        localBets = localBets.filter((bet: any) => 
          bet.expiresAt > now && 
          bet.status === 'open' && 
          bet.initiator === walletAddress
        );
        
        const mappedSupabaseBets = supabaseBets.map(bet => {
          const createdDate = new Date(bet.created_at);
          const expiryTime = new Date(createdDate.getTime() + (bet.duration * 60 * 60 * 1000));
          
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
    const interval = setInterval(loadActiveBets, 30000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    
    const walletAddress = publicKey.toString();
    const success = await updateUsername(walletAddress, usernameInput);
    
    if (success && user) {
      setUser({
        ...user,
        username: usernameInput
      });
    }
  };

  const handleRefresh = () => {
    if (!connected || !publicKey) return;
    
    toast.info("Refreshing bets data...");
    const walletAddress = publicKey.toString();
    
    setIsLoading(true);
    setIsActiveBetsLoading(true);
    
    Promise.all([
      fetchUserBettingHistory(walletAddress),
      fetchUserProfile(walletAddress)
    ]).then(([bettingHistory, profileData]) => {
      setBets(bettingHistory);
      setUser(profileData);
      
      const userStats = calculateUserStats(bettingHistory);
      setStats(userStats);
      
    }).catch(error => {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }).finally(() => {
      setIsLoading(false);
    });
  };
  
  const filteredBets = betsFilter === 'all' 
    ? [...bets, ...activeBets.filter(active => !bets.some(bet => bet.id === active.id))]
    : betsFilter === 'active'
      ? activeBets
      : bets.filter(bet => bet.result !== 'pending');
  
  if (!connected || !publicKey) {
    return (
      <>
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
      </>
    );
  }
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-transparent border-dream-accent1 rounded-full animate-spin mb-4"></div>
            <p className="text-dream-foreground/70">Loading profile...</p>
          </div>
        </main>
      </>
    );
  }
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
              <img src="/lovable-uploads/575dd9fd-27d8-443c-8167-0af64089b9cc.png" alt="Profile" className="w-16 h-16" />
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-display font-bold">{user?.username || publicKey.toString().substring(0, 8) || 'DreamPredictor'}</h1>
              <p className="text-dream-foreground/60">{publicKey.toString()}</p>
              <p className="text-dream-foreground/60 text-sm mt-1">
                <Clock className="inline w-3 h-3 mr-1" />
                Joined {user?.created_at ? formatDate(user.created_at) : 'Recently'}
              </p>
            </div>
            
            <div className="ml-auto flex flex-col md:flex-row gap-4">
              <div className="glass-panel p-4 text-center">
                <p className="text-dream-foreground/60 text-sm flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 mr-1" />
                  SOL Balance
                </p>
                <p className="text-2xl font-display font-bold text-gradient">
                  {balanceLoading ? (
                    <span className="text-sm text-dream-foreground/40">Loading...</span>
                  ) : solanaBalance !== null ? (
                    `${solanaBalance.toFixed(4)} SOL`
                  ) : (
                    <span className="text-sm text-dream-foreground/40">Unavailable</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 text-center relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl bg-dream-accent2/10 opacity-70"></div>
            <p className="text-dream-foreground/60 mb-2">Total Bets</p>
            <p className="text-3xl font-display font-bold">{stats.totalBets}</p>
          </div>
          
          <div className="glass-panel p-6 text-center relative overflow-hidden">
            <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full blur-3xl bg-dream-accent1/10 opacity-70"></div>
            <p className="text-dream-foreground/60 mb-2">Win Rate</p>
            <p className="text-3xl font-display font-bold">{stats.winRate}%</p>
          </div>

          <div className="glass-panel p-6 text-center relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full blur-3xl bg-dream-accent3/10 opacity-70"></div>
            <p className="text-dream-foreground/60 mb-2">Active Bets</p>
            <p className="text-3xl font-display font-bold flex items-center justify-center">
              {isActiveBetsLoading ? (
                <span className="text-sm text-dream-foreground/40">Loading...</span>
              ) : (
                <span className="flex items-center">
                  {activeBets.length}
                  {activeBets.length > 0 && <Activity className="w-5 h-5 ml-2 text-dream-accent2 animate-pulse" />}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="glass-panel p-6">
          <div className="flex border-b border-white/10">
            <button
              className={`py-3 px-6 font-medium flex items-center ${
                activeTab === 'history'
                  ? 'border-b-2 border-dream-accent1 text-dream-accent1'
                  : 'text-dream-foreground/60 hover:text-dream-foreground'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <History className="w-4 h-4 mr-2" />
              Betting History
            </button>
            
            <button
              className={`py-3 px-6 font-medium flex items-center ${
                activeTab === 'settings'
                  ? 'border-b-2 border-dream-accent1 text-dream-accent1'
                  : 'text-dream-foreground/60 hover:text-dream-foreground'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </button>
          </div>
          
          {activeTab === 'history' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-semibold">Betting History</h2>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBetsFilter('all')}
                      className={`px-2.5 py-1 text-sm rounded-full transition-colors ${
                        betsFilter === 'all' 
                          ? 'bg-dream-accent1/20 text-dream-accent1 border border-dream-accent1/30' 
                          : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setBetsFilter('active')}
                      className={`px-2.5 py-1 text-sm rounded-full transition-colors flex items-center ${
                        betsFilter === 'active' 
                          ? 'bg-dream-accent2/20 text-dream-accent2 border border-dream-accent2/30' 
                          : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
                      }`}
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                      {activeBets.length > 0 && (
                        <span className="ml-1 bg-dream-accent2/30 text-dream-accent2 text-xs px-1.5 rounded-full">
                          {activeBets.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setBetsFilter('completed')}
                      className={`px-2.5 py-1 text-sm rounded-full transition-colors ${
                        betsFilter === 'completed' 
                          ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                          : 'bg-dream-background/30 text-dream-foreground/60 border border-dream-foreground/10'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 rounded-full bg-dream-background/30 text-dream-foreground/60 hover:text-dream-foreground hover:bg-dream-background/50 transition-colors"
                    title="Refresh bets"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {(betsFilter === 'active' && isActiveBetsLoading) || (betsFilter !== 'active' && isLoading) ? (
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
                      {filteredBets.map((bet) => (
                        <motion.tr 
                          key={bet.id} 
                          className={`border-b border-white/5 hover:bg-white/5 ${bet.isActive ? 'relative' : ''}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {bet.isActive && (
                            <div className="absolute left-0 top-0 h-full w-1 bg-dream-accent2/50"></div>
                          )}
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bet.prediction === 'moon'
                                ? 'bg-dream-accent1/20 text-dream-accent1'
                                : 'bg-dream-accent2/20 text-dream-accent2'
                            }`}>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bet.isActive
                                ? 'bg-dream-accent2/20 text-dream-accent2'
                                : bet.result === 'win'
                                ? 'bg-green-500/20 text-green-500'
                                : bet.result === 'loss'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
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
                          <td className={`px-4 py-4 font-medium ${
                            bet.profit > 0 
                              ? 'text-green-400' 
                              : bet.profit < 0 
                              ? 'text-red-400' 
                              : 'text-dream-foreground/40'
                          }`}>
                            {bet.profit > 0 ? (
                              `+${bet.profit.toFixed(2)} SOL`
                            ) : bet.profit < 0 ? (
                              `${bet.profit.toFixed(2)} SOL`
                            ) : (
                              '—'
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="mt-6">
              <h2 className="text-xl font-display font-semibold mb-4">Account Settings</h2>
              
              <div className="glass-panel p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <UserCircle className="w-5 h-5 mr-2 text-dream-accent1" />
                  Profile Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-dream-foreground/60 mb-2">Wallet Address</label>
                    <input
                      type="text"
                      className="input-dream w-full bg-gray-900/50"
                      value={publicKey.toString()}
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-dream-foreground/40 mt-1">Your wallet address cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-dream-foreground/60 mb-2">Username</label>
                    <input
                      type="text"
                      className="input-dream w-full"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter a display name"
                    />
                  </div>
                  
                  <Button 
                    className="mt-4 bg-dream-accent1 hover:bg-dream-accent1/80 text-white"
                    onClick={handleUpdateProfile}
                  >
                    Update Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="glass-panel mt-20 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dream-foreground/40 text-sm">
            © {new Date().getFullYear()} DreamBet. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Profile;
