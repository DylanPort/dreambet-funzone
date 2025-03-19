
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, HelpCircle, Rocket, Skull, Trophy, Zap, Check, Gift, Star, Hand, HandMetal, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import TrendingBetsList from '@/components/TrendingBetsList';
import OrbitingParticles from '@/components/OrbitingParticles';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          <section className="mb-12 text-center py-0 my-0 mx-0 sm:mx-4 md:mx-8 lg:mx-[240px] px-1 sm:px-[11px]">
            {!connected && <div className="mt-8 glass-panel inline-flex flex-col sm:flex-row items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>}
          </section>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
            <MigratingTokenList />
            <OpenBetsList />
          </div>
          
          <div className="mb-8">
            <TrendingBetsList />
          </div>
        </div>
      </main>
      
      <footer className="glass-panel px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-dream-foreground/60 max-w-md mx-auto text-xs sm:text-sm">
              This app allows you to bet on tokens migrating from PumpFun to Raydium. All bets are facilitated through smart contracts on the Solana blockchain.
            </p>
            <div className="mt-4 sm:mt-6 border-t border-white/10 pt-4 sm:pt-6 text-xs sm:text-sm text-dream-foreground/40">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>;
};

export default BettingDashboard;
