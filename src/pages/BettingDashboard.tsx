import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, HelpCircle, Rocket, Skull, Trophy, Zap, Check, Gift, Star, Hand, HandMetal, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import TrendingBetsList from '@/components/TrendingBetsList';
import SearchedTokensReel from '@/components/SearchedTokensReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import TokenSearchBar from '@/components/TokenSearchBar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Footer from '@/components/Footer';

const BettingDashboard = () => {
  const {
    connected
  } = useWallet();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const [readSteps, setReadSteps] = useState({
    selectToken: false,
    placeBet: false,
    collectRewards: false
  });
  const [showGift, setShowGift] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(10);
  console.log("BettingDashboard rendering, wallet connected:", connected);
  const allStepsCompleted = Object.values(readSteps).every(step => step);

  useEffect(() => {
    if (allStepsCompleted && !showGift) {
      setTimeout(() => {
        setShowGift(true);
        setUnlockAnimation(true);
        toast({
          title: "🎉 Tutorial Completed!",
          description: "You've unlocked the ultimate betting experience!"
        });
      }, 500);
    }
  }, [readSteps, showGift, toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(prev => !prev);
      setGlowIntensity(prev => prev === 10 ? 20 : 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
                Find Any Solana Token
              </h2>
              <p className="text-dream-foreground/60 mt-2 max-w-xl mx-auto">
                Enter a token contract address to instantly start betting on any token on Solana
              </p>
            </div>
            
            <TokenSearchBar />
          </section>
        
          <section className="mb-6 text-center py-0 my-0 mx-0 sm:mx-4 md:mx-8 lg:mx-[240px] px-1 sm:px-[11px]">
            {!connected && <div className="mt-8 glass-panel inline-flex flex-col sm:flex-row items-center gap-3 p-4">
                <Wallet className="text-green-400" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>}
          </section>
          
          <div className="mb-6">
            <TrendingBetsList />
          </div>
          
          {/* Add the SearchedTokensReel component here */}
          <div className="mb-6">
            <SearchedTokensReel />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
            <MigratingTokenList />
            <OpenBetsList />
          </div>
        </div>
      </main>
      
      <Footer />
    </>;
};

export default BettingDashboard;
