
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Trophy, 
  Rocket, 
  Zap, 
  Star, 
  Users, 
  Calendar, 
  ArrowRight,
  BarChart, 
  CircleCheck,
  DollarSign,
  Globe,
  TrendingUp,
  LineChart,
  ChevronDown,
  Database,
  Layers,
  Building,
  BadgeDollarSign,
  Coins
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, isWithinInterval, parseISO } from 'date-fns';

const Roadmap = () => {
  const [activePhase, setActivePhase] = useState<string>('phase1');
  const [currentDate] = useState(new Date());
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Define phase dates
  const phaseDates = {
    phase1: { start: '2024-01-01', end: '2024-04-16' },
    phase2: { start: '2024-04-17', end: '2024-05-20' },
    phase3: { start: '2024-05-26', end: '2024-06-15' },
    phase4: { start: '2024-06-16', end: '2024-12-31' }, // End date to be announced
  };

  // Check if a date is in the future, past, or current
  const getDateStatus = (dateString: string) => {
    if (!dateString) return 'tba';
    try {
      const date = parseISO(dateString);
      if (isBefore(date, currentDate)) return 'past';
      if (isAfter(date, currentDate)) return 'future';
      return 'current';
    } catch (e) {
      return 'tba';
    }
  };

  // Check if we're currently in a phase
  const isCurrentPhase = (phaseId: string) => {
    const { start, end } = phaseDates[phaseId as keyof typeof phaseDates];
    if (!start || !end) return false;
    
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      return isWithinInterval(currentDate, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'TBA') return 'TBA';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Foundation',
      status: 'complete',
      description: 'Establishing the PXB platform and token distribution',
      timeframe: `${formatDate(phaseDates.phase1.start)} - ${formatDate(phaseDates.phase1.end)}`,
      milestones: [
        { id: 1, text: 'Platform MVP Launch', complete: true, date: '2024-01-15' },
        { id: 2, text: 'Complete Token Minting', complete: true, date: '2024-02-10' },
        { id: 3, text: 'Initial User Onboarding', complete: true, date: '2024-03-05' },
        { id: 4, text: 'Basic Trading Functionality', complete: true, date: '2024-04-01' }
      ],
      icon: <Rocket className="w-6 h-6" />
    },
    {
      id: 'phase2',
      title: 'Phase 2: Growth',
      status: isCurrentPhase('phase2') ? 'in-progress' : getDateStatus(phaseDates.phase2.start) === 'future' ? 'upcoming' : 'complete',
      description: 'Expanding platform capabilities and user base',
      timeframe: `${formatDate(phaseDates.phase2.start)} - ${formatDate(phaseDates.phase2.end)}`,
      milestones: [
        { id: 1, text: 'Enhanced Trading Simulator', complete: false, date: '2024-04-25' },
        { id: 2, text: '$POINT Pool Integration', complete: false, date: '2024-05-15' },
        { id: 3, text: 'Community Engagement Programs', complete: false, date: '2024-04-30' },
        { id: 4, text: 'Partner Integrations', complete: false, date: '2024-05-10' }
      ],
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 'phase3',
      title: 'Phase 3: Expansion',
      status: isCurrentPhase('phase3') ? 'in-progress' : getDateStatus(phaseDates.phase3.start) === 'future' ? 'upcoming' : 'complete',
      description: 'Scaling the ecosystem and introducing advanced features',
      timeframe: `${formatDate(phaseDates.phase3.start)} - ${formatDate(phaseDates.phase3.end)}`,
      milestones: [
        { id: 1, text: 'Cross-chain Paper Trading', complete: false, date: '2024-05-28' },
        { id: 2, text: 'Leverage Trading Simulator', complete: false, date: '2024-06-05' },
        { id: 3, text: 'Advanced Analytics Dashboard', complete: false, date: '2024-06-10' },
        { id: 4, text: 'DEX Simulator', complete: false, date: '2024-06-15' }
      ],
      icon: <Star className="w-6 h-6" />
    },
    {
      id: 'phase4',
      title: 'Phase 4: Maturity',
      status: 'upcoming',
      description: 'Establishing PXB as a key player in the ecosystem',
      timeframe: 'To Be Announced',
      milestones: [
        { id: 1, text: 'Marketing and Expansion', complete: false, date: 'TBA' },
        { id: 2, text: 'Financial Products and Ads', complete: false, date: 'TBA' },
        { id: 3, text: 'Enterprise Partnerships', complete: false, date: 'TBA' },
        { id: 4, text: 'Ecosystem Fund Launch', complete: false, date: 'TBA' }
      ],
      icon: <Trophy className="w-6 h-6" />
    }
  ];

  // Custom icons for milestones to make them more visually distinct
  const getMilestoneIcon = (phaseId: string, milestoneIndex: number) => {
    const iconMap: Record<string, React.ReactNode[]> = {
      phase1: [
        <Rocket key="rocket" className="w-4 h-4" />,
        <Coins key="coins" className="w-4 h-4" />,
        <Users key="users" className="w-4 h-4" />,
        <TrendingUp key="trending" className="w-4 h-4" />
      ],
      phase2: [
        <BarChart key="chart" className="w-4 h-4" />,
        <DollarSign key="dollar" className="w-4 h-4" />,
        <Users key="users" className="w-4 h-4" />,
        <Globe key="globe" className="w-4 h-4" />
      ],
      phase3: [
        <Globe key="globe" className="w-4 h-4" />,
        <LineChart key="linechart" className="w-4 h-4" />,
        <BarChart key="barchart" className="w-4 h-4" />,
        <Database key="database" className="w-4 h-4" />
      ],
      phase4: [
        <TrendingUp key="trending" className="w-4 h-4" />,
        <BadgeDollarSign key="badge" className="w-4 h-4" />,
        <Building key="building" className="w-4 h-4" />,
        <Layers key="layers" className="w-4 h-4" />
      ]
    };
    
    return iconMap[phaseId]?.[milestoneIndex] || <Calendar className="w-4 h-4" />;
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    }
  };

  const progressBarVariants = {
    initial: { width: 0 },
    animate: (i: number) => ({
      width: '100%',
      transition: {
        duration: 1.5,
        delay: i * 0.2
      }
    })
  };

  // Timeline component to visualize the phases
  const Timeline = () => {
    return (
      <div className="relative mt-12 mb-8 px-4">
        <div className="absolute left-0 right-0 h-1 bg-gray-800 top-4"></div>
        
        <div className="relative flex justify-between">
          {phases.map((phase, i) => {
            const isCurrent = isCurrentPhase(phase.id);
            const isCompleted = phase.status === 'complete';
            const dateStatus = getDateStatus(phaseDates[phase.id as keyof typeof phaseDates].start);
            
            return (
              <motion.div 
                key={phase.id}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <motion.div 
                  className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                    isCompleted 
                      ? 'bg-green-500 text-black' 
                      : isCurrent 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-gray-700 text-gray-300'
                  }`}
                  animate={isCurrent ? pulseAnimation : {}}
                  whileHover={{ scale: 1.1 }}
                >
                  {isCompleted ? (
                    <CircleCheck className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                  
                  {/* Connection line to next node */}
                  {i < phases.length - 1 && (
                    <motion.div 
                      className={`absolute left-full top-1/2 h-0.5 -translate-y-1/2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: 'calc(100vw / 5)' }}
                      transition={{ duration: 1, delay: i * 0.3 }}
                    />
                  )}
                </motion.div>
                
                <motion.p 
                  className={`text-xs font-medium ${
                    isCompleted ? 'text-green-400' : isCurrent ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.2 + 0.3 }}
                >
                  {phase.title.split(':')[0]}
                </motion.p>
                
                <motion.p 
                  className="text-[10px] text-gray-500 mt-1 max-w-[100px] text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.2 + 0.4 }}
                >
                  {phase.timeframe}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div 
        className="text-center mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <motion.h2 
          className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-500 bg-clip-text text-transparent inline-block"
          animate={{ 
            textShadow: ["0 0 8px rgba(167, 139, 250, 0)", "0 0 15px rgba(167, 139, 250, 0.5)", "0 0 8px rgba(167, 139, 250, 0)"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          PXB Development Roadmap
        </motion.h2>
        <p className="text-gray-400 mt-2">Our journey to revolutionize the crypto economy</p>
        
        <motion.div 
          className="mt-6 flex justify-center space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              className={`h-2 w-16 rounded-full ${
                phase.status === 'complete' 
                  ? 'bg-green-500' 
                  : phase.status === 'in-progress' 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-700'
              }`}
              initial={{ width: 0 }}
              animate={{ width: '4rem' }}
              transition={{ duration: 0.5, delay: 0.2 * index }}
              whileHover={{ scale: 1.05 }}
            />
          ))}
        </motion.div>
      </motion.div>
      
      {/* Timeline visualization */}
      <Timeline />

      <Tabs
        defaultValue="phase1"
        value={activePhase}
        onValueChange={setActivePhase}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          {phases.map((phase, idx) => (
            <TabsTrigger
              key={phase.id}
              value={phase.id}
              className={cn(
                "relative py-3 flex flex-col items-center space-y-1 overflow-hidden group",
                "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:w-full data-[state=active]:after:h-[3px] data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:to-cyan-400"
              )}
              onClick={() => setActivePhase(phase.id)}
            >
              <motion.div 
                className="flex items-center gap-1.5 relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  className={`p-1 rounded-full ${
                    phase.status === 'complete' 
                      ? 'bg-green-500/20 text-green-400' 
                      : phase.status === 'in-progress' 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-gray-700/50 text-gray-400'
                  }`}
                  animate={phase.status === 'in-progress' ? pulseAnimation : {}}
                >
                  {phase.icon}
                </motion.div>
                {phase.status === 'complete' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.2 }}
                  >
                    <CircleCheck className="w-4 h-4 text-green-500" />
                  </motion.div>
                )}
              </motion.div>
              
              <span className="text-xs font-medium md:block hidden">{phase.title.split(':')[0]}</span>
              
              {/* Animated underline effect on hover */}
              <motion.div 
                className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1, opacity: 0.7 }}
                transition={{ duration: 0.3 }}
                style={{ originX: 0 }}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="pt-2">
            <motion.div
              className="relative bg-gradient-to-br from-black/80 to-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-xl overflow-hidden"
              initial="hidden"
              animate={activePhase === phase.id ? "visible" : "hidden"}
              variants={staggerChildren}
            >
              {/* Animated background elements */}
              <motion.div 
                className="absolute -right-20 -top-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.4, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              <motion.div 
                className="absolute -left-20 -bottom-20 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <span 
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                          phase.status === 'complete' 
                            ? 'bg-green-500/20 text-green-400' 
                            : phase.status === 'in-progress' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-gray-700/30 text-gray-400'
                        }`}
                      >
                        {phase.icon}
                      </span>
                      {phase.title}
                    </h3>
                    <p className="text-gray-400 ml-11">{phase.description}</p>
                    
                    <motion.p 
                      className="text-sm text-gray-500 ml-11 mt-1 flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {phase.timeframe}
                    </motion.p>
                  </motion.div>
                  
                  <motion.div 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      phase.status === 'complete'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : phase.status === 'in-progress'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {phase.status === 'complete' ? 'Completed' : phase.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {phase.milestones.map((milestone, idx) => {
                    // Calculate if the milestone is current, upcoming or past
                    const milestoneDate = milestone.date ? parseISO(milestone.date) : null;
                    const isPast = milestoneDate && isBefore(milestoneDate, currentDate);
                    const isCurrent = milestoneDate && 
                      isWithinInterval(currentDate, { 
                        start: new Date(milestoneDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
                        end: new Date(milestoneDate.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days after
                      });
                    
                    return (
                      <motion.div
                        key={milestone.id}
                        className={`relative flex items-start gap-3 p-4 rounded-lg border overflow-hidden ${
                          milestone.complete 
                            ? 'border-green-500/20 bg-green-900/5' 
                            : isCurrent
                              ? 'border-yellow-500/20 bg-yellow-900/5'
                              : 'border-white/5 bg-white/5'
                        }`}
                        variants={fadeInUp}
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)"
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Animated highlight effect for current milestone */}
                        {isCurrent && (
                          <motion.div 
                            className="absolute inset-0 bg-yellow-400/5"
                            animate={{
                              opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          />
                        )}
                        
                        <div className={`rounded-full p-2 ${
                          milestone.complete 
                            ? 'bg-green-500/20 text-green-400' 
                            : isCurrent
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-700/70 text-gray-400'
                        }`}>
                          {milestone.complete ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            getMilestoneIcon(phase.id, idx)
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className={milestone.complete ? 'text-white font-medium' : isCurrent ? 'text-yellow-200' : 'text-gray-300'}>
                              {milestone.text}
                            </span>
                            
                            {milestone.date && (
                              <motion.span 
                                className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                                  milestone.complete 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : isCurrent
                                      ? 'bg-yellow-500/10 text-yellow-400'
                                      : 'bg-gray-700/30 text-gray-400'
                                }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                              >
                                {formatDate(milestone.date)}
                              </motion.span>
                            )}
                          </div>
                          
                          {/* Progress bar for completed milestones */}
                          {milestone.complete ? (
                            <motion.div 
                              className="w-full h-1 bg-gray-800 rounded-full mt-3 overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 + idx * 0.1 }}
                            >
                              <motion.div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                                variants={progressBarVariants}
                                initial="initial"
                                animate="animate"
                                custom={idx}
                              />
                            </motion.div>
                          ) : isCurrent ? (
                            <motion.div 
                              className="w-full h-1 bg-gray-800 rounded-full mt-3 overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 + idx * 0.1 }}
                            >
                              <motion.div
                                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400"
                                initial={{ width: '0%' }}
                                animate={{ width: '60%' }}
                                transition={{ duration: 1.5, delay: 0.2 * idx }}
                              />
                            </motion.div>
                          ) : null}
                          
                          {/* Connection lines between milestones */}
                          {idx < phase.milestones.length - 1 && idx % 2 === 0 && (
                            <motion.div
                              className="absolute bottom-0 right-1/4 w-0.5 h-6 bg-gradient-to-b from-gray-600/50 to-transparent"
                              initial={{ height: 0 }}
                              animate={{ height: 24 }}
                              transition={{ delay: 0.6 + idx * 0.1, duration: 0.4 }}
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Animated call to action for current phase */}
                {phase.status === 'in-progress' && (
                  <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <p className="text-cyan-400 text-sm mb-2">This phase is currently active!</p>
                    <motion.div 
                      className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 text-white text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Follow our progress</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Roadmap;
