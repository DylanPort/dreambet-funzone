
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
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import RecentTokenTrades from '@/components/RecentTokenTrades';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PXBLeaderboard from "@/components/PXBLeaderboard";
import PXBUserStats from "@/components/PXBUserStats";
import PXBSupplyProgress from "@/components/PXBSupplyProgress";
import Footer from '@/components/Footer';

const Index = () => {
  const { userProfile } = usePXBPoints();
  const isMobile = useIsMobile();

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
              
              <div className="hidden md:flex md:w-1/2 justify-center">
                <FuturisticTokenDisplay />
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
              
              
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-float-delayed">
                    <img alt="Mint PXB Points" className="w-64 h-auto transition-all duration-500" src="/lovable-uploads/75b9d39b-4705-4e43-8bf5-99c97463da79.png" />
                    <div className="mt-4 text-xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent
                      drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] flex items-center">
                      {userProfile ? 'Your PXB Points' : 'Mint PXB Points'}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md bg-transparent border-none shadow-none">
                  <DialogTitle className="sr-only">{userProfile ? 'Your PXB Points' : 'Mint PXB Points'}</DialogTitle>
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
              
              PXBLeaderboard & Statistics
              
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
      
      <Footer />
    </>;
};

export default Index;
