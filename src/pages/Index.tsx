import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BetReel from '@/components/BetReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import FloatingImages from '@/components/FloatingImages';
import AnimatedLogo from '@/components/AnimatedLogo';
import FuturisticTokenDisplay from '@/components/FuturisticTokenDisplay';
import { Button } from '@/components/ui/button';
import { usePumpPortalWebSocket, formatWebSocketTokenData } from '@/services/pumpPortalWebSocketService';

const Index = () => {
  const [latestTokens, setLatestTokens] = useState<any[]>([]);
  const pumpPortal = usePumpPortalWebSocket();

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
    while (tokens.length < 3) {
      tokens.push({
        id: `placeholder-${tokens.length}`,
        name: `Token ${tokens.length + 1}`,
        symbol: `T${tokens.length + 1}`,
        logo: '🪙',
        imageUrl: '',
        currentPrice: Math.random() * 0.1,
        change24h: Math.random() * 40 - 20
      });
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
          
          <div className="text-center mb-16 animate-fade-in relative z-10">
            <AnimatedLogo />
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-8">PumpXBounty lets you bet on tokens on PumpFun and Raydium. Predict whether they'll moon or die within the hour.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Link to="/betting">
                <Button className="relative overflow-hidden group bg-gradient-to-r from-dream-accent1/40 to-dream-accent3/40 text-white text-lg px-8 py-6 
                  rounded-xl transition-all duration-300 border border-white/20 backdrop-blur-md
                  transform hover:translate-y-[-2px] active:translate-y-[1px]
                  shadow-[0_8px_20px_rgba(123,97,255,0.3)] hover:shadow-[0_10px_25px_rgba(123,97,255,0.4)]
                  before:content-[''] before:absolute before:inset-0 before:bg-white/5 before:rounded-xl before:opacity-100 
                  after:content-[''] after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-300
                  after:bg-gradient-to-b after:from-white/20 after:via-white/10 after:to-transparent hover:after:opacity-100
                  ">
                  <span className="relative z-10 flex items-center">
                    Start Betting
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent opacity-25"></div>
                  <div className="absolute -inset-full h-[200%] w-[50%] z-10 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40 group-hover:animate-shine" />
                  <div className="absolute inset-[1.5px] rounded-[10px] pointer-events-none z-0 bg-gradient-to-b from-white/10 to-transparent border border-white/10"></div>
                </Button>
              </Link>
              <Link to="/betting">
                <Button variant="outline" className="text-lg px-8 py-6 border-dream-accent2/50 hover:border-dream-accent2 hover:bg-dream-accent2/10">
                  Explore Tokens
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative max-w-5xl mx-auto h-[300px] md:h-[400px] mb-16">
            <FuturisticTokenDisplay tokens={latestTokens} />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent1/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <img src="/lovable-uploads/c40baa88-ed47-4c9b-bbd9-d248df1c7863.png" alt="P2P Betting Icon" className="h-20 w-20 filter drop-shadow-[0_0_8px_rgba(255,61,252,0.8)] transition-transform hover:scale-110 duration-300" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">P2P Betting</h3>
              <p className="text-dream-foreground/70">
                Bet directly against other users with a simple up or down position on migrating tokens.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent2/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <img src="/lovable-uploads/996f7a3a-2e7a-4c12-bcd7-8af762f1087a.png" alt="One-Hour Window Icon" className="h-16 w-16 filter drop-shadow-[0_0_8px_rgba(0,255,240,0.8)] transition-transform hover:scale-110 duration-300" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">One-Hour Window</h3>
              <p className="text-dream-foreground/70">
                Quick one-hour betting windows for fast-paced and exciting predictions on token migrations.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent3/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <img src="/lovable-uploads/ac099dc7-7eb5-45db-9d89-615f8619a093.png" alt="Solana Logo" className="h-24 w-24 filter drop-shadow-[0_0_8px_rgba(64,224,208,0.8)] transition-transform hover:scale-110 duration-300" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Solana Powered</h3>
              <p className="text-dream-foreground/70">
                Fast, secure betting with low fees powered by Solana smart contracts and blockchain technology.
              </p>
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
            <p className="text-dream-foreground/60 max-w-md mx-auto text-sm">
              PumpXBounty is a platform for predicting the future of tokens migrating from PumpFun to Raydium. This is for entertainment purposes only.
            </p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-dream-foreground/40">
              © {new Date().getFullYear()} PumpXBounty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>;
};

export default Index;
