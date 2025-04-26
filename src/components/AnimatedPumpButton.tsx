
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
        className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 rounded-lg blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"
        animate={{
          backgroundPosition: [
            '0% 50%', 
            '100% 50%', 
            '0% 50%'
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />

      {/* Main Button */}
      <motion.button
        className="relative px-8 py-4 bg-black rounded-lg font-bold text-white border border-purple-500/30 
                   overflow-hidden group flex items-center gap-2 w-full justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sparkle Icon and Text */}
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles 
            className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors 
                       animate-pulse group-hover:animate-spin"
          />
          <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-400 
                           bg-clip-text text-transparent group-hover:from-cyan-300 
                           group-hover:via-purple-400 group-hover:to-cyan-300 
                           transition-all duration-300">
            PumpXBounty V2.O
          </span>
        </span>

        {/* Animated Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 opacity-0 
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
