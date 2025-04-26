
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedPumpButton from '@/components/AnimatedPumpButton';

const ImagePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      {/* Container with natural height to allow scrolling */}
      <div className="relative w-full">
        {/* Background image */}
        <img
          src="/lovable-uploads/54b37fbb-be97-4cca-84fe-021cc7b89c2c.png"
          alt="Pump Bounty V2.0"
          className="w-full h-auto object-cover"
        />

        {/* Interactive elements overlay */}
        <div className="absolute inset-0 flex flex-col items-center">
          {/* Main enter button positioned in the middle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16">
            <AnimatedPumpButton />
          </div>

          {/* Feature buttons positioned at the bottom */}
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 flex gap-4 flex-wrap justify-center w-full max-w-4xl px-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-[#011B3B]/80 border border-[#0066FF]/30 text-cyan-400 backdrop-blur-sm"
              onClick={() => navigate('/trading')}
            >
              Risk-capped trading
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-[#011B3B]/80 border border-[#0066FF]/30 text-cyan-400 backdrop-blur-sm"
            >
              5x upside potential
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-[#011B3B]/80 border border-[#0066FF]/30 text-cyan-400 backdrop-blur-sm"
            >
              Fee redistribution to holders
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg bg-[#011B3B]/80 border border-[#0066FF]/30 text-cyan-400 backdrop-blur-sm"
            >
              AI chatbot for token
            </motion.button>
          </div>

          {/* AI Chat Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-8 right-8 px-4 py-2 rounded-lg bg-[#2A0066]/80 border border-purple-500/30 text-purple-300 backdrop-blur-sm"
          >
            AI Chat
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
