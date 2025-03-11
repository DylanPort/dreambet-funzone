
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import BetsList from '@/components/BetsList';
import OrbitingParticles from '@/components/OrbitingParticles';
import TrendingTokens from '@/components/TrendingTokens';
import PumpFunTokens from '@/components/PumpFunTokens';
import TopVolumeTokens from '@/components/TopVolumeTokens';

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
              P2P Token Migration Betting
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto">
              Bet on whether tokens will go up or down after migrating from PumpFun to Raydium
            </p>
            
            {!connected && <div className="mt-8 glass-panel inline-flex items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>}
          </section>

          {/* PumpFun Tokens Section */}
          <section className="mb-10">
            <PumpFunTokens />
          </section>
          
          {/* Top Volume Tokens Section */}
          <section className="mb-10">
            <TopVolumeTokens />
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
                <h3 className="text-lg font-semibold mb-2">Create a Bet</h3>
                <p className="text-dream-foreground/70">
                  Choose a token, predict if it will go up or down, and set your bet amount in SOL.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent2/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowDown className="text-dream-accent2" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Matched</h3>
                <p className="text-dream-foreground/70">
                  Wait for another user to take the opposite position on your bet.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent3/20 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="text-dream-accent3" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Win SOL</h3>
                <p className="text-dream-foreground/70">
                  If your prediction is correct after 1 hour, you win the total bet amount!
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
              This app allows you to bet on tokens migrating from PumpFun to Raydium. All bets are facilitated through smart contracts on the Solana blockchain.
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
