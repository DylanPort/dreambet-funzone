import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const AnimatedPumpButton = () => {
  return (
    <motion.div
      className="relative group"
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
    >
      {/* Glowing background effect */}
      <motion.div 
        className="absolute -inset-1 bg-gradient-to-r from-[#0066FF] via-[#00FFE0] to-[#0066FF] rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />

      {/* Main Button */}
      <motion.button
        className="relative px-8 py-4 bg-[#011B3B] rounded-lg font-bold text-white border border-[#0066FF]/30 
                   overflow-hidden group flex items-center gap-2 w-full justify-center min-w-[300px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="relative z-10 bg-gradient-to-r from-[#00FFE0] via-white to-[#00FFE0] 
                        bg-clip-text text-transparent text-xl">
          ENTER PUMPXBOUNTY V2.0
        </span>

        {/* Animated Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#0066FF]/20 to-[#00FFE0]/20 opacity-0 
                     group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      </motion.button>
    </motion.div>
  );
};

export default AnimatedPumpButton;
