
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Trophy, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroBanner = () => {
  return (
    <motion.div 
      className="relative py-24 overflow-hidden rounded-2xl border border-indigo-900/30 bg-[#0f1628]/80 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          className="inline-block rounded-full bg-indigo-900/30 px-4 py-1.5 mb-6 text-sm font-medium text-indigo-300 border border-indigo-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block mr-2"><CheckCircle className="h-4 w-4 inline text-green-500" /></span>
          Phase 1 Complete: 100% of PXB Supply Minted
        </motion.div>
        
        <motion.h1 
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6
                bg-gradient-to-r from-white via-indigo-300 to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Sparkles className="inline-block h-10 w-10 mb-2 mr-2 text-yellow-400" />
          PumpXBounty Ecosystem
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-indigo-300/90 max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          The future of decentralized predictions and betting. PXB supply is now fully minted with 1 billion tokens distributed to our growing community.
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
            <Coins className="mr-2 h-5 w-5" />
            Get PXB Tokens
          </Button>
          <Button size="lg" variant="outline" className="border-indigo-700 text-indigo-300 hover:bg-indigo-900/20">
            <Trophy className="mr-2 h-5 w-5" />
            View Leaderboard
          </Button>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="rounded-lg bg-indigo-900/20 border border-indigo-900/30 p-4">
            <div className="font-bold text-2xl text-white mb-1">1 Billion</div>
            <div className="text-indigo-300/70 text-sm">Total PXB Supply</div>
          </div>
          <div className="rounded-lg bg-indigo-900/20 border border-indigo-900/30 p-4">
            <div className="font-bold text-2xl text-white mb-1">8,000+</div>
            <div className="text-indigo-300/70 text-sm">Token Holders</div>
          </div>
          <div className="rounded-lg bg-indigo-900/20 border border-indigo-900/30 p-4">
            <div className="font-bold text-2xl text-white mb-1">100%</div>
            <div className="text-indigo-300/70 text-sm">Minted Complete</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroBanner;
