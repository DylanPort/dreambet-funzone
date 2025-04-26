
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles,
  Zap, 
  CircleCheck, 
  CircleArrowRight, 
  CircleDot, 
  CalendarCheck,
  CalendarDays, 
  Users, 
  Coins, 
  ArrowRight,
  FileText,
  Book,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedPumpButton from '@/components/AnimatedPumpButton';
import { usePXBTotalSupply } from '@/hooks/usePXBTotalSupply';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Define TypeScript types
type RoadmapPhase = {
  id: string;
  title: string;
  dateRange: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  items: {
    title: string;
    date: string;
  }[];
};

type FeatureCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("phase1");
  const { supplyData, isLoading } = usePXBTotalSupply();
  
  // Animated counter effect
  const [counts, setCounts] = useState({
    supply: 0,
    holders: 0,
    average: 0
  });
  
  useEffect(() => {
    const targetCounts = {
      supply: 1000000000,
      holders: 8035,
      average: 124456
    };
    
    const duration = 2000; // 2 seconds
    const frameRate = 30;
    const framesCount = duration / 1000 * frameRate;
    const supplyIncrement = targetCounts.supply / framesCount;
    const holdersIncrement = targetCounts.holders / framesCount;
    const averageIncrement = targetCounts.average / framesCount;
    
    let frame = 0;
    
    const counter = setInterval(() => {
      frame++;
      
      setCounts({
        supply: Math.min(Math.round(supplyIncrement * frame), targetCounts.supply),
        holders: Math.min(Math.round(holdersIncrement * frame), targetCounts.holders),
        average: Math.min(Math.round(averageIncrement * frame), targetCounts.average)
      });
      
      if (frame >= framesCount) clearInterval(counter);
    }, 1000 / frameRate);
    
    return () => clearInterval(counter);
  }, []);
  
  // Roadmap data
  const roadmapPhases: RoadmapPhase[] = [
    {
      id: "phase1",
      title: "Phase 1: Foundation",
      dateRange: "Mar 1 – Apr 16, 2025",
      status: "completed",
      items: [
        { title: "Platform MVP Launch", date: "Mar 15, 2025" },
        { title: "Token Minting", date: "Mar 25, 2025" },
        { title: "User Onboarding", date: "Apr 1, 2025" },
        { title: "Basic Bets", date: "Apr 10, 2025" }
      ]
    },
    {
      id: "phase2",
      title: "Phase 2: Growth",
      dateRange: "Apr 17 – May 20, 2025",
      status: "in-progress",
      items: [
        { title: "Trading Simulator", date: "Apr 25, 2025" },
        { title: "$POINT Pool Integration", date: "May 5, 2025" },
        { title: "Community Programs", date: "May 10, 2025" },
        { title: "Partner Integrations", date: "May 18, 2025" }
      ]
    },
    {
      id: "phase3",
      title: "Phase 3: Expansion",
      dateRange: "May 26 – Jun 15, 2025",
      status: "upcoming",
      items: [
        { title: "Cross-chain Trading", date: "May 30, 2025" },
        { title: "Leverage Simulator", date: "Jun 5, 2025" },
        { title: "Advanced Dashboard", date: "Jun 10, 2025" },
        { title: "DEX Simulator", date: "Jun 15, 2025" }
      ]
    },
    {
      id: "phase4",
      title: "Phase 4: Maturity",
      dateRange: "TBA",
      status: "upcoming",
      items: [
        { title: "Marketing", date: "TBA" },
        { title: "Financial Products", date: "TBA" },
        { title: "Enterprise Partnerships", date: "TBA" },
        { title: "Ecosystem Fund", date: "TBA" }
      ]
    }
  ];
  
  // Feature cards data
  const featureCards: FeatureCard[] = [
    {
      title: "Risk-capped Trading",
      description: "Trade with confidence knowing your maximum potential loss is predetermined",
      icon: <CircleCheck className="h-8 w-8" />,
      color: "from-cyan-500 to-blue-600"
    },
    {
      title: "5x Upside Potential",
      description: "Amplify your gains with up to 5x potential returns on successful trades",
      icon: <Zap className="h-8 w-8" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Fee Redistribution",
      description: "Platform fees are redistributed back to token holders, benefiting the community",
      icon: <Coins className="h-8 w-8" />,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Trustless $POINTS Pool",
      description: "Secure and transparent pool system with no central authority",
      icon: <CircleDot className="h-8 w-8" />,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  // Format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Electric background with grid and effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814] to-[#0f0a29]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwNjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJWOGgydjE4em0tNCAwVjhoMnYxOGgtMnptMCA0di0yaC0ydjJoMnptLTQgMHYtMmgtMnYyaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        {/* Animated particle/star effect */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#ff3dfc' : i % 3 === 1 ? '#00ffe0' : '#7b61ff',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        {/* Electric circuit lines */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className={`absolute h-[1px] bg-gradient-to-r ${
              i % 2 === 0 ? 'from-cyan-500/30 to-purple-500/30' : 'from-purple-500/30 to-cyan-500/30'
            }`}
            style={{
              width: `${30 + Math.random() * 40}%`,
              top: `${20 + i * 20}%`,
              left: i % 2 === 0 ? '5%' : 'auto',
              right: i % 2 === 0 ? 'auto' : '5%',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              x: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4">
        {/* HERO SECTION */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center py-20 relative">
          {/* Animated Logo */}
          <motion.div
            className="mb-6 relative w-full max-w-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <img 
              src="/lovable-uploads/bf3a17bc-44e2-4651-89fc-bfc488b9370d.png" 
              alt="Pump Bounty Logo" 
              className="w-full relative z-10"
            />
          </motion.div>
          
          {/* Main Title */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            WELCOME TO<br/>PUMP BOUNTY V2.0
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-cyan-300 mb-10 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            The Future of Solana Trading
          </motion.p>
          
          {/* Main CTA Button */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <AnimatedPumpButton />
          </motion.div>
          
          {/* Floating Elements (Coins, etc.) */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`float-${i}`}
              className="absolute hidden md:block"
              style={{
                left: `${15 + i * 25}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, i % 2 === 0 ? 10 : -10, 0]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                i % 4 === 0 ? 'from-blue-600 to-cyan-400' :
                i % 4 === 1 ? 'from-purple-600 to-pink-400' :
                i % 4 === 2 ? 'from-orange-500 to-yellow-300' :
                'from-green-500 to-emerald-300'
              } flex items-center justify-center shadow-lg`}>
                <Coins className="w-6 h-6 text-white/90" />
              </div>
            </motion.div>
          ))}
          
          {/* Scrolling Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{
              y: [0, 10, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ArrowRight className="h-6 w-6 rotate-90" />
          </motion.div>
        </section>
        
        {/* ABOUT SECTION */}
        <section className="py-20 relative">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            ABOUT PUMP BOUNTY
          </motion.h2>
          
          <motion.p
            className="text-gray-400 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          >
            The journey so far and ahead
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card, index) => (
              <motion.div
                key={card.title}
                className="glass-panel relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur rounded-xl p-6 h-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.03 }}
              >
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-xl`} />
                
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-gradient-to-br ${card.color} text-white`}>
                  {card.icon}
                </div>
                
                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-gray-300 text-sm">{card.description}</p>
                
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                />
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* ROADMAP SECTION */}
        <section className="py-20 relative">
          <motion.div
            className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            ROADMAP
          </motion.h2>
          
          <motion.p
            className="text-gray-400 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            The journey so far and ahead
          </motion.p>
          
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="phase1" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
                {roadmapPhases.map(phase => (
                  <TabsTrigger 
                    key={phase.id} 
                    value={phase.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400"
                  >
                    {phase.title.split(':')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {roadmapPhases.map(phase => (
                <TabsContent 
                  key={phase.id}
                  value={phase.id}
                  className="focus-visible:outline-none focus-visible:ring-0"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel border border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-xl"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{phase.title}</h3>
                        <p className="text-gray-400">{phase.dateRange}</p>
                      </div>
                      
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium mt-2 md:mt-0",
                        phase.status === "completed" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                        phase.status === "in-progress" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      )}>
                        {phase.status === "completed" ? (
                          <div className="flex items-center">
                            <CircleCheck className="w-4 h-4 mr-1" />
                            <span>Completed</span>
                          </div>
                        ) : phase.status === "in-progress" ? (
                          <div className="flex items-center">
                            <CircleArrowRight className="w-4 h-4 mr-1" />
                            <span>In Progress</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-1" />
                            <span>Upcoming</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {phase.items.map((item, i) => (
                        <motion.div 
                          key={item.title}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * i }}
                          className="flex items-center"
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mr-3",
                            phase.status === "completed" ? "bg-green-400" :
                            phase.status === "in-progress" ? "bg-blue-400" :
                            "bg-amber-400"
                          )} />
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-400">{item.date}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Animated light path */}
                    {phase.status !== "upcoming" && (
                      <motion.div 
                        className={`absolute bottom-0 left-0 h-1 ${
                          phase.status === "completed" ? "bg-gradient-to-r from-green-500/50 to-green-300/50" :
                          "bg-gradient-to-r from-blue-500/50 to-cyan-300/50"
                        }`}
                        initial={{ width: "0%" }}
                        animate={{ width: phase.status === "completed" ? "100%" : "60%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                  </motion.div>
                  
                  <div className="flex justify-center gap-2 mt-8">
                    {roadmapPhases.map((p) => (
                      <button
                        key={p.id}
                        className={cn(
                          "w-3 h-3 rounded-full transition-colors",
                          p.id === phase.id ? 
                            p.status === "completed" ? "bg-green-400" :
                            p.status === "in-progress" ? "bg-blue-400" :
                            "bg-amber-400" :
                          "bg-gray-600"
                        )}
                        onClick={() => setActiveTab(p.id)}
                        aria-label={`Go to ${p.title}`}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>
        
        {/* PXB TOKEN STATS SECTION */}
        <section className="py-20 relative">
          <motion.div
            className="absolute -top-40 -right-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            PXB TOKEN STATS
          </motion.h2>
          
          <motion.p
            className="text-gray-400 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Real-time token statistics and metrics
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <motion.div
              className="glass-panel relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="absolute -right-20 -top-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="flex items-center mb-4">
                <div className="bg-amber-500/20 p-2 rounded-lg mr-3">
                  <Coins className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium">Total Supply</h3>
              </div>
              
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">{formatNumber(counts.supply)}</div>
              </div>
              <p className="text-amber-400 text-sm mt-1 flex items-center">
                <CalendarCheck className="h-4 w-4 mr-1" />
                Maximum supply reached
              </p>
              
              {/* Animated meter */}
              <div className="mt-4 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </motion.div>
            
            <motion.div
              className="glass-panel relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="absolute -right-20 -top-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              
              <div className="flex items-center mb-4">
                <div className="bg-cyan-500/20 p-2 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium">Holders</h3>
              </div>
              
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">{formatNumber(counts.holders)}</div>
              </div>
              <p className="text-cyan-400 text-sm mt-1">Unique wallets with PXB</p>
              
              {/* Animated meter */}
              <div className="mt-4 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '80%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </motion.div>
            
            <motion.div
              className="glass-panel relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div 
                className="absolute -right-20 -top-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
              
              <div className="flex items-center mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg mr-3">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium">Average Per Holder</h3>
              </div>
              
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">{formatNumber(counts.average)}</div>
                <div className="text-lg ml-1 text-gray-400">PXB</div>
              </div>
              <p className="text-purple-400 text-sm mt-1">Average PXB per holder</p>
              
              {/* Animated meter */}
              <div className="mt-4 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '65%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </motion.div>
          </div>
          
          <motion.div
            className="glass-panel relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-xl mt-8 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="text-center">
              <h3 className="text-xl font-medium mb-4">PXB Token Allocation</h3>
              <p className="text-cyan-400 text-lg mb-6">400M PXB allocated to $POINTS holders and other users</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Community Rewards", percentage: 40, color: "purple" },
                  { label: "Liquidity Pool", percentage: 30, color: "cyan" },
                  { label: "Development", percentage: 20, color: "blue" },
                  { label: "Team & Advisors", percentage: 10, color: "pink" }
                ].map((item, i) => (
                  <motion.div 
                    key={item.label}
                    className="p-4 rounded-lg bg-white/5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                  >
                    <p className="text-sm text-gray-400 mb-1">{item.label}</p>
                    <p className="text-xl font-bold">{item.percentage}%</p>
                    <div className="mt-2 h-2 bg-gray-800/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-${item.color}-500`}
                        initial={{ width: '0%' }}
                        whileInView={{ width: `${item.percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + (0.1 * i) }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div
              className="absolute bottom-0 right-0 w-40 h-40 opacity-10"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <img 
                src="/lovable-uploads/17d9567f-2809-4750-98f3-f47552d5c62c.png" 
                alt="PXB Logo" 
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        </section>
      </main>
      
      <Footer />
      
      {/* Floating AI Chatbot Button */}
      <motion.div
        className="fixed right-6 bottom-24 z-50"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Button 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-2 h-auto"
        >
          <Sparkles className="h-5 w-5" />
          <span>AI Chatbot</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default Home;
