
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gradient">
              Predict the Future<br />of Fun Tokens
            </h1>
            <p className="text-lg md:text-xl text-dream-foreground/80 max-w-3xl mx-auto mb-8">
              DreamBet lets you predict whether tokens will moon or die within the hour based on migration prices. Enter the dreamscape where intuition meets opportunity.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-dream-accent1 to-dream-accent3 hover:shadow-neon text-white text-lg px-8 py-6">
                  Start Betting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/tokens">
                <Button variant="outline" className="text-lg px-8 py-6 border-dream-accent2/50 hover:border-dream-accent2 hover:bg-dream-accent2/10">
                  Explore Tokens
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Floating Cards */}
          <div className="relative max-w-5xl mx-auto h-[300px] md:h-[400px] mb-16">
            <div className="absolute glass-panel p-6 w-[280px] top-0 left-[10%] shadow-neon-purple animate-float">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold">E</span>
                  </div>
                  <span className="ml-2 font-semibold">Ethereum</span>
                </div>
                <div className="text-green-400 flex items-center text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  23.5%
                </div>
              </div>
              <div className="h-[80px] bg-gradient-to-r from-green-500/20 to-green-300/10 rounded-md mb-3"></div>
              <div className="flex justify-around">
                <button className="btn-moon py-1 px-3 text-sm">Moon 🚀</button>
                <button className="btn-die py-1 px-3 text-sm">Die 💀</button>
              </div>
            </div>
            
            <div className="absolute glass-panel p-6 w-[280px] top-[20%] right-[10%] shadow-neon-cyan" style={{ animationDelay: "1s" }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent2/20 to-dream-accent1/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold">S</span>
                  </div>
                  <span className="ml-2 font-semibold">Solana</span>
                </div>
                <div className="text-red-400 flex items-center text-sm">
                  <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                  8.2%
                </div>
              </div>
              <div className="h-[80px] bg-gradient-to-r from-red-500/20 to-red-300/10 rounded-md mb-3"></div>
              <div className="flex justify-around">
                <button className="btn-moon py-1 px-3 text-sm">Moon 🚀</button>
                <button className="btn-die py-1 px-3 text-sm">Die 💀</button>
              </div>
            </div>
            
            <div className="absolute glass-panel p-6 w-[280px] bottom-0 left-[30%] shadow-neon" style={{ animationDelay: "0.5s" }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dream-accent3/20 to-dream-accent2/20 flex items-center justify-center border border-white/10">
                    <span className="font-display font-bold">A</span>
                  </div>
                  <span className="ml-2 font-semibold">Algorand</span>
                </div>
                <div className="text-green-400 flex items-center text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  15.7%
                </div>
              </div>
              <div className="h-[80px] bg-gradient-to-r from-green-500/20 to-green-300/10 rounded-md mb-3"></div>
              <div className="flex justify-around">
                <button className="btn-moon py-1 px-3 text-sm">Moon 🚀</button>
                <button className="btn-die py-1 px-3 text-sm">Die 💀</button>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent1/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-dream-accent1" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Real-Time Data</h3>
              <p className="text-dream-foreground/70">
                Stay updated with real-time migration prices and make informed predictions.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent2/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-dream-accent2" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">One-Hour Window</h3>
              <p className="text-dream-foreground/70">
                Quick one-hour betting windows for fast-paced and exciting predictions.
              </p>
            </div>
            
            <div className="glass-panel p-6 text-center">
              <div className="bg-dream-accent3/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-dream-accent3" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Secure Platform</h3>
              <p className="text-dream-foreground/70">
                Your data and bets are secure with our advanced encryption and authentication.
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
              DreamBet
            </Link>
            <p className="text-dream-foreground/60 max-w-md mx-auto text-sm">
              DreamBet is a platform for predicting the future of fun tokens based on migration prices. This is for entertainment purposes only.
            </p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm text-dream-foreground/40">
              © {new Date().getFullYear()} DreamBet. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
