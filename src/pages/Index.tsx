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
                <Button className="relative overflow-hidden group text-white text-lg px-8 py-6 
                  rounded-xl transition-all duration-500 border border-white/10 backdrop-blur-lg
                  transform hover:translate-y-[-4px] hover:scale-105 active:translate-y-[2px]
                  hover:border-purple-400/50
                  before:content-[''] before:absolute before:inset-0 
                  before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]
                  before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100
                  after:content-[''] after:absolute after:inset-0 after:-z-10 after:rounded-xl
                  after:shadow-[0_0_30px_rgba(139,92,246,0.5)] after:opacity-50 hover:after:opacity-100
                  after:transition-all after:duration-500 hover:after:shadow-[0_0_50px_rgba(139,92,246,0.8)]
                  [&>span]:relative [&>span]:z-10
                  group-hover:[&>span]:text-transparent group-hover:[&>span]:bg-gradient-to-r 
                  group-hover:[&>span]:from-yellow-300 group-hover:[&>span]:to-orange-400">
                  <span className="relative z-10 flex items-center font-bold text-transparent bg-gradient-to-r from-green-800 to-green-600 bg-clip-text drop-shadow-[0_0_10px_rgba(22,163,74,0.8)]">
                    Start Betting
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 text-green-700 filter drop-shadow-[0_0_8px_rgba(22,163,74,0.8)]" />
                  </span>
                  
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 via-yellow-300 to-purple-600
                    animate-gradient-move bg-[length:400%_100%] opacity-70 transform-gpu"></div>
                  
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-500 via-yellow-400 via-orange-500 to-purple-600
                    opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500
                    group-hover:blur-2xl animate-pulse-glow"></div>
                  
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl">
                    <div className="absolute -inset-[10px] bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.5),transparent_60%)]
                      animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="absolute -bottom-2 left-0 right-0 h-12 bg-gradient-to-t from-green-400 via-yellow-300 to-transparent
                      filter blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500
                      animate-bob [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
                    
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                      <div className="absolute top-[20%] left-[15%] w-4 h-4 rounded-full bg-green-300 filter blur-sm animate-float"></div>
                      <div className="absolute top-[40%] left-[75%] w-3 h-3 rounded-full bg-yellow-300 filter blur-sm animate-float-delayed"></div>
                      <div className="absolute top-[70%] left-[30%] w-2 h-2 rounded-full bg-purple-300 filter blur-sm animate-float-delayed-2"></div>
                    </div>
                    
                    <div className="absolute inset-x-4 top-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent rounded-t-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="absolute inset-x-8 bottom-0 h-[30%] bg-gradient-to-t from-black/40 to-transparent rounded-b-xl opacity-10 group-hover:opacity-40 transition-opacity duration-500"></div>
                  </div>
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
