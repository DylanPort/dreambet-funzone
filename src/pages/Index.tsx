import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Clock, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
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
    
    // Process formatted tokens
    if (pumpPortal.recentTokens && pumpPortal.recentTokens.length > 0) {
      for (let i = 0; i < Math.min(4, pumpPortal.recentTokens.length); i++) {
        const formattedToken = formatWebSocketTokenData(pumpPortal.recentTokens[i]);
        tokens.push(formattedToken);
      }
    }
    
    // Process raw tokens if we need more
    if (tokens.length < 4 && pumpPortal.rawTokens && pumpPortal.rawTokens.length > 0) {
      for (let i = 0; i < Math.min(4 - tokens.length, pumpPortal.rawTokens.length); i++) {
        const rawToken = pumpPortal.rawTokens[i];
        tokens.push({
          id: rawToken.mint,
          name: rawToken.name || 'Unknown Token',
          symbol: rawToken.symbol || '',
          logo: '🪙',
          currentPrice: rawToken.marketCapSol ? parseFloat((rawToken.marketCapSol / 1000000000).toFixed(6)) : 0,
          change24h: Math.random() * 40 - 20, // Random change between -20% and +20% for demonstration
        });
      }
    }
    
    // Fill with placeholders if needed
    while (tokens.length < 4) {
      tokens.push({
        id: `placeholder-${tokens.length}`,
        name: `Token ${tokens.length + 1}`,
        symbol: `T${tokens.length + 1}`,
        logo: '🪙',
        currentPrice: (Math.random() * 0.1).toFixed(6),
        change24h: Math.random() * 40 - 20, // Random change between -20% and +20%
      });
    }
    
    setLatestTokens(tokens);
  }, [pumpPortal.recentTokens, pumpPortal.rawTokens]);

  // Function to get token symbol display
  const getTokenSymbol = (token: any) => {
    if (!token) return 'T';
    return token.symbol ? token.symbol.charAt(0).toUpperCase() : 'T';
  };

  // Card styles to position the 4 cards
  const cardPositions = [
    "top-[5%] left-[40%] shadow-neon-green animate-float", // Style for first card
    "top-0 left-[10%] shadow-neon-purple animate-float", // Style for second card
    "top-[20%] right-[10%] shadow-neon-cyan animate-float-delayed", // Style for third card
    "bottom-0 left-[30%] shadow-neon animate-float-delayed-2" // Style for fourth card
  ];

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient">
              Predict the Future<br />of Token Migrations
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-8">
              PumpXBounty lets you bet on tokens migrating from PumpFun to Raydium. Predict whether they'll moon or die within the hour based on migration prices.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Link to="/betting">
                <Button className="bg-gradient-to-r from-dream-accent1 to-dream-accent3 hover:shadow-neon text-white text-lg px-8 py-6">
                  Start Betting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/betting">
                <Button variant="outline" className="text-lg px-8 py-6 border-dream-accent2/50 hover:border-dream-accent2 hover:bg-dream-accent2/10">
                  Explore Tokens
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Floating Cards */}
          <div className="relative max-w-5xl mx-auto h-[300px] md:h-[400px] mb-16">
            {/* Generate token cards using the latest tokens */}
            {latestTokens.map((token, index) => (
              <div 
                key={token.id || `token-${index}`} 
                className={`absolute glass-panel p-6 w-[280px] ${cardPositions[index]}`} 
                style={{ animationDelay: `${index * 0.3}s`, zIndex: 10 - index }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-300/20 flex items-center justify-center border border-white/10">
                      <span className="font-display font-bold">{getTokenSymbol(token)}</span>
                    </div>
                    <span className="ml-2 font-semibold">{token.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">PumpFun</span>
                  </div>
                </div>
                <div className="h-[80px] bg-gradient-to-r from-green-500/20 to-green-300/10 rounded-md mb-3 flex items-center justify-center">
                  <span className={`font-bold ${token.change24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ${token.currentPrice?.toFixed(6) || "0.000000"}
                  </span>
                </div>
                <div className="flex justify-around">
                  <button className="btn-moon py-1 px-3 text-sm">Moon 🚀</button>
                  <button className="btn-die py-1 px-3 text-sm">Die 💀</button>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <Link to={`/token/${token.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Token
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://pump.fun', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> Pump.fun
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent1/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-dream-accent1" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">P2P Betting</h3>
              <p className="text-dream-foreground/70">
                Bet directly against other users with a simple up or down position on migrating tokens.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent2/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-dream-accent2" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">One-Hour Window</h3>
              <p className="text-dream-foreground/70">
                Quick one-hour betting windows for fast-paced and exciting predictions on token migrations.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent3/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-dream-accent3" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Solana Powered</h3>
              <p className="text-dream-foreground/70">
                Fast, secure betting with low fees powered by Solana smart contracts and blockchain technology.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
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
    </>
  );
};

export default Index;
