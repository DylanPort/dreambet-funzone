
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, HelpCircle, Rocket, Skull, Trophy, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import OrbitingParticles from '@/components/OrbitingParticles';

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
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">SHOW YOUR TRADING SKILLS</h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-6">Bet on whether tokens will go up or down and earn more PXB Points</p>
            
            {/* Futuristic Game-like explanation of how the betting system works */}
            <div className="glass-panel max-w-3xl mx-auto p-6 rounded-lg relative overflow-hidden">
              {/* Animated glow effect in the background */}
              <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 via-dream-accent2/10 to-dream-accent3/10 animate-gradient-move"></div>
              
              {/* Decorative tech elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-dream-accent3 via-dream-accent2 to-dream-accent1"></div>
              
              <h2 className="text-xl font-bold mb-3 flex items-center justify-center gap-2 relative">
                <div className="w-8 h-8 rounded-full bg-dream-accent2/30 flex items-center justify-center animate-pulse-glow">
                  <HelpCircle className="h-5 w-5 text-dream-accent2" />
                </div>
                <span className="text-gradient">BETTING INTERFACE</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left relative z-10">
                <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent1/20 hover:border-dream-accent1/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(255,61,252,0.3)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent1/20 flex items-center justify-center animate-pulse-subtle">
                      <Zap className="h-6 w-6 text-dream-accent1" />
                    </div>
                    <h3 className="font-medium text-gradient">SELECT TOKEN</h3>
                  </div>
                  <p className="text-sm text-dream-foreground/80">Analyze market data and choose any migrating token you want to bet on.</p>
                </div>
                
                <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent2/20 hover:border-dream-accent2/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,238,255,0.3)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent2/20 flex items-center justify-center animate-pulse-subtle">
                      <div className="relative">
                        <Wallet className="h-6 w-6 text-dream-accent2" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gradient">PLACE BET</h3>
                  </div>
                  <div className="flex justify-between mb-2 space-x-2">
                    <div className="flex-1 bg-gradient-to-r from-green-500/20 to-green-500/10 p-2 rounded-lg flex items-center justify-center gap-1 group cursor-pointer hover:from-green-500/30 hover:to-green-500/20 transition-all">
                      <img 
                        src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" 
                        alt="Rocket" 
                        className="w-5 h-5 group-hover:animate-bounce" 
                      />
                      <span className="text-sm font-bold text-green-400">MOON</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-red-500/20 to-red-500/10 p-2 rounded-lg flex items-center justify-center gap-1 group cursor-pointer hover:from-red-500/30 hover:to-red-500/20 transition-all">
                      <img 
                        src="/lovable-uploads/d4517df7-78f7-4229-a4d5-0e4cba7bdbf1.png" 
                        alt="Skull" 
                        className="w-5 h-5 group-hover:animate-pulse" 
                      />
                      <span className="text-sm font-bold text-red-400">DUST</span>
                    </div>
                  </div>
                  <p className="text-sm text-dream-foreground/80">Bet whether the token will rise or fall by at least 10% after migration.</p>
                </div>
                
                <div className="glass-panel bg-dream-foreground/5 p-4 rounded-lg border border-dream-accent3/20 hover:border-dream-accent3/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(123,97,255,0.3)]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent3/20 flex items-center justify-center animate-pulse-subtle">
                      <Trophy className="h-6 w-6 text-dream-accent3" />
                    </div>
                    <h3 className="font-medium text-gradient">COLLECT REWARDS</h3>
                  </div>
                  <div className="mb-2 p-2 glass-panel rounded-lg text-center">
                    <span className="text-xl font-bold text-gradient-active">2X</span>
                    <span className="text-sm block text-dream-foreground/80">Your PXB Points</span>
                  </div>
                  <p className="text-sm text-dream-foreground/80">
                    Correct predictions double your bet in PXB Points. Wrong predictions? Your points return to the house.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-dream-foreground/70 pt-3 border-t border-dream-foreground/10 relative">
                <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent"></div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-dream-accent2/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-dream-accent2" />
                  </div>
                  <span>Bets are automatically tracked and settled when the timeframe expires</span>
                </div>
              </div>
            </div>
            
            {!connected && <div className="mt-8 glass-panel inline-flex items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>}
          </section>
          
          {/* Dashboard Sections */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <MigratingTokenList />
            <OpenBetsList />
          </div>
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
