
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trophy, Rocket, Zap, Star, Users, Calendar, DollarSign, Repeat, CircleCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const Roadmap = () => {
  const [activePhase, setActivePhase] = useState<string>('phase1');

  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Foundation',
      status: 'complete',
      description: 'Establishing the PXB platform and token distribution',
      milestones: [
        { id: 1, text: 'Platform MVP Launch', complete: true },
        { id: 2, text: 'Complete Token Minting', complete: true },
        { id: 3, text: 'Initial User Onboarding', complete: true },
        { id: 4, text: 'Basic Trading Functionality', complete: true }
      ],
      icon: <Rocket className="w-5 h-5" />
    },
    {
      id: 'phase2',
      title: 'Phase 2: Growth',
      status: 'in-progress',
      description: 'Expanding platform capabilities and user base',
      milestones: [
        { id: 1, text: 'Enhanced Trading Features', complete: false },
        { id: 2, text: 'Community Engagement Programs', complete: false },
        { id: 3, text: 'PXB Staking Implementation', complete: false },
        { id: 4, text: 'Partner Integrations', complete: false }
      ],
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'phase3',
      title: 'Phase 3: Expansion',
      status: 'upcoming',
      description: 'Scaling the ecosystem and introducing advanced features',
      milestones: [
        { id: 1, text: 'Cross-chain Functionality', complete: false },
        { id: 2, text: 'Advanced Analytics Dashboard', complete: false },
        { id: 3, text: 'Governance System', complete: false },
        { id: 4, text: 'Decentralized Exchange Integration', complete: false }
      ],
      icon: <Star className="w-5 h-5" />
    },
    {
      id: 'phase4',
      title: 'Phase 4: Maturity',
      status: 'upcoming',
      description: 'Establishing PXB as a key player in the ecosystem',
      milestones: [
        { id: 1, text: 'Global Expansion', complete: false },
        { id: 2, text: 'Enterprise Partnerships', complete: false },
        { id: 3, text: 'Advanced Financial Products', complete: false },
        { id: 4, text: 'Ecosystem Fund Launch', complete: false }
      ],
      icon: <Trophy className="w-5 h-5" />
    }
  ];

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

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div 
        className="text-center mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-500 bg-clip-text text-transparent inline-block">
          PXB Development Roadmap
        </h2>
        <p className="text-gray-400 mt-2">Our journey to revolutionize the crypto economy</p>
        
        <div className="mt-6 flex justify-center space-x-1">
          {phases.map((phase) => (
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
              transition={{ duration: 0.5, delay: 0.2 * phases.indexOf(phase) }}
            />
          ))}
        </div>
      </motion.div>

      <Tabs
        defaultValue="phase1"
        value={activePhase}
        onValueChange={setActivePhase}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          {phases.map((phase) => (
            <TabsTrigger
              key={phase.id}
              value={phase.id}
              className={cn(
                "relative py-3 flex flex-col items-center space-y-1",
                "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:w-full data-[state=active]:after:h-[3px] data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-purple-500 data-[state=active]:after:to-cyan-400"
              )}
            >
              <span className="flex items-center gap-1.5">
                {phase.icon}
                {phase.status === 'complete' && <CircleCheck className="w-4 h-4 text-green-500" />}
              </span>
              <span className="text-xs font-medium hidden md:block">{phase.title.split(':')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="pt-2">
            <motion.div
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-xl"
              initial="hidden"
              animate={activePhase === phase.id ? "visible" : "hidden"}
              variants={staggerChildren}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{phase.title}</h3>
                  <p className="text-gray-400">{phase.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  phase.status === 'complete'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : phase.status === 'in-progress'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                }`}>
                  {phase.status === 'complete' ? 'Completed' : phase.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {phase.milestones.map((milestone) => (
                  <motion.div
                    key={milestone.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/5"
                    variants={fadeInUp}
                  >
                    <div className={`rounded-full p-1 ${
                      milestone.complete ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {milestone.complete ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>
                    <span className={milestone.complete ? 'text-white' : 'text-gray-400'}>
                      {milestone.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Roadmap;
