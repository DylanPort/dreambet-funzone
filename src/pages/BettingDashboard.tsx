
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, Search, Zap, Trophy, Sparkles, BarChart3 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WalletConnectButton from '@/components/WalletConnectButton';
import OpenBetsList from '@/components/OpenBetsList';
import TrendingBetsList from '@/components/TrendingBetsList';
import SearchedTokensReel from '@/components/SearchedTokensReel';
import OrbitingParticles from '@/components/OrbitingParticles';
import TokenSearchBar from '@/components/TokenSearchBar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BettingDashboard = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("discover");
  
  console.log("BettingDashboard rendering, wallet connected:", connected);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black to-gray-900">
      <OrbitingParticles />
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section with Search */}
        <section className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-dream-accent1/10 to-dream-accent3/10 rounded-3xl blur-xl"></div>
          
          <div className="relative z-10 py-8 px-6 sm:px-10 rounded-3xl border border-white/10 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00ffe0] to-[#4b8ef3] mb-4">
                Trading Playground
              </h1>
              <p className="text-dream-foreground/60 max-w-2xl mx-auto">
                Find any Solana token and start trading instantly
              </p>
            </motion.div>
            
            <TokenSearchBar />
            
            {!connected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex justify-center"
              >
                <div className="glass-panel inline-flex items-center gap-3 p-4 rounded-xl">
                  <Wallet className="text-green-400" />
                  <span>Connect your wallet to start trading</span>
                  <WalletConnectButton />
                </div>
              </motion.div>
            )}
          </div>
        </section>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-10">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-black/40 border border-white/10">
              <TabsTrigger value="discover" className="data-[state=active]:bg-dream-accent2/20">
                <Search className="w-4 h-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-dream-accent2/20">
                <Zap className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="trades" className="data-[state=active]:bg-dream-accent2/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Active Trades
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="discover" className="mt-0 space-y-6">
            <div className="space-y-6">
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-dream-accent2" />
                    Recently Searched Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchedTokensReel />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trending" className="mt-0">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-amber-500" /> 
                  Trending Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendingBetsList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trades" className="mt-0">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  Open Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OpenBetsList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Stats Cards */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          <div className="glass-panel p-6 text-center">
            <div className="text-4xl font-bold text-dream-accent1 mb-2">24h</div>
            <div className="text-lg font-medium">Trading Window</div>
            <p className="text-sm text-dream-foreground/60 mt-2">
              Make your predictions within 24 hours
            </p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <div className="text-4xl font-bold text-dream-accent2 mb-2">100%</div>
            <div className="text-lg font-medium">On-chain Trades</div>
            <p className="text-sm text-dream-foreground/60 mt-2">
              All trades are recorded on Solana blockchain
            </p>
          </div>
          
          <div className="glass-panel p-6 text-center">
            <div className="text-4xl font-bold text-dream-accent3 mb-2">0 Fee</div>
            <div className="text-lg font-medium">Trade Commission</div>
            <p className="text-sm text-dream-foreground/60 mt-2">
              Trade with zero platform fees
            </p>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BettingDashboard;
