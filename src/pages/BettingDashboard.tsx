
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import { Wallet, Brain, ChevronDown, Info, Search, Filter, Clock } from 'lucide-react';
import OpenBetsList from '@/components/OpenBetsList';
import MigratingTokenList from '@/components/MigratingTokenList';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import OrbitingParticles from '@/components/OrbitingParticles';
import BetReel from '@/components/BetReel';

const BettingDashboard = () => {
  const [currentView, setCurrentView] = useState('bets');

  return (
    <div className="min-h-screen overflow-hidden">
      <OrbitingParticles />
      <Navbar />
      <BetReel />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <div className="w-full order-2 lg:order-1">
            <div className="mb-6">
              <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <TabsList className="inline-flex">
                    <TabsTrigger value="bets" className="text-sm">
                      Active Bets
                    </TabsTrigger>
                    <TabsTrigger value="tokens" className="text-sm">
                      New Tokens
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative hidden md:block">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-dream-foreground/50" />
                      <input
                        type="text"
                        placeholder="Search tokens..."
                        className="rounded-full bg-dream-background/50 border border-dream-foreground/10 text-sm py-2 pl-9 pr-4 w-48 focus:outline-none focus:ring-1 focus:ring-dream-accent1/50 focus:border-dream-accent1/50"
                      />
                    </div>
                    
                    <WalletMultiButton className="hidden sm:flex bg-dream-accent1 hover:bg-dream-accent1/90 text-white rounded-lg" />
                  </div>
                </div>
                
                <TabsContent value="bets" className="space-y-8 mt-2">
                  <OpenBetsList />
                </TabsContent>
                
                <TabsContent value="tokens" className="space-y-8 mt-2">
                  <MigratingTokenList />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="lg:w-80 order-1 lg:order-2 flex flex-col">
            <div className="glass-panel p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold">Quick Start</h2>
                <Info className="w-4 h-4 text-dream-foreground/60" />
              </div>
              
              <ol className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-dream-accent1/20 text-dream-accent1 text-xs font-bold">1</div>
                  <div>
                    <p className="text-dream-foreground/80">Connect your Solana wallet to start betting</p>
                    <WalletMultiButton className="mt-2 sm:hidden bg-dream-accent1 hover:bg-dream-accent1/90 text-white rounded-lg" />
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-dream-accent1/20 text-dream-accent1 text-xs font-bold">2</div>
                  <p className="text-dream-foreground/80">Click on a token or active bet to place your prediction</p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-dream-accent1/20 text-dream-accent1 text-xs font-bold">3</div>
                  <p className="text-dream-foreground/80">Choose "Moon" or "Die" and enter your bet amount</p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-dream-accent1/20 text-dream-accent1 text-xs font-bold">4</div>
                  <p className="text-dream-foreground/80">Wait for the results and collect your winnings</p>
                </li>
              </ol>
            </div>
            
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold">Betting Stats</h2>
                <Clock className="w-4 h-4 text-dream-foreground/60" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-dream-foreground/70">Active Bets</span>
                    <span className="font-mono font-medium">24</span>
                  </div>
                  <div className="w-full h-1.5 bg-dream-background/70 rounded-full mt-1.5">
                    <div className="h-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-dream-foreground/70">Total Bets</span>
                    <span className="font-mono font-medium">215</span>
                  </div>
                  <div className="w-full h-1.5 bg-dream-background/70 rounded-full mt-1.5">
                    <div className="h-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-dream-foreground/70">SOL Volume</span>
                    <span className="font-mono font-medium">45.8 SOL</span>
                  </div>
                  <div className="w-full h-1.5 bg-dream-background/70 rounded-full mt-1.5">
                    <div className="h-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BettingDashboard;
