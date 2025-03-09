
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AnimatedLogo = () => {
  return (
    <div className="flex justify-center items-center w-full">
      <motion.div
        className="relative w-[300px] md:w-[400px] h-[150px] md:h-[200px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Pump text */}
        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.8, 
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.span 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#33C3F0]"
            animate={{ 
              color: ["#33C3F0", "#0EA5E9", "#33C3F0"],
              textShadow: [
                "0 0 5px rgba(51, 195, 240, 0.3)",
                "0 0 20px rgba(14, 165, 233, 0.6)",
                "0 0 5px rgba(51, 195, 240, 0.3)"
              ]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Pump
          </motion.span>
        </motion.div>
        
        {/* Bounty text */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.6, 
            duration: 0.8, 
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.span 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#33C3F0]"
            animate={{ 
              color: ["#33C3F0", "#0EA5E9", "#33C3F0"],
              textShadow: [
                "0 0 5px rgba(51, 195, 240, 0.3)",
                "0 0 20px rgba(14, 165, 233, 0.6)",
                "0 0 5px rgba(51, 195, 240, 0.3)"
              ]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.5
            }}
          >
            Bounty
          </motion.span>
        </motion.div>
        
        {/* The X line */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[150px] md:w-[200px] h-[4px] bg-[#33C3F0] rounded-full"
          style={{ originX: 0.5, originY: 0.5 }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotate: 45,
            boxShadow: [
              "0 0 5px rgba(51, 195, 240, 0.5)",
              "0 0 15px rgba(14, 165, 233, 0.8)",
              "0 0 5px rgba(51, 195, 240, 0.5)"
            ]
          }}
          transition={{ 
            delay: 1.2, 
            duration: 0.8,
            boxShadow: {
              duration: 2,
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
