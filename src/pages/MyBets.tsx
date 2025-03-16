import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Zap, Coins, Trophy, Users, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { Button } from '@/components/ui/button';
import PXBLeaderboard from '@/components/PXBLeaderboard';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import PXBBetsList from '@/components/PXBBetsList';
import PXBSupplyProgress from '@/components/PXBSupplyProgress';
import PXBUserStats from '@/components/PXBUserStats';
import BetReel from '@/components/BetReel';
const PXBSpace = () => {
  const {
    connected,
    publicKey
  } = useWallet();
  const {
    userProfile,
    isLoading
  } = usePXBPoints();
  return <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Link to="/betting" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold">PXB Space</h1>
          </div>
          
          {/* Total Supply Progress Bar - Visible whether connected or not */}
          <div className="glass-panel p-6 mb-6 overflow-hidden relative">
            <PXBSupplyProgress />
          </div>
          
          {/* User Stats Component */}
          <div className="glass-panel p-6 mb-6 overflow-hidden relative">
            <PXBUserStats />
          </div>
          
          {/* Notice: BetReel actually renders itself as a fixed position bar at the top of the page */}
          <BetReel />
          
          {/* Active Bets Section (Placeholder) */}
          
          
          {!connected ? <div className="glass-panel p-8 text-center">
              <p className="text-xl text-dream-foreground/70 mb-4">Connect your wallet to access PXB Space</p>
              <p className="text-dream-foreground/50 mb-6">Mint PXB Points to start participating in the ecosystem</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left column - Stats & Balance */}
              <div className="md:col-span-4 space-y-6">
                <PXBPointsBalance />
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-dream-accent2" />
                    PXB Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                      <p className="text-sm text-dream-foreground/60 mb-1">Total Bets</p>
                      <p className="text-2xl font-display font-bold text-gradient">
                        {isLoading ? "..." : "0"}
                      </p>
                    </div>
                    <div className="bg-dream-foreground/5 rounded-md p-4 text-center">
                      <p className="text-sm text-dream-foreground/60 mb-1">Win Rate</p>
                      <p className="text-2xl font-display font-bold text-gradient">
                        {isLoading ? "..." : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-dream-accent1" />
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/betting">
                        Place New Bet
                      </Link>
                    </Button>
                    
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/profile">
                        View Your Bets
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right column - Bets & Leaderboard */}
              <div className="md:col-span-8 space-y-6">
                <PXBBetsList />
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
                    PXB Leaderboard
                  </h2>
                  <PXBLeaderboard />
                </div>
                
                <div className="glass-panel p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-dream-accent2" />
                    PXB Community
                  </h2>
                  <p className="text-dream-foreground/70 mb-4">
                    Join the PXB community to connect with other users, share strategies, and earn more points!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center justify-center">
                      <img src="/lovable-uploads/996f7a3a-2e7a-4c12-bcd7-8af762f1087a.png" className="w-4 h-4 mr-2" alt="Discord" />
                      Join Discord
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center">
                      <img src="/lovable-uploads/cacd6344-a731-4fcf-8ae1-de6fc1aee605.png" className="w-4 h-4 mr-2" alt="Twitter" />
                      Follow on Twitter
                    </Button>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </main>
    </>;
};
export default PXBSpace;