
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, Search, Rocket, Sparkles, TrendingUp, DollarSign, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import TrendingTokensList from '@/components/TrendingTokensList';
import SearchedTokensReel from '@/components/SearchedTokensReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import TokenSearchBar from '@/components/TokenSearchBar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import Footer from '@/components/Footer';

const TradingDashboard = () => {
  const {
    connected
  } = useWallet();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const [readSteps, setReadSteps] = useState({
    selectToken: false,
    tradePXB: false,
    buildPortfolio: false
  });
  const [showGift, setShowGift] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  
  console.log("TradingDashboard rendering, wallet connected:", connected);
  const allStepsCompleted = Object.values(readSteps).every(step => step);

  useEffect(() => {
    if (allStepsCompleted && !showGift) {
      setTimeout(() => {
        setShowGift(true);
        setUnlockAnimation(true);
        toast({
          title: "🎉 Tutorial Completed!",
          description: "You've unlocked the ultimate trading experience!"
        });
      }, 500);
    }
  }, [readSteps, showGift, toast]);

  return <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          {/* Add search bar section */}
          <section className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/5 via-transparent to-dream-accent3/5 blur-xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-dream-accent2/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00ffe0] to-[#4b8ef3]">
                Trade Any Solana Token
              </h2>
              <p className="text-dream-foreground/60 mt-2 max-w-xl mx-auto">
                Enter a token contract address to instantly start trading any token on Solana with PXB Points
              </p>
            </div>
            
            <TokenSearchBar />
          </section>
        
          <section className="mb-6 text-center py-0 my-0 mx-0 sm:mx-4 md:mx-8 lg:mx-[240px] px-1 sm:px-[11px]">
            {!connected && <div className="mt-8 glass-panel inline-flex flex-col sm:flex-row items-center gap-3 p-4">
                <Wallet className="text-green-400" />
                <span>Connect your Solana wallet to start trading</span>
                <WalletConnectButton />
              </div>}
          </section>
          
          <div className="mb-6">
            <TrendingTokensList />
          </div>
          
          {/* Add the SearchedTokensReel component here */}
          <div className="mb-6">
            <SearchedTokensReel />
          </div>
          
          {/* How It Works Section */}
          <section className="mt-16">
            <h2 className="text-2xl font-display font-bold text-dream-foreground mb-6 text-center">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent1/20 flex items-center justify-center mx-auto mb-4">
                  <Search className="text-dream-accent1" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Tokens</h3>
                <p className="text-dream-foreground/70">
                  Search for any Solana token by name, symbol, or contract address to start trading with PXB Points.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent2/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-dream-accent2" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Trade with PXB</h3>
                <p className="text-dream-foreground/70">
                  Use your PXB Points to buy and sell tokens. Track your portfolio and see your profits in real-time.
                </p>
              </div>
              
              <div className="glass-panel p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-dream-accent3/20 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-dream-accent3" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Earn Rewards</h3>
                <p className="text-dream-foreground/70">
                  Earn more PXB Points through successful trades, referrals, and community activities. Compete on the leaderboard.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </>;
};

export default TradingDashboard;
