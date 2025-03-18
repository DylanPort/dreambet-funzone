import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, HelpCircle, Rocket, Skull, Trophy, Zap, Check, Gift, Star, Hand, HandMetal, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import MigratingTokenList from '@/components/MigratingTokenList';
import OpenBetsList from '@/components/OpenBetsList';
import OrbitingParticles from '@/components/OrbitingParticles';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      setGlowIntensity(prev => (prev === 10 ? 20 : 10));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <OrbitingParticles />
      <Navbar />

      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <section className="mb-12 text-center py-0 my-0 mx-0 sm:mx-4 md:mx-8 lg:mx-[240px] px-1 sm:px-[11px]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">SHOW YOUR TRADING SKILLS</h1>
            <p className="text-base sm:text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-6">Bet on whether tokens will go up or down and earn more PXB Points</p>
            
            <div 
              className="glass-panel max-w-3xl mx-auto p-3 sm:p-6 rounded-lg relative overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 via-dream-accent2/10 to-dream-accent3/10" 
                animate={{
                  background: unlockAnimation 
                    ? ["linear-gradient(90deg, rgba(255,61,252,0.2) 0%, rgba(0,238,255,0.2) 50%, rgba(123,97,255,0.2) 100%)", 
                       "linear-gradient(90deg, rgba(123,97,255,0.2) 0%, rgba(255,61,252,0.2) 50%, rgba(0,238,255,0.2) 100%)", 
                       "linear-gradient(90deg, rgba(0,238,255,0.2) 0%, rgba(123,97,255,0.2) 50%, rgba(255,61,252,0.2) 100%)"]
                    : isHovering 
                      ? `linear-gradient(90deg, rgba(255,61,252,0.${glowIntensity/100}) 0%, rgba(0,238,255,0.${glowIntensity/100}) 50%, rgba(123,97,255,0.${glowIntensity/100}) 100%)`
                      : `linear-gradient(90deg, rgba(255,61,252,0.${glowIntensity/100}) 0%, rgba(0,238,255,0.${glowIntensity/100}) 50%, rgba(123,97,255,0.${glowIntensity/100}) 100%)`,
                  boxShadow: pulseEffect 
                    ? ["0 0 10px rgba(255,61,252,0.2)", "0 0 20px rgba(0,238,255,0.3)", "0 0 10px rgba(123,97,255,0.2)"]
                    : ["0 0 15px rgba(255,61,252,0.1)", "0 0 10px rgba(0,238,255,0.15)", "0 0 15px rgba(123,97,255,0.1)"]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="absolute w-1 h-1 rounded-full bg-white/60"
                    initial={{ 
                      x: Math.random() * 100 + "%", 
                      y: Math.random() * 100 + "%", 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: ["-10%", "110%"],
                      opacity: [0, 0.7, 0]
                    }}
                    transition={{
                      duration: 7 + Math.random() * 5,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                ))}
                
                {isHovering && Array.from({ length: 5 }).map((_, index) => (
                  <motion.div
                    key={`sparkle-${index}`}
                    className="absolute w-2 h-2"
                    initial={{ 
                      x: 40 + Math.random() * 60 + "%", 
                      y: 40 + Math.random() * 60 + "%", 
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 0.9, 0],
                      rotate: [0, 90]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  >
                    <Sparkles className="text-yellow-400/70" size={16} />
                  </motion.div>
                ))}
              </motion.div>
                
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-dream-accent3 via-dream-accent2 to-dream-accent1"></div>
                
              <motion.div 
                className="absolute left-0 w-full h-[2px] bg-dream-accent2/20"
                animate={{
                  top: ["0%", "100%"]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
                
              <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center justify-center gap-2 relative">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-dream-accent2/30 flex items-center justify-center animate-pulse-glow">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-dream-accent2" />
                </div>
                <span className="text-gradient">BETTING INTERFACE</span>
                {allStepsCompleted && <motion.div initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
              }} className="ml-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </motion.div>}
              </h2>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left relative z-10">
                <motion.div className={`glass-panel bg-dream-foreground/5 p-4 rounded-lg border transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(255,61,252,0.3)] ${readSteps.selectToken ? 'border-dream-accent1/50' : 'border-dream-accent1/20'} ${!readSteps.selectToken ? 'blur-[1px]' : ''} relative`} whileHover={{
                  y: -5
                }} onClick={() => {
                  if (!readSteps.selectToken) {
                    setReadSteps(prev => ({
                      ...prev,
                      selectToken: true
                    }));
                    toast({
                      title: "Step 1 Completed!",
                      description: "You've learned how to select tokens!"
                    });
                  }
                }}>
                  {!readSteps.selectToken && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div 
                            className="absolute -right-3 -bottom-3 z-20 w-10 h-10 bg-dream-accent1/30 rounded-full flex items-center justify-center"
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            <Hand className="h-6 w-6 text-dream-accent1 transform -rotate-45" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-dream-accent1/90 border-dream-accent1">
                          <p>Click here to learn about selecting tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent1/20 flex items-center justify-center animate-pulse-subtle">
                      <Zap className="h-6 w-6 text-dream-accent1" />
                    </div>
                    <h3 className="font-medium text-gradient">SELECT TOKEN</h3>
                    {readSteps.selectToken && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}>
                        <Check className="h-5 w-5 text-green-400" />
                      </motion.div>}
                  </div>
                  <p className="text-sm text-dream-foreground/80">Analyze market data and token you want to bet on.</p>
                  {!readSteps.selectToken && <div className="mt-3 text-xs text-dream-accent1 animate-pulse">Click to reveal this step</div>}
                </motion.div>
                
                <motion.div className={`glass-panel bg-dream-foreground/5 p-4 rounded-lg border transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(0,238,255,0.3)] ${readSteps.placeBet ? 'border-dream-accent2/50' : 'border-dream-accent2/20'} ${!readSteps.placeBet ? 'blur-[1px]' : ''} relative`} whileHover={{
                y: -5
              }} onClick={() => {
                if (readSteps.selectToken && !readSteps.placeBet) {
                  setReadSteps(prev => ({
                    ...prev,
                    placeBet: true
                  }));
                  toast({
                    title: "Step 2 Completed!",
                    description: "You've learned how to place bets!"
                  });
                } else if (!readSteps.selectToken) {
                  toast({
                    title: "Complete step 1 first!",
                    description: "You need to understand token selection before placing bets.",
                    variant: "destructive"
                  });
                }
              }}>
                  {readSteps.selectToken && !readSteps.placeBet && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div 
                            className="absolute -right-3 -bottom-3 z-20 w-10 h-10 bg-dream-accent2/30 rounded-full flex items-center justify-center"
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            <Hand className="h-6 w-6 text-dream-accent2 transform -rotate-45" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-dream-accent2/90 border-dream-accent2">
                          <p>Click here to learn about placing bets</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent2/20 flex items-center justify-center animate-pulse-subtle">
                      <div className="relative">
                        <Wallet className="h-6 w-6 text-dream-accent2" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gradient">PLACE BET</h3>
                    {readSteps.placeBet && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}>
                        <Check className="h-5 w-5 text-green-400" />
                      </motion.div>}
                  </div>
                  <div className="flex justify-between mb-2 space-x-2">
                    <div className="flex-1 bg-gradient-to-r from-green-500/20 to-green-500/10 p-2 rounded-lg flex items-center justify-center gap-1 group cursor-pointer hover:from-green-500/30 hover:to-green-500/20 transition-all">
                      <img src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" alt="Rocket" className="w-5 h-5 group-hover:animate-bounce" />
                      <span className="text-sm font-bold text-green-400">MOON</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-red-500/20 to-red-500/10 p-2 rounded-lg flex items-center justify-center gap-1 group cursor-pointer hover:from-red-500/30 hover:to-red-500/20 transition-all">
                      <img src="/lovable-uploads/d4517df7-78f7-4229-a4d5-0e4cba7bdbf1.png" alt="Skull" className="w-5 h-5 group-hover:animate-pulse" />
                      <span className="text-sm font-bold text-red-400">DUST</span>
                    </div>
                  </div>
                  <p className="text-sm text-dream-foreground/80">Bet whether the token will rise or fall.</p>
                  {!readSteps.placeBet && readSteps.selectToken && <div className="mt-3 text-xs text-dream-accent2 animate-pulse">Click to reveal this step</div>}
                </motion.div>
                
                <motion.div className={`glass-panel bg-dream-foreground/5 p-4 rounded-lg border transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_15px_rgba(123,97,255,0.3)] ${readSteps.collectRewards ? 'border-dream-accent3/50' : 'border-dream-accent3/20'} ${!readSteps.collectRewards ? 'blur-[1px]' : ''} relative`} whileHover={{
                y: -5
              }} onClick={() => {
                if (readSteps.selectToken && readSteps.placeBet && !readSteps.collectRewards) {
                  setReadSteps(prev => ({
                    ...prev,
                    collectRewards: true
                  }));
                  toast({
                    title: "Step 3 Completed!",
                    description: "You've learned how to collect rewards!"
                  });
                } else if (!readSteps.placeBet) {
                  toast({
                    title: "Complete previous steps first!",
                    description: "You need to understand betting before collecting rewards.",
                    variant: "destructive"
                  });
                }
              }}>
                  {readSteps.placeBet && !readSteps.collectRewards && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div 
                            className="absolute -right-3 -bottom-3 z-20 w-10 h-10 bg-dream-accent3/30 rounded-full flex items-center justify-center"
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            <HandMetal className="h-6 w-6 text-dream-accent3 transform -rotate-45" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-dream-accent3/90 border-dream-accent3">
                          <p>Click here to learn about collecting rewards</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-dream-accent3/20 flex items-center justify-center animate-pulse-subtle">
                      <Trophy className="h-6 w-6 text-dream-accent3" />
                    </div>
                    <h3 className="font-medium text-gradient">COLLECT REWARDS</h3>
                    {readSteps.collectRewards && <motion.div initial={{
                    scale: 0
                  }} animate={{
                    scale: 1
                  }} transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}>
                        <Check className="h-5 w-5 text-green-400" />
                      </motion.div>}
                  </div>
                  <div className="mb-2 p-2 glass-panel rounded-lg text-center">
                    <span className="text-xl font-bold text-gradient-active">2X</span>
                    <span className="text-sm block text-dream-foreground/80">Your PXB Points</span>
                  </div>
                  <p className="text-sm text-dream-foreground/80">
                    Correct predictions double your bet in PXB Points. Wrong predictions? Your points return to the house.
                  </p>
                  {!readSteps.collectRewards && readSteps.placeBet && <div className="mt-3 text-xs text-dream-accent3 animate-pulse">Click to reveal this step</div>}
                </motion.div>
              </div>
              
              <div className="mt-6 text-sm text-dream-foreground/70 pt-3 border-t border-dream-foreground/10 relative">
                <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent"></div>
                
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-dream-accent2/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-dream-accent2" />
                  </div>
                  <span>Bets are automatically tracked and settled when the timeframe expires</span>
                </div>
                
                {showGift && <motion.div initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.5
              }} className="mt-4 p-3 bg-gradient-to-r from-dream-accent1/20 via-dream-accent2/20 to-dream-accent3/20 rounded-lg border border-dream-accent2/30">
                    <div className="flex items-center justify-center gap-3">
                      <motion.div animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }} transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}>
                        <Gift className="h-6 w-6 text-dream-accent1" />
                      </motion.div>
                      <div className="text-center">
                        <h4 className="font-bold text-gradient">Tutorial Completed!</h4>
                        <p className="text-sm text-dream-foreground/80">You're ready to start betting on tokens!</p>
                      </div>
                      <motion.div animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }} transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}>
                        <Star className="h-6 w-6 text-yellow-400" />
                      </motion.div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      
                    </div>
                  </motion.div>}
              </div>
            </div>
            
            {!connected && <div className="mt-8 glass-panel inline-flex flex-col sm:flex-row items-center gap-3 p-4">
                <Wallet className="text-dream-accent2" />
                <span>Connect your Solana wallet to start betting</span>
                <WalletConnectButton />
              </div>}
          </section>
        
          <ScrollArea className="w-full pb-4 overflow-x-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8" style={{ minWidth: '1200px' }}>
              <MigratingTokenList />
              <OpenBetsList />
            </div>
          </ScrollArea>
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
    </>
  );
};
export default BettingDashboard;




