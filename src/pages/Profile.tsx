
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { UserCircle, Clock, TrendingUp, TrendingDown, Settings, History, Wallet } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';

// Mock user data
const mockUser = {
  username: 'DreamPredictor',
  email: 'user@example.com',
  joinDate: '2023-09-15',
  balance: 2500,
  bets: [
    {
      id: '1',
      tokenName: 'Ethereum',
      tokenSymbol: 'ETH',
      amount: 100,
      prediction: 'moon',
      result: 'win',
      date: '2023-12-01T14:30:00',
      profit: 95,
    },
    {
      id: '2',
      tokenName: 'Solana',
      tokenSymbol: 'SOL',
      amount: 50,
      prediction: 'die',
      result: 'loss',
      date: '2023-11-28T10:15:00',
      profit: -50,
    },
    {
      id: '3',
      tokenName: 'Algorand',
      tokenSymbol: 'ALGO',
      amount: 75,
      prediction: 'moon',
      result: 'win',
      date: '2023-11-25T16:45:00',
      profit: 71.25,
    },
    {
      id: '4',
      tokenName: 'Cardano',
      tokenSymbol: 'ADA',
      amount: 120,
      prediction: 'die',
      result: 'win',
      date: '2023-11-20T09:30:00',
      profit: 114,
    },
    {
      id: '5',
      tokenName: 'Polkadot',
      tokenSymbol: 'DOT',
      amount: 60,
      prediction: 'moon',
      result: 'loss',
      date: '2023-11-15T11:20:00',
      profit: -60,
    },
  ],
};

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const calculateWinRate = () => {
    if (!user?.bets?.length) return 0;
    
    const wins = user.bets.filter((bet: any) => bet.result === 'win').length;
    return Math.round((wins / user.bets.length) * 100);
  };
  
  const calculateTotalProfit = () => {
    if (!user?.bets?.length) return 0;
    
    return user.bets.reduce((acc: number, bet: any) => acc + bet.profit, 0);
  };
  
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
              <h1 className="text-2xl md:text-3xl font-display font-bold">{user.username}</h1>
              <p className="text-dream-foreground/60">{user.email}</p>
              <p className="text-dream-foreground/60 text-sm mt-1">
                <Clock className="inline w-3 h-3 mr-1" />
                Joined {formatDate(user.joinDate)}
              </p>
            </div>
            
            <div className="ml-auto glass-panel p-4 text-center">
              <p className="text-dream-foreground/60 text-sm">Balance</p>
              <p className="text-2xl font-display font-bold text-gradient">${user.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Total Bets</p>
            <p className="text-3xl font-display font-bold">{user.bets.length}</p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Win Rate</p>
            <p className="text-3xl font-display font-bold">{calculateWinRate()}%</p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <p className="text-dream-foreground/60 mb-2">Total Profit</p>
            <p className={`text-3xl font-display font-bold ${
              calculateTotalProfit() >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {calculateTotalProfit() >= 0 ? '+' : ''}${calculateTotalProfit().toLocaleString()}
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
                    {user.bets.map((bet: any) => (
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
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {bet.result === 'win' ? 'Win' : 'Loss'}
                          </span>
                        </td>
                        <td className={`px-4 py-4 font-medium ${
                          bet.profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="mt-6">
              <h2 className="text-xl font-display font-semibold mb-4">Account Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <UserCircle className="w-5 h-5 mr-2 text-dream-accent1" />
                    Profile Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-dream-foreground/60 mb-2">Username</label>
                      <input
                        type="text"
                        className="input-dream w-full"
                        defaultValue={user.username}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-dream-foreground/60 mb-2">Email</label>
                      <input
                        type="email"
                        className="input-dream w-full"
                        defaultValue={user.email}
                      />
                    </div>
                    
                    <button className="btn-primary w-full mt-4">
                      Update Profile
                    </button>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-dream-accent2" />
                    Payment Methods
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="glass-panel p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Credit Card</p>
                        <p className="text-dream-foreground/60 text-sm">**** **** **** 4242</p>
                      </div>
                      <span className="text-xs bg-dream-accent3/20 text-dream-accent3 px-2 py-1 rounded">Default</span>
                    </div>
                    
                    <button className="btn-secondary w-full">
                      Add Payment Method
                    </button>
                  </div>
                </div>
                
                <div className="glass-panel p-6 md:col-span-2">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-dream-accent3" />
                    Password
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dream-foreground/60 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="input-dream w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-dream-foreground/60 mb-2">New Password</label>
                      <input
                        type="password"
                        className="input-dream w-full"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-dream-foreground/60 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="input-dream w-full"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <button className="btn-primary mt-4">
                    Change Password
                  </button>
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
