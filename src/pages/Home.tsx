
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import AnimatedPumpButton from '@/components/AnimatedPumpButton';

const Home = () => {
  const navigate = useNavigate();

  const handleEnterApp = () => {
    navigate('/index');
  };

  return (
    <div className="relative min-h-screen bg-[#050814] overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/lovable-uploads/812be89a-9780-4121-b74f-a55561af4714.png')",
          backgroundSize: 'cover'
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-4">
        {/* Main enter button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16">
          <AnimatedPumpButton />
        </div>

        {/* Feature buttons */}
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
  );
};

export default Home;
