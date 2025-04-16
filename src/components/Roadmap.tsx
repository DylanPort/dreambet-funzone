
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, CircleDot, Zap, Users, Trophy, Coins, Rocket, Gift, Code, Globe } from 'lucide-react';

interface RoadmapPhaseProps {
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  icon: React.ReactNode;
  position: 'left' | 'right';
}

const RoadmapPhase: React.FC<RoadmapPhaseProps> = ({ 
  title, 
  description, 
  isCompleted, 
  isActive,
  icon,
  position
}) => {
  return (
    <motion.div 
      className={`relative flex items-center gap-8 ${position === 'left' ? 'flex-row-reverse' : 'flex-row'} my-8`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`w-1/2 ${position === 'left' ? 'text-right pr-8' : 'text-left pl-8'}`}>
        <motion.h3 
          className="text-xl font-bold mb-2 text-white flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {position === 'right' && icon}
          {title}
          {position === 'left' && icon}
        </motion.h3>
        <motion.p 
          className="text-indigo-300/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="relative">
          <motion.div 
            className={`
              w-12 h-12 rounded-full flex items-center justify-center 
              ${isCompleted 
                ? 'bg-green-500/20 text-green-500 border-2 border-green-500' 
                : isActive 
                  ? 'bg-indigo-500/20 text-indigo-500 border-2 border-indigo-500 animate-pulse' 
                  : 'bg-gray-800/50 text-gray-500 border-2 border-gray-700'
              }
            `}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
          >
            {isCompleted ? <CheckCircle2 size={24} /> : isActive ? <CircleDot size={24} /> : <Circle size={24} />}
          </motion.div>
        </div>
        <motion.div 
          className="w-1 h-24 bg-gradient-to-b from-indigo-500/50 to-transparent"
          initial={{ height: 0 }}
          animate={{ height: 100 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
      
      <div className="w-1/2"></div>
    </motion.div>
  );
};

const Roadmap: React.FC = () => {
  const phases = [
    {
      title: "Phase 1: Token Launch",
      description: "Initial PXB launch with 1 billion supply fully minted. Set up tokenomics and distribution mechanics.",
      isCompleted: true,
      isActive: false,
      icon: <Coins className="h-5 w-5 text-green-500" />,
      position: 'left' as const
    },
    {
      title: "Phase 2: Community Building",
      description: "Grow the PXB community through social media campaigns and engagement activities.",
      isCompleted: false,
      isActive: true,
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      position: 'right' as const
    },
    {
      title: "Phase 3: Platform Growth",
      description: "Expand betting features and launch additional prediction markets.",
      isCompleted: false,
      isActive: false,
      icon: <Zap className="h-5 w-5 text-gray-500" />,
      position: 'left' as const
    },
    {
      title: "Phase 4: Partnerships",
      description: "Strategic partnerships with other projects and integration with major platforms.",
      isCompleted: false,
      isActive: false,
      icon: <Rocket className="h-5 w-5 text-gray-500" />,
      position: 'right' as const
    },
    {
      title: "Phase 5: Global Expansion",
      description: "Worldwide adoption and listing on major exchanges.",
      isCompleted: false,
      isActive: false,
      icon: <Globe className="h-5 w-5 text-gray-500" />,
      position: 'left' as const
    }
  ];

  return (
    <div className="py-16">
      <motion.h2 
        className="text-3xl md:text-4xl font-bold text-center mb-16
          bg-gradient-to-r from-white via-indigo-300 to-blue-300 bg-clip-text text-transparent
          flex justify-center items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Trophy className="h-8 w-8 text-indigo-500" />
        PXB Roadmap
      </motion.h2>
      
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-900/30 -translate-x-1/2"></div>
        
        {phases.map((phase, index) => (
          <RoadmapPhase 
            key={index}
            title={phase.title}
            description={phase.description}
            isCompleted={phase.isCompleted}
            isActive={phase.isActive}
            icon={phase.icon}
            position={phase.position}
          />
        ))}
        
        <motion.div 
          className="absolute left-1/2 bottom-0 w-8 h-8 -translate-x-1/2 translate-y-4
            flex items-center justify-center bg-indigo-600 text-white rounded-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Gift className="h-4 w-4" />
        </motion.div>
      </div>
    </div>
  );
};

export default Roadmap;
