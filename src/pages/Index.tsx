import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, ExternalLink, Coins, Sparkles, Zap, Activity, Trophy, Users, Wallet, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BetReel from '@/components/BetReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import FloatingImages from '@/components/FloatingImages';
import AnimatedLogo from '@/components/AnimatedLogo';
import FuturisticTokenDisplay from '@/components/FuturisticTokenDisplay';
import { Button } from '@/components/ui/button';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';
import PXBOnboarding from '@/components/PXBOnboarding';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import RecentTokenTrades from '@/components/RecentTokenTrades';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PXBLeaderboard from "@/components/PXBLeaderboard";
import PXBUserStats from "@/components/PXBUserStats";
import PXBSupplyProgress from "@/components/PXBSupplyProgress";

const Index = () => {
  const [latestTokens, setLatestTokens] = useState<any[]>([]);
  const pumpPortal = usePumpPortalWebSocket();
  const {
    userProfile
  } = usePXBPoints();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (pumpPortal.connected) {
      pumpPortal.subscribeToNewTokens();
    }
  }, [pumpPortal.connected]);

  useEffect(() => {
    const tokens = [];
    if (pumpPortal.recentTokens && pumpPortal.recentTokens.length > 0) {
      for (let i = 0; i < Math.min(3, pumpPortal.recentTokens.length); i++) {
        const formattedToken = formatWebSocketTokenData(pumpPortal.recentTokens[i]);
        tokens.push(formattedToken);
      }
    }
    if (tokens.length < 3 && pumpPortal.rawTokens && pumpPortal.rawTokens.length > 0) {
      for (let i = 0; i < Math.min(3 - tokens.length, pumpPortal.rawTokens.length); i++) {
        const rawToken = pumpPortal.rawTokens[i];
        if (!tokens.some(t => t.id === rawToken.mint)) {
          tokens.push({
            id: rawToken.mint,
            name: rawToken.name || 'Unknown Token',
            symbol: rawToken.symbol || '',
            logo: '🪙',
            imageUrl: rawToken.uri || '',
            currentPrice: rawToken.marketCapSol ? parseFloat((rawToken.marketCapSol / 1000000000).toFixed(6)) : 0,
            change24h: Math.random() * 40 - 20
          });
        }
      }
    }
    while (tokens.length < 3) {
      const placeholderId = `placeholder-${tokens.length}`;
      if (!tokens.some(t => t.id === placeholderId)) {
        tokens.push({
          id: placeholderId,
          name: `Token ${tokens.length + 1}`,
          symbol: `T${tokens.length + 1}`,
          logo: '🪙',
          imageUrl: '',
          currentPrice: Math.random() * 0.1,
          change24h: Math.random() * 40 - 20
        });
      }
    }
    setLatestTokens(tokens);
  }, [pumpPortal.recentTokens, pumpPortal.rawTokens]);

  const getTokenSymbol = (token: any) => {
    if (!token) return 'T';
    return token.symbol ? token.symbol.charAt(0).toUpperCase() : 'T';
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "0.000000";
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  };

  return <>
      <OrbitingParticles />
      <Navbar />
      <BetReel />
      
      <div className="h-20 py-0 my-0"></div>
      
      <main className="min-h-screen overflow-hidden">
        <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <FloatingImages />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-16 animate-fade-in relative z-10">
            <div className="text-center md:text-left md:flex-1">
              <AnimatedLogo />
              
              <div className="relative text-lg md:text-xl max-w-3xl mx-auto md:mx-0 mb-8 
                bg-[radial-gradient(ellipse_at_center,rgba(0,238,255,0.05),transparent_80%)]
                backdrop-blur-[1px] rounded-xl border border-white/5
                animate-entrance overflow-hidden
                before:content-[''] before:absolute before:inset-0 
                before:bg-[radial-gradient(ellipse_at_center,rgba(0,238,255,0.1),transparent_70%)] 
                before:animate-pulse-glow">
                
                <div className="p-4 border-b border-white/10">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-center gap-2 text-white/90 hover:text-white/100 transition-colors group">
                      <Wallet className="h-5 w-5 text-dream-accent1 group-hover:text-dream-accent1/90 animate-pulse-subtle" />
                      <span className="bg-gradient-to-r from-dream-accent1/90 to-dream-accent3/90 bg-clip-text text-transparent font-medium">Buy some PXB tokens</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-white/90 hover:text-white/100 transition-colors group">
                      <ShieldCheck className="h-5 w-5 text-dream-accent2 group-hover:text-dream-accent2/90 animate-pulse-subtle" />
                      <span className="bg-gradient-to-r from-dream-accent2/90 to-dream-accent1/90 bg-clip-text text-transparent font-medium">Connect your wallet securely</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-white/90 hover:text-white/100 transition-colors group">
                      <Sparkles className="h-5 w-5 text-dream-accent3 group-hover:text-dream-accent3/90 animate-pulse-subtle" />
                      <span className="bg-gradient-to-r from-dream-accent3/90 to-dream-accent2/90 bg-clip-text text-transparent font-medium">Mint PXB points & start betting</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-black/20">
                  <h3 className="text-center font-bold mb-2 text-white text-lg">
                    <span className="inline-block relative">
                      Bet on tokens
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-dream-accent2 to-dream-accent1"></div>
                    </span>
                  </h3>
                  
                  <div className="flex justify-center items-center gap-6 my-2">
                    <div className="relative group cursor-pointer">
                      <span className="relative inline-flex items-center gap-1 text-green-400 font-bold animate-bob">
                        <img src="/lovable-uploads/5fbe719e-2eae-4c8e-ade1-fb21115ea119.png" alt="Rocket" className="h-8 w-8 animate-float filter drop-shadow-[0_0_8px_rgba(22,163,74,0.8)]" />
                        <span className="bg-green-500/80 px-2 py-0.5 rounded-lg text-white group-hover:bg-green-500 transition-colors">MOON</span>
                      </span>
                      <div className="absolute inset-0 bg-green-400/10 blur-md rounded-full scale-0 group-hover:scale-125 transition-transform duration-300"></div>
                    </div>
                    
                    <div className="text-white/80 text-2xl font-light">or</div>
                    
                    <div className="relative group cursor-pointer">
                      <span className="relative inline-flex items-center gap-1 text-red-400 font-bold">
                        <img src="/lovable-uploads/c97a2ff8-a872-40d8-9b65-59831498a464.png" alt="Skull" className="h-8 w-8 animate-pulse filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="bg-red-500/80 px-2 py-0.5 rounded-lg text-white group-hover:bg-red-500 transition-colors">DUST</span>
                      </span>
                      <div className="absolute inset-0 bg-red-400/10 blur-md rounded-full scale-0 group-hover:scale-125 transition-transform duration-300"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-b from-black/5 to-black/20">
                  <h3 className="text-center font-bold mb-3 text-white">
                    <span className="relative inline-block">
                      It's that simple
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-dream-accent1 to-dream-accent2"></div>
                    </span>
                  </h3>
                  
                  <div className="flex justify-around flex-wrap gap-2">
                    <div className="relative px-4 py-2 glass-panel hover:bg-white/10 transition-colors rounded-lg">
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-dream-accent1/30 flex items-center justify-center text-sm font-bold">1</div>
                      <span className="text-white">predict</span>
                    </div>
                    
                    <div className="relative px-4 py-2 glass-panel hover:bg-white/10 transition-colors rounded-lg">
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-dream-accent2/30 flex items-center justify-center text-sm font-bold">2</div>
                      <span className="text-white">place your bet</span>
                    </div>
                    
                    <div className="relative px-4 py-2 glass-panel hover:bg-white/10 transition-colors rounded-lg">
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-dream-accent3/30 flex items-center justify-center text-sm font-bold">3</div>
                      <span className="text-white">build your reputation</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-t from-white/5 to-transparent">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center gap-1 px-6 py-2 rounded-full
                      bg-gradient-to-r from-dream-accent2/20 via-yellow-400/20 to-dream-accent1/20 group">
                      <span className="bg-gradient-to-r from-dream-accent2 via-yellow-400 to-dream-accent1 bg-clip-text text-transparent animate-gradient-move font-bold text-lg">
                        Unlock life-changing perks!
                      </span>
                      <span className="ml-1 animate-pulse">✨</span>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-dream-accent2/0 via-dream-accent3/10 to-dream-accent1/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:flex-1 flex justify-center mt-8 md:mt-0">
              <FuturisticTokenDisplay tokens={latestTokens} />
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mt-10 mb-16">
            <div className={`flex ${isMobile ? 'flex-row' : 'flex-col sm:flex-row'} gap-4`}>
              <Link to="/betting">
                <div className="relative overflow-hidden group transition-all duration-500
                  transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer">
                  
                  <img src="/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png" alt="Start Betting" className="w-64 h-auto filter drop-shadow-[0_0_30px_rgba(139,92,246,0.7)]
                    transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(139,92,246,0.9)]" />
                  
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-blue-400/10 to-purple-500/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                    text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent
                    drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
                    Start Betting
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>
              </Link>
              
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative overflow-hidden group transition-all duration-500
                    transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer">
                    
                    <img src="/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png" alt="Mint PXB Points" className="w-64 h-auto filter drop-shadow-[0_0_30px_rgba(246,148,92,0.8)]
                      transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(246,148,92,0.9)]" />
                    
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dream-accent1/0 via-dream-accent2/10 to-dream-accent1/10 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                      text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent
                      drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
                      {userProfile ? 'Your PXB Points' : 'Mint PXB Points'}
                      <Sparkles className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md bg-transparent border-none shadow-none">
                  <PXBOnboarding />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto mb-16">
            <RecentTokenTrades />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-2xl font-bold text-center mb-8 text-dream-foreground">
              <span className="bg-gradient-to-r from-dream-accent1 to-dream-accent2 text-transparent bg-clip-text">
                Real-Time Market Data
              </span>
            </h2>
            
            <div className="glass-panel p-6 rounded-lg mb-8">
              <PXBSupplyProgress />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 my-[-56px] py-[2px]">
              <div className="glass-panel p-6">
                <PXBUserStats />
              </div>
              
              <div className="glass-panel p-6">
                <PXBLeaderboard />
              </div>
            </div>
          </div>
        
        </section>
      </main>
      
      <footer className="glass-panel mt-20 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Link to="/" className="text-xl font-display font-bold text-gradient mb-3 inline-block">
              PumpXBounty
            </Link>
            <p className="text-white/80 max-w-md mx-auto text-sm">
              PumpXBounty is a platform for predicting the future of tokens migrating from PumpFun to Raydium. This is for entertainment purposes only.
            </p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-white/60">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>;
};

export default Index;
