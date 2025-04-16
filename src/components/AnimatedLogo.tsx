
import React from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const AnimatedLogo = () => {
  const isMobile = useIsMobile();
  
  // Return null if on mobile device
  if (isMobile) {
    return null;
  }
  
  return (
    <div className="flex justify-center items-center w-full my-12 mx-auto">
      <motion.div
        className="relative w-[400px] md:w-[550px] h-[230px] md:h-[280px] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.img
          src="/lovable-uploads/cacd6344-a731-4fcf-8ae1-de6fc1aee605.png"
          alt="Pump X Bounty Logo"
          className="w-full h-full object-contain"
          initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
          animate={{ 
            opacity: 1, 
            scale: 1.2,
            rotateY: [-10, 10],
            z: [-15, 15],
            filter: [
              "drop-shadow(0 0 10px rgba(51, 195, 240, 0.4))",
              "drop-shadow(0 0 25px rgba(14, 165, 233, 0.7))"
            ]
          }}
          transition={{ 
            duration: 3,
            rotateY: {
              repeat: Infinity,
              repeatType: "reverse",
              duration: 8,
              ease: "easeInOut"
            },
            z: {
              repeat: Infinity,
              repeatType: "reverse",
              duration: 8,
              ease: "easeInOut"
            },
            filter: {
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            },
            scale: {
              duration: 1.2,
              delay: 0.3
            }
          }}
          style={{
            transform: "perspective(1000px)"
          }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#33C3F0]"
            style={{
              height: `${Math.random() * 8 + 2}px`,
              width: `${Math.random() * 8 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              zIndex: Math.random() > 0.5 ? 1 : -1
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8],
              y: [0, -30 - Math.random() * 40],
              x: [0, (Math.random() - 0.5) * 60]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 5
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default AnimatedLogo;
