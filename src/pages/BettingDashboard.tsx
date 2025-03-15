
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import BetsList from '@/components/BetsList';
import OrbitingParticles from '@/components/OrbitingParticles';
import TrendingTokens from '@/components/TrendingTokens';
import PumpFunTokens from '@/components/PumpFunTokens';
import TopVolumeTokens from '@/components/TopVolumeTokens';
import VolumeFilteredTokens from '@/components/VolumeFilteredTokens';
import TopPumpFunTokensByVolume from '@/components/TopPumpFunTokensByVolume';
import PointsLeaderboard from '@/components/PointsLeaderboard';
import PointsDisplay from '@/components/PointsDisplay';

const BettingDashboard = () => {
  const {
    connected
  } = useWallet();
  console.log("BettingDashboard rendering, wallet connected:", connected);
  return <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Token Migration Prediction
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto">
              Bet with PXB Points on whether tokens will go up or down after migrating from PumpFun to Raydium
            </p>
            
            {!connected && <div className="mt-8 glass-panel inline-flex items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your wallet to get 50 PXB Points and start predicting</span>
                <WalletConnectButton />
              </div>}
              
            {connected && <div className="mt-8 glass-panel inline-flex items-center gap-3 p-4">
                <Zap className="text-yellow-400" />
                <span>Use your PXB Points to make predictions and climb the leaderboard!</span>
                <PointsDisplay />
              </div>}
          </section>
          
          {/* Points Leaderboard Section - NEW */}
          <section className="mb-10">
            <PointsLeaderboard />
          </section>

          {/* Top PumpFun Tokens By Volume */}
          <section className="mb-10">
            <TopPumpFunTokensByVolume />
          </section>
          
          {/* Volume Filtered Tokens Section */}
          <section className="mb-10">
            <VolumeFilteredTokens />
          </section>
          
          {/* Top Volume Tokens Section */}
          <section className="mb-10">
            <TopVolumeTokens />
          </section>
          
          {/* PumpFun Tokens Section */}
          <section className="mb-10">
            <PumpFunTokens />
          </section>
          
          {/* Trending Tokens Section */}
          <section className="mb-10">
            <TrendingTokens />
          </section>

          {/* Dashboard Sections */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <MigratingTokenList />
            <OpenBetsList />
          </div>
          
          {/* How it Works Section */}
          <section className="mt-16">
            <h2 className="text-2xl font-display font-bold text-dream-foreground mb-6 text-center">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent1/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowUp className="text-dream-accent1" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create a Prediction</h3>
                <p className="text-dream-foreground/70">
                  Choose a token, predict if it will go up or down, and set your bet amount in PXB Points.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent2/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowDown className="text-dream-accent2" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Matched</h3>
                <p className="text-dream-foreground/70">
                  Wait for another user to take the opposite position on your prediction.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent3/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Win Points</h3>
                <p className="text-dream-foreground/70">
                  If your prediction is correct after 1 hour, you win PXB Points and climb the leaderboard!
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
              This app allows you to predict tokens migrating from PumpFun to Raydium. Earn PXB Points and build your reputation as a trader.
            </p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-dream-foreground/40">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>;
};
export default BettingDashboard;
