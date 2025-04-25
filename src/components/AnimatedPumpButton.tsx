
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const AnimatedPumpButton = () => {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 rounded-lg blur-md opacity-75"
        animate={{
          background: [
            'linear-gradient(to right, #9333ea, #06b6d4, #9333ea)',
            'linear-gradient(to right, #06b6d4, #9333ea, #06b6d4)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.button
        className="relative px-8 py-4 bg-black rounded-lg font-bold text-white border border-purple-500/30
                   overflow-hidden group flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
          <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            PumpXBounty V 1.0
          </span>
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-cyan-900/20"
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
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
