
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import { UserCircle, Clock, TrendingUp, TrendingDown, Settings, History } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Button } from '@/components/ui/button';
import { fetchUserProfile, fetchUserBettingHistory, calculateUserStats, updateUsername, UserProfile, UserBet, UserStats } from '@/services/userService';
import { toast } from 'sonner';

const Profile = () => {
  const { connected, publicKey } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    winRate: 0,
    totalProfit: 0,
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [usernameInput, setUsernameInput] = useState('');
  
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      
      // Check if wallet is connected
      if (!connected || !publicKey) {
        setIsLoading(false);
        return;
      }
      
      try {
        const walletAddress = publicKey.toString();
        
        // Fetch user profile
        const profileData = await fetchUserProfile(walletAddress);
        setUser(profileData);
        
        if (profileData) {
          setUsernameInput(profileData.username || '');
        }
        
        // Fetch user's betting history
        const bettingHistory = await fetchUserBettingHistory(walletAddress);
        setBets(bettingHistory);
        
        // Calculate stats from betting history
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
  
  if (!connected || !publicKey) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto flex justify-center items-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 bg-dream-foreground/10 rounded-full flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-dream-foreground/80" />
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
        {/* Profile Header */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
              <UserCircle className="w-12 h-12 text-dream-foreground/80" />
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-display font-bold">{user?.username || publicKey.toString().substring(0, 8) || 'DreamPredictor'}</h1>
              <p className="text-dream-foreground/60">{publicKey.toString()}</p>
              <p className="text-dream-foreground/60 text-sm mt-1">
                <Clock className="inline w-3 h-3 mr-1" />
                Joined {user?.created_at ? formatDate(user.created_at) : 'Recently'}
              </p>
            </div>
            
            <div className="ml-auto glass-panel p-4 text-center">
              <p className="text-dream-foreground/60 text-sm">Balance</p>
              <p className="text-2xl font-display font-bold text-gradient">${stats.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Total Bets</p>
            <p className="text-3xl font-display font-bold">{stats.totalBets}</p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Win Rate</p>
            <p className="text-3xl font-display font-bold">{stats.winRate}%</p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Total Profit</p>
            <p className={`text-3xl font-display font-bold ${
              stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {stats.totalProfit >= 0 ? '+' : ''}${Math.abs(stats.totalProfit).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Tabs */}
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
          
          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="mt-6">
              <h2 className="text-xl font-display font-semibold mb-4">Recent Bets</h2>
              
              {bets.length === 0 ? (
                <div className="text-center py-10 text-dream-foreground/60">
                  <p>You haven't made any bets yet.</p>
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
                        <th className="px-4 py-3 text-left text-dream-foreground/60">Result</th>
                        <th className="px-4 py-3 text-left text-dream-foreground/60">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bets.map((bet) => (
                        <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5">
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
                          <td className="px-4 py-4 text-dream-foreground/80">${bet.amount}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bet.result === 'win'
                                ? 'bg-green-500/20 text-green-500'
                                : bet.result === 'loss'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {bet.result === 'win' ? 'Win' : bet.result === 'loss' ? 'Loss' : 'Pending'}
                            </span>
                          </td>
                          <td className={`px-4 py-4 font-medium ${
                            bet.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {bet.profit >= 0 ? '+' : ''}${Math.abs(bet.profit).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab Content */}
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
      
      {/* Footer */}
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
