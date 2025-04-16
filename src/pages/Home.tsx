
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
  BarChart
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Roadmap from '@/components/Roadmap';
import UserSearch from '@/components/UserSearch';
import SocialLinks from '@/components/SocialLinks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Footer from '@/components/Footer';
import { usePXBTotalSupply } from '@/hooks/usePXBTotalSupply';
import { confetti } from '@/lib/utils';

const Home = () => {
  // Supply data from hook
  const { supplyData, isLoading } = usePXBTotalSupply();
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [triggeredConfetti, setTriggeredConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti effect when the component mounts
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

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Calculate completion percentage
  const supplyPercentage = 100;
  const animatedPercentage = supplyPercentage;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#303066_0%,#090821_70%)] opacity-20 z-0"></div>
      <div className="absolute inset-0 bg-[url('/lovable-uploads/c84c898e-0b87-4eae-9d58-bc815b9da555.png')] bg-cover bg-center opacity-5 z-0"></div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 pt-20 pb-10">
        {/* Hero Section */}
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
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-none"
              onClick={() => {
                setShowRoadmap(true);
                setShowSearch(false);
                setTimeout(() => {
                  document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              View Roadmap <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-500/30 hover:bg-purple-950/30"
              onClick={() => {
                setShowSearch(true);
                setShowRoadmap(false);
                setTimeout(() => {
                  document.getElementById('user-search-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              <Users className="mr-1 h-4 w-4" /> Find Users
            </Button>
          </motion.div>
        </section>

        {/* Supply Stats Section */}
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
                <Coins className="mr-2 h-6 w-6 text-purple-400" />
                PXB Token Supply
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
                
                {/* Animated particles effect */}
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

        {/* Roadmap Section */}
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

        {/* User Search Section */}
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

        {/* Social Links */}
        <section className="py-10 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Connect With Us</h2>
            <p className="text-gray-400">Join our community and stay updated</p>
          </div>
          <SocialLinks />
        </section>
        
        {/* Token Summary Cards Carousel */}
        <section className="py-10 mb-10">
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
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
