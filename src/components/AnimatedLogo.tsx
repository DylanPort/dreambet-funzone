
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedLogo = () => {
  return (
    <div className="flex justify-center items-center w-full my-12 mx-auto">
      <motion.div
        className="relative w-[350px] md:w-[450px] h-[180px] md:h-[220px] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.img
          src="/lovable-uploads/cacd6344-a731-4fcf-8ae1-de6fc1aee605.png"
          alt="Pump X Bounty Logo"
          className="w-full h-full object-contain"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            filter: [
              "drop-shadow(0 0 5px rgba(51, 195, 240, 0.3))",
              "drop-shadow(0 0 20px rgba(14, 165, 233, 0.6))",
              "drop-shadow(0 0 5px rgba(51, 195, 240, 0.3))"
            ]
          }}
          transition={{ 
            duration: 1.2,
            delay: 0.3,
            filter: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
        />
        
        {/* Floating particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#33C3F0]"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              y: [0, -20 - Math.random() * 30],
              x: [0, (Math.random() - 0.5) * 40]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              repeatDelay: Math.random() * 3
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default AnimatedLogo;
