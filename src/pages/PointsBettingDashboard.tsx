
import React from 'react';
import { Coins, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import PumpFunTokens from '@/components/PumpFunTokens';
import VolumeFilteredTokens from '@/components/VolumeFilteredTokens';
import PXBPointsBalance from '@/components/PXBPointsBalance';
import PXBLeaderboard from '@/components/PXBLeaderboard';
import PXBBetsList from '@/components/PXBBetsList';
import PXBOnboarding from '@/components/PXBOnboarding';
import { usePXBPoints } from '@/contexts/PXBPointsContext';

const PointsBettingDashboard: React.FC = () => {
  const { userProfile } = usePXBPoints();
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              PXB Points Betting
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto">
              Bet with PXB Points on whether tokens will go up or down after migrating from PumpFun to Raydium
            </p>
          </section>
          
          {/* Points & Onboarding */}
          <section className="mb-10">
            {userProfile ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PXBPointsBalance />
                <PXBBetsList />
                <PXBLeaderboard />
              </div>
            ) : (
              <PXBOnboarding />
            )}
          </section>
          
          {/* PumpFun Tokens Above 15k MCAP - With Real-time Updates */}
          <section className="mb-10">
            <VolumeFilteredTokens />
          </section>
          
          {/* PumpFun Tokens Section */}
          <section className="mb-10">
            <PumpFunTokens />
          </section>
          
          {/* How it Works Section */}
          <section className="mt-16">
            <h2 className="text-2xl font-display font-bold text-dream-foreground mb-6 text-center">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent1/20 flex items-center justify-center mx-auto mb-4">
                  <Coins className="text-dream-accent1" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Mint PXB Points</h3>
                <p className="text-dream-foreground/70">
                  Every new user gets 50 PXB Points for free. Use them to place bets on tokens.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent2/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowUp className="text-dream-accent2" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Predict Token Movement</h3>
                <p className="text-dream-foreground/70">
                  Bet whether a token will go up (Moon) or down (Die) within the next hour.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent3/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-dream-accent3" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Win Points & Reputation</h3>
                <p className="text-dream-foreground/70">
                  Correct predictions win you PXB Points and boost your reputation score.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="glass-panel px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-dream-foreground/60 max-w-md mx-auto text-sm">
              This app allows you to bet with PXB Points on tokens migrating from PumpFun to Raydium. All bets are virtual and no real money is involved.
            </p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-dream-foreground/40">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PointsBettingDashboard;
