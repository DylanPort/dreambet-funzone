
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import PXBSupplyProgress from '@/components/PXBSupplyProgress';
import PXBStatsPanel from '@/components/PXBStatsPanel';
import PXBBetsHistory from '@/components/PXBBetsHistory';
import PXBLeaderboard from '@/components/PXBLeaderboard';
import { ChevronRight, Search, Sparkles, ArrowDownRight, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { useNavigate } from 'react-router-dom';
import TokenSearchBar from '@/components/TokenSearchBar';
import PXBUserStats from '@/components/PXBUserStats';
import OrbitingParticles from '@/components/OrbitingParticles';
import PortfolioSection from '@/components/PortfolioSection';

const Dashboard = () => {
  const { connected } = useWallet();
  const { userProfile, fetchUserProfile, isLoading, mintPoints, mintingPoints } = usePXBPoints();
  const navigate = useNavigate();
  const [showReferralInfo, setShowReferralInfo] = useState(false);

  useEffect(() => {
    document.title = "PumpFun - Dashboard";
    
    // Fetch user profile if connected
    if (connected && !userProfile && !isLoading) {
      fetchUserProfile();
    }
  }, [connected, userProfile, isLoading, fetchUserProfile]);

  const handleMintPoints = async () => {
    try {
      await mintPoints(10000);
    } catch (error) {
      console.error("Error minting points:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <OrbitingParticles />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <PXBPointsBalance />
            </div>
            <div>
              <div className="glass-panel p-6 overflow-hidden h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Search Tokens</h2>
                </div>
                <TokenSearchBar />
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-between items-center" 
                    onClick={() => navigate('/betting')}
                  >
                    <span className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      Browse all tokens
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Section */}
              <PortfolioSection />
              
              <PXBStatsPanel />
              
              <PXBBetsHistory />
              
              <PXBSupplyProgress />
              
            </div>
            
            <div className="space-y-6">
              <PXBUserStats />
              
              <PXBLeaderboard />
              
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-dream-accent2" />
                  Quick Actions
                </h2>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start" 
                    onClick={() => navigate('/betting')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-green-400" />
                    Trading Dashboard
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleMintPoints}
                    disabled={!connected || mintingPoints}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                    {mintingPoints ? 'Minting...' : 'Mint Starter Points'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/profile')}
                  >
                    <Wallet className="mr-2 h-4 w-4 text-dream-accent2" />
                    Manage Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
