
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedLogo = () => {
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
            rotateY: [-20, 20, -10, 15, -20],
            rotateX: [5, -5, 8, -3, 5],
            z: [50, 0, -30, 20, 50],
            filter: [
              "drop-shadow(0 0 15px rgba(51, 195, 240, 0.5))",
              "drop-shadow(0 0 30px rgba(14, 165, 233, 0.8))",
              "drop-shadow(0 0 20px rgba(123, 97, 255, 0.7))",
              "drop-shadow(0 0 25px rgba(255, 61, 252, 0.6))",
              "drop-shadow(0 0 15px rgba(51, 195, 240, 0.5))"
            ]
          }}
          transition={{ 
            duration: 8,
            rotateY: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 10,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            },
            rotateX: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 8,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            },
            z: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 10,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            },
            filter: {
              duration: 8,
              repeat: Infinity,
              repeatType: "loop",
              times: [0, 0.25, 0.5, 0.75, 1]
            },
            scale: {
              duration: 1.2,
              delay: 0.3
            }
          }}
          style={{
            transformStyle: "preserve-3d",
            perspective: "1200px",
            backfaceVisibility: "hidden"
          }}
        />
        
        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'bg-[#33C3F0]' : i % 3 === 1 ? 'bg-[#FF3DFC]' : 'bg-[#7B61FF]'}`}
            style={{
              width: Math.random() * 10 + 2,
              height: Math.random() * 10 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              zIndex: Math.random() > 0.5 ? 1 : -1,
              opacity: Math.random() * 0.5 + 0.3
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.9, 0],
              y: [0, -40 - Math.random() * 60],
              x: [0, (Math.random() - 0.5) * 80],
              z: [0, Math.random() * 80],
              scale: [1, Math.random() * 0.5 + 1, 0.8]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              repeatDelay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Orbit light trace effect */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${i === 0 ? '#33C3F0' : i === 1 ? '#FF3DFC' : '#7B61FF'} 0%, transparent 70%)`,
              width: 300 + i * 80,
              height: 300 + i * 80,
              zIndex: -2
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              rotate: {
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default AnimatedLogo;
