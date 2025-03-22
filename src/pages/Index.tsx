
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, ExternalLink, Coins, Sparkles, Zap, Activity, Trophy, Users, Wallet, ShieldCheck, Cake, Gift, Star, PartyPopper, Award, BarChart3 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BetReel from '@/components/BetReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import FloatingImages from '@/components/FloatingImages';
import InteractiveTour from '@/components/InteractiveTour';
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
            <div className="flex flex-row-reverse md:flex-row flex-wrap md:flex-nowrap gap-6 w-full">
              <div className="w-full md:w-1/2 flex justify-center">
                <InteractiveTour />
              </div>
              
              <div className="w-full md:w-1/2 flex justify-center">
                <FuturisticTokenDisplay tokens={latestTokens} />
              </div>
            </div>
          </div>
          
          {!isMobile && <div className="relative text-lg md:text-xl max-w-3xl mx-auto md:mx-0 mb-8 
              bg-[radial-gradient(ellipse_at_center,rgba(0,238,255,0.05),transparent_80%)]
              backdrop-blur-[1px] rounded-xl border border-white/5
              animate-entrance overflow-hidden
              before:content-[''] before:absolute before:inset-0 
              before:bg-[radial-gradient(ellipse_at_center,rgba(0,238,255,0.1),transparent_70%)] 
              before:animate-pulse-glow">
              
              
              
              
              
              
            </div>}
          
          <div className="flex justify-center gap-4 mt-10 mb-16">
            <div className={`flex ${isMobile ? 'flex-row' : 'flex-col sm:flex-row'} gap-4`}>
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-float">
                <Link to="/betting" className="relative overflow-hidden group transition-all duration-500
                  transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer">
                  
                  <img src="/lovable-uploads/0107f44c-b620-4ddc-8263-65650ed1ba7b.png" alt="Playground" className="w-64 h-auto filter drop-shadow-[0_0_30px_rgba(139,92,246,0.7)]
                    transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(139,92,246,0.9)]" />
                  
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-blue-400/10 to-purple-500/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </Link>
                <div className="mt-4 text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent
                  drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
                  Playground
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-float-delayed">
                    <div className="relative overflow-hidden group transition-all duration-500
                      transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px] cursor-pointer">
                      
                      <img src="/lovable-uploads/90de812c-ed2e-41af-bc5b-33f452833151.png" alt="Mint PXB Points" className="w-64 h-auto filter drop-shadow-[0_0_30px_rgba(246,148,92,0.8)]
                        transition-all duration-500 hover:drop-shadow-[0_0_40px_rgba(246,148,92,0.9)]" />
                      
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dream-accent1/0 via-dream-accent2/10 to-dream-accent1/10 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>
                    <div className="mt-4 text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent
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
            <h2 id="leaderboard" className="text-2xl font-bold text-center mb-8 
                bg-gradient-to-r from-white via-green-300 to-blue-400 bg-clip-text text-transparent 
                flex items-center justify-center gap-2 text-shadow-sm filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              <img src="/lovable-uploads/6b0abde7-e707-444b-ae6c-40795243d6f7.png" alt="Crown" className="h-16 w-16" />
              
              PXB Leaderboard & Statistics
              
            </h2>
            
            <div className="glass-panel p-6 rounded-lg mb-8 py-[16px] my-[80px]">
              <PXBSupplyProgress />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 py-[2px] my-0">
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
            
            
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-white/60">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>;
};

export default Index;
