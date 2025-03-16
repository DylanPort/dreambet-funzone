
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import OrbitingParticles from '@/components/OrbitingParticles';

const BettingDashboard = () => {
  const { connected } = useWallet();
  console.log("BettingDashboard rendering, wallet connected:", connected);
  
  return (
    <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Token Migration Betting Platform
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-6">
              Bet on whether tokens will go up or down after migrating from PumpFun to Raydium
            </p>
            
            {/* Simple explanation of how the betting system works */}
            <div className="glass-panel max-w-3xl mx-auto p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                <HelpCircle className="h-5 w-5 text-dream-accent1" />
                How It Works
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-dream-foreground/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-dream-accent1/20 flex items-center justify-center">
                      <span className="font-bold">1</span>
                    </div>
                    <h3 className="font-medium">Pick a Token</h3>
                  </div>
                  <p className="text-sm text-dream-foreground/70">
                    Choose any token that's migrating from PumpFun to Raydium that you want to bet on.
                  </p>
                </div>
                
                <div className="bg-dream-foreground/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-dream-accent2/20 flex items-center justify-center">
                      <span className="font-bold">2</span>
                    </div>
                    <h3 className="font-medium">Place Your Bet</h3>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm">MOON: Price up</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-4 h-4 text-red-400" />
                      <span className="text-sm">DIE: Price down</span>
                    </div>
                  </div>
                  <p className="text-sm text-dream-foreground/70">
                    Predict if the token will go up or down by at least 10% after migrating.
                  </p>
                </div>
                
                <div className="bg-dream-foreground/5 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-dream-accent3/20 flex items-center justify-center">
                      <span className="font-bold">3</span>
                    </div>
                    <h3 className="font-medium">Win or Lose</h3>
                  </div>
                  <p className="text-sm text-dream-foreground/70">
                    If your prediction is correct, you'll win double your bet in PXB Points. If not, your points go back to the house.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-dream-foreground/60 border-t border-dream-foreground/10 pt-4">
                Bets are tracked automatically and settled when the time expires. You're betting against the house, not other players.
              </div>
            </div>
            
            {!connected && (
              <div className="mt-8 glass-panel inline-flex items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>
            )}
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
    </>
  );
};

export default BettingDashboard;
