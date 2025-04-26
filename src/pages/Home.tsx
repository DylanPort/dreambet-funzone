import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Users, 
  ChevronDown, 
  Globe, 
  Sparkles, 
  ChevronRight,
  Calendar,
  BarChart,
  TrendingUp,
  LineChart,
  Trophy,
  Percent,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Roadmap from '@/components/Roadmap';
import UserSearch from '@/components/UserSearch';
import SocialLinks from '@/components/SocialLinks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Footer from '@/components/Footer';
import { usePXBTotalSupply } from '@/hooks/usePXBTotalSupply';
import { confetti } from '@/lib/utils';
import AnimatedPumpButton from '@/components/AnimatedPumpButton';

const Home = () => {
  const { supplyData, isLoading } = usePXBTotalSupply();
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [triggeredConfetti, setTriggeredConfetti] = useState(false);
  const [activeExample, setActiveExample] = useState('start');

  useEffect(() => {
    if (!triggeredConfetti) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTriggeredConfetti(true);
      }, 1000);
    }
  }, [triggeredConfetti]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const supplyPercentage = 100;
  const animatedPercentage = supplyPercentage;

  const exampleData: Record<string, ExampleDataType> = {
    start: {
      title: "Starting Positions",
      description: "Three friends deposit $POINTS into the pool and receive PXB points to trade with.",
      users: [
        { name: "Alice", deposit: 100, pxb: 100, change: 0, color: "blue" },
        { name: "Bob", deposit: 200, pxb: 200, change: 0, color: "green" },
        { name: "Charlie", deposit: 50, pxb: 50, change: 0, color: "purple" }
      ]
    },
    trading: {
      title: "Trading Performance",
      description: "Each friend trades with their PXB points, with different outcomes.",
      users: [
        { name: "Alice", deposit: 100, pxb: 150, change: 50, color: "blue" },
        { name: "Bob", deposit: 200, pxb: 160, change: -20, color: "green" },
        { name: "Charlie", deposit: 50, pxb: 90, change: 80, color: "purple" }
      ]
    },
    leaderboard: {
      title: "Leaderboard Results",
      description: "Charlie wins with the highest percentage gain, despite starting with the least.",
      users: [
        { name: "Charlie", deposit: 50, pxb: 90, change: 80, rank: 1, color: "purple" },
        { name: "Alice", deposit: 100, pxb: 150, change: 50, rank: 2, color: "blue" },
        { name: "Bob", deposit: 200, pxb: 160, change: -20, rank: 3, color: "green" }
      ]
    },
    payout: {
      title: "Payout Example",
      description: "How PXB adjusts payouts to ensure pool solvency.",
      users: [
        { name: "Alice", deposit: 100, pxb: 130, change: 30, payout: 102.63, color: "blue" },
        { name: "John", deposit: 150, pxb: 240, change: 60, payout: 189.47, color: "green" },
        { name: "Larry", deposit: 200, pxb: 200, change: 0, payout: 157.89, color: "purple" }
      ],
      pool: 450,
      requested: 570,
      factor: 0.7895
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#303066_0%,#090821_70%)] opacity-20 z-0"></div>
      <div className="absolute inset-0 bg-[url('/lovable-uploads/c84c898e-0b87-4eae-9d58-bc815b9da555.png')] bg-cover bg-center opacity-5 z-0"></div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-20 pb-10">
        <section className="flex flex-col items-center justify-center text-center pt-10 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-block relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 opacity-75 blur"></div>
              <div className="relative px-6 py-1.5 bg-black rounded-full border border-purple-500/40">
                <div className="flex items-center space-x-2 text-sm text-green-400 font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Phase 1 Complete</span>
                  <span>•</span>
                  <span>1,000,000,000 PXB Tokens Minted</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              PumpXBounty Ecosystem
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Empowering the future of crypto trading with prediction, learning, and community.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="w-full max-w-md">
              <AnimatedPumpButton />
            </div>
          </motion.div>
        </section>

        <motion.section 
          className="py-12 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-5xl mx-auto bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300">
                  PXB Token Supply
                </span>
                <img 
                  src="/lovable-uploads/17d9567f-2809-4750-98f3-f47552d5c62c.png" 
                  alt="PXB Logo" 
                  className="h-8 w-16 ml-3 object-contain"
                />
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  className="bg-black/40 rounded-lg p-5 border border-white/5"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <h3 className="text-gray-400 text-sm mb-1 flex items-center">
                    <Globe className="mr-1 h-4 w-4 text-cyan-400" />
                    Total Supply
                  </h3>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    {isLoading ? '...' : formatNumber(supplyData.totalMinted)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Maximum supply reached</p>
                </motion.div>
                
                <motion.div
                  className="bg-black/40 rounded-lg p-5 border border-white/5"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h3 className="text-gray-400 text-sm mb-1 flex items-center">
                    <Users className="mr-1 h-4 w-4 text-cyan-400" />
                    Holders
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? '...' : formatNumber(supplyData.usersWithPoints)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Unique addresses with PXB</p>
                </motion.div>
                
                <motion.div
                  className="bg-black/40 rounded-lg p-5 border border-white/5"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h3 className="text-gray-400 text-sm mb-1 flex items-center">
                    <BarChart className="mr-1 h-4 w-4 text-cyan-400" />
                    Average Per Holder
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? '...' : formatNumber(supplyData.averagePerUser)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Average PXB per holder</p>
                </motion.div>
              </div>
              
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium">Distribution Progress</h3>
                <span className="text-sm font-bold text-green-400">{animatedPercentage}% Complete</span>
              </div>
              
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-6 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${animatedPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-0 left-0 h-2 w-2 bg-white rounded-full"
                      style={{ top: Math.random() * 16 }}
                      animate={{
                        x: ["0%", "100%"],
                        opacity: [0.6, 1, 0]
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear",
                        delay: i * 0.4
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <Collapsible>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Allocation Breakdown</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-7">
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Community Rewards</span>
                        <span className="font-medium">40%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: '40%' }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-cyan-900/20 p-3 rounded-lg border border-cyan-500/20">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Liquidity Pool</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: '30%' }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Development</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: '20%' }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-pink-900/20 p-3 rounded-lg border border-pink-500/20">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Team & Advisors</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: '10%' }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <div className="absolute right-0 bottom-0">
                <motion.div
                  className="text-purple-300/30 text-8xl font-bold"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  PXB
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {showRoadmap && (
            <motion.section 
              id="roadmap-section"
              className="py-10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Roadmap />
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSearch && (
            <motion.section 
              id="user-search-section"
              className="py-10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <UserSearch />
            </motion.section>
          )}
        </AnimatePresence>

        <section className="py-10 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Connect With Us</h2>
            <p className="text-gray-400">Join our community and stay updated</p>
          </div>
          <SocialLinks />
        </section>
        
        <section className="py-10 mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              How the PXB Trading System Works
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto mt-2">
              Our unique trading system rewards skill, not just deposit size. See how traders are ranked based on percentage gains in this interactive example.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-xl overflow-hidden relative mb-12">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
            
            <Tabs value={activeExample} onValueChange={setActiveExample} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="start" className="data-[state=active]:bg-blue-900/30">
                  <span className="flex flex-col items-center">
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span className="text-xs">Step 1</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="trading" className="data-[state=active]:bg-blue-900/30">
                  <span className="flex flex-col items-center">
                    <TrendingUp className="h-4 w-4 mb-1" />
                    <span className="text-xs">Step 2</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-blue-900/30">
                  <span className="flex flex-col items-center">
                    <Trophy className="h-4 w-4 mb-1" />
                    <span className="text-xs">Step 3</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="payout" className="data-[state=active]:bg-blue-900/30">
                  <span className="flex flex-col items-center">
                    <Coins className="h-4 w-4 mb-1" />
                    <span className="text-xs">Payouts</span>
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                {Object.entries(exampleData).map(([key, data]) => (
                  <TabsContent key={key} value={key} className="relative overflow-hidden">
                    {activeExample === key && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <h3 className="text-xl font-bold mb-2">{data.title}</h3>
                        <p className="text-gray-400 mb-6">{data.description}</p>
                        
                        {key === 'payout' && isPayoutData(data) ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div 
                              className="bg-gray-900/50 rounded-lg p-6 border border-gray-800"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <h4 className="text-lg font-semibold mb-4 flex items-center">
                                <Coins className="mr-2 h-5 w-5 text-yellow-400" />
                                Pool Information
                              </h4>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Total Pool Value:</span>
                                  <span className="font-bold text-white">{data.pool} $POINTS</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Total Requested Payout:</span>
                                  <span className="font-bold text-yellow-400">{data.requested} $POINTS</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Adjustment Factor:</span>
                                  <span className="font-bold text-cyan-400">{data.factor}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-700">
                                  <p className="text-sm text-gray-400">
                                    When the total requested payout exceeds the pool value, payouts are adjusted by this factor to ensure the pool remains solvent.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                            
                            <div className="space-y-4">
                              {data.users.map((user, idx) => (
                                <motion.div
                                  key={user.name}
                                  className={`bg-${user.color}-900/20 rounded-lg p-4 border border-${user.color}-500/30`}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 + idx * 0.1 }}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{user.name}</span>
                                    <span className={`text-${user.change >= 0 ? 'green' : 'red'}-400`}>
                                      {user.change >= 0 ? '+' : ''}{user.change}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Initial:</span>
                                    <span>{user.deposit} $POINTS</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Expected Payout:</span>
                                    <span>{user.pxb} $POINTS</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-gray-400">Adjusted Payout:</span>
                                    <span className="text-cyan-400">{user.payout} $POINTS</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {data.users.map((user, idx) => (
                              <motion.div
                                key={user.name}
                                className={`relative bg-${user.color}-900/20 rounded-lg p-4 border border-${user.color}-500/30`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                              >
                                {key === 'leaderboard' && user.rank && (
                                  <motion.div 
                                    className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center 
                                              ${user.rank === 1 ? 'bg-yellow-500' : user.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'} 
                                              text-black font-bold text-sm`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.1, type: 'spring' }}
                                  >
                                    #{user.rank}
                                  </motion.div>
                                )}
                                
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-bold text-lg">{user.name}</span>
                                  {user.change !== 0 && key !== 'start' && (
                                    <motion.span 
                                      className={`text-${user.change >= 0 ? 'green' : 'red'}-400 flex items-center`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.4 + idx * 0.1 }}
                                    >
                                      {user.change >= 0 ? 
                                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                                        <LineChart className="h-4 w-4 mr-1" />}
                                      {user.change >= 0 ? '+' : ''}{user.change}%
                                    </motion.span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Initial Deposit</p>
                                    <p className="font-semibold flex items-center">
                                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                                      {user.deposit} $POINTS
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Current PXB</p>
                                    <p className="font-semibold flex items-center">
                                      <Coins className="h-4 w-4 mr-1 text-yellow-400" />
                                      {user.pxb} PXB
                                    </p>
                                  </div>
                                </div>
                                
                                {key !== 'start' && (
                                  <div className="mt-3 pt-3 border-t border-gray-800">
                                    <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                                      <motion.div
                                        className={`absolute top-0 left-0 h-full ${
                                          user.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${Math.min(Math.abs(user.change), 100)}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                      <span>Starting Value</span>
                                      <span>{user.change >= 0 ? 'Profit' : 'Loss'}</span>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between mt-8">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const keys = Object.keys(exampleData);
                              const currentIndex = keys.indexOf(activeExample);
                              if (currentIndex > 0) {
                                setActiveExample(keys[currentIndex - 1]);
                              }
                            }}
                            disabled={activeExample === 'start'}
                            className="border-white/10 hover:bg-white/5"
                          >
                            Previous Step
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              const keys = Object.keys(exampleData);
                              const currentIndex = keys.indexOf(activeExample);
                              if (currentIndex < keys.length - 1) {
                                setActiveExample(keys[currentIndex + 1]);
                              }
                            }}
                            disabled={activeExample === 'payout'}
                            className="bg-gradient-to-r from-purple-600 to-cyan-600"
                          >
                            Next Step <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </TabsContent>
                ))}
              </AnimatePresence>
            </Tabs>
          </div>
          
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">PXB Ecosystem Highlights</h2>
              <p className="text-gray-400">Discover the key features of our platform</p>
            </div>
            
            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent>
                {[
                  {
                    title: "Token Predictions",
                    description: "Make predictions on token movement and earn PXB rewards when you're right",
                    icon: <Sparkles className="h-8 w-8 text-yellow-400" />,
                    color: "from-yellow-600 to-orange-700"
                  },
                  {
                    title: "Community Learning",
                    description: "Share insights, strategies, and learn from other successful traders",
                    icon: <Users className="h-8 w-8 text-blue-400" />,
                    color: "from-blue-600 to-indigo-700"
                  },
                  {
                    title: "Reward System",
                    description: "Earn PXB tokens through predictions, referrals and community contributions",
                    icon: <Coins className="h-8 w-8 text-green-400" />,
                    color: "from-green-600 to-teal-700"
                  },
                  {
                    title: "Events Calendar",
                    description: "Stay updated with important dates, launches and community events",
                    icon: <Calendar className="h-8 w-8 text-purple-400" />,
                    color: "from-purple-600 to-pink-700"
                  }
                ].map((item, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <motion.div 
                      className={`h-full p-6 rounded-xl bg-gradient-to-br ${item.color} text-white flex flex-col items-center text-center space-y-4`}
                      whileHover={{ y: -5, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="bg-white/20 p-3 rounded-full">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-white/80">{item.description}</p>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
