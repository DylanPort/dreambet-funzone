
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FuturisticTokenCardProps {
  token: any;
  isActive: boolean;
}

const FuturisticTokenCard: React.FC<FuturisticTokenCardProps> = ({ token, isActive }) => {
  const isPositive = token.change24h >= 0;
  
  const getTokenSymbol = (token: any) => {
    if (!token) return 'T';
    return token.symbol ? token.symbol.charAt(0).toUpperCase() : 'T';
  };
  
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "0.000000";
    if (numPrice < 0.01) return numPrice.toFixed(6);
    if (numPrice < 1) return numPrice.toFixed(4);
    if (numPrice < 1000) return numPrice.toFixed(2);
    return numPrice.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  return (
    <motion.div 
      className="glass-panel p-5 relative z-10 w-[280px] mx-auto"
      initial={{ opacity: 0, scale: 0.8, rotateY: -15, rotateX: 5 }}
      animate={{ 
        opacity: isActive ? 1 : 0, 
        scale: isActive ? 1 : 0.8,
        rotateY: isActive ? 0 : -15,
        rotateX: isActive ? 0 : 5,
        boxShadow: `0 0 25px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.7)`,
        borderColor: isPositive ? 'rgba(0, 255, 120, 0.5)' : 'rgba(255, 61, 252, 0.5)'
      }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 15, rotateX: -5 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.19, 1, 0.22, 1],
        opacity: { duration: 0.5 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
      }}
    >
      {/* Holographic Effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-shine"></div>
        <motion.div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        ></motion.div>
      </div>
      
      {/* Token Info */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          {token.imageUrl ? (
            <img 
              src={token.imageUrl} 
              alt={token.name} 
              className="w-8 h-8 rounded-full object-cover" 
              onError={(e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.style.display = 'none';
                const nextElement = imgElement.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }} 
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-300/20 flex items-center justify-center border border-white/10 ${token.imageUrl ? 'hidden' : ''}`}>
            <span className="font-display font-bold">{getTokenSymbol(token)}</span>
          </div>
          <span className="ml-2 font-semibold">{token.name}</span>
        </div>
        <div className="flex items-center">
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">PumpFun</span>
        </div>
      </div>
      
      {/* Price Display */}
      <div className="relative h-[80px] mb-3 rounded-md overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        ></motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <motion.span 
              className={`text-xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              ${formatPrice(token.currentPrice)}
            </motion.span>
            <motion.div 
              className="absolute -right-8 -top-4"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
              </span>
            </motion.div>
          </div>
        </div>
        
        {/* Animated scan line */}
        <motion.div 
          className="absolute bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50"
          style={{ height: '10px', width: '100%' }}
          animate={{ 
            top: ['0%', '100%', '0%'],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        ></motion.div>
      </div>
      
      {/* Action Buttons */}
      <motion.div 
        className="flex justify-around"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <button className="btn-moon py-1 px-3 text-sm relative overflow-hidden group">
          <span className="relative z-10 flex items-center">
            Moon <ArrowUp className="w-3 h-3 ml-1" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-green-300/30 group-hover:from-green-500/50 group-hover:to-green-300/50 transition-all duration-300"></div>
        </button>
        <button className="btn-die py-1 px-3 text-sm relative overflow-hidden group">
          <span className="relative z-10 flex items-center">
            Die <ArrowDown className="w-3 h-3 ml-1" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-red-300/30 group-hover:from-red-500/50 group-hover:to-red-300/50 transition-all duration-300"></div>
        </button>
      </motion.div>
      
      {/* Token Links */}
      <motion.div 
        className="flex justify-between items-center mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Link to={`/token/${token.id}`} className="text-xs text-dream-foreground/70 hover:text-dream-foreground transition-colors duration-300">
          View Details
        </Link>
        <Link to="#" className="text-xs text-dream-foreground/70 hover:text-dream-foreground transition-colors duration-300 flex items-center">
          <ExternalLink className="w-3 h-3 mr-1" /> Pump.fun
        </Link>
      </motion.div>
      
      {/* Data Flow Visualization */}
      <motion.div 
        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent2/20 to-dream-accent3/20 flex items-center justify-center"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <Zap className="w-4 h-4 text-dream-accent2" />
      </motion.div>
    </motion.div>
  );
};

const FuturisticTokenDisplay: React.FC<{ tokens: any[] }> = ({ tokens }) => {
  const [activeTokenIndex, setActiveTokenIndex] = useState(0);
  
  useEffect(() => {
    // Create token rotation interval
    const interval = setInterval(() => {
      setActiveTokenIndex(prevIndex => (prevIndex + 1) % tokens.length);
    }, 8000); // Change token every 8 seconds
    
    return () => clearInterval(interval);
  }, [tokens.length]);
  
  // Floating orbs background effect
  const orbCount = 5;
  const orbs = Array.from({ length: orbCount }).map((_, i) => ({
    id: i,
    initialX: 50 + (Math.random() * 20 - 10), // Around center
    initialY: 50 + (Math.random() * 20 - 10), // Around center
    size: 10 + Math.random() * 15,
    duration: 15 + Math.random() * 20
  }));

  return (
    <div className="relative w-full h-[300px] md:h-[400px] mb-16 flex items-center justify-center">
      {/* Dreamy background elements */}
      {orbs.map(orb => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-xl bg-gradient-to-r from-dream-accent1/20 to-dream-accent2/20"
          style={{
            width: `${orb.size}%`,
            height: `${orb.size}%`,
          }}
          initial={{ x: `${orb.initialX}%`, y: `${orb.initialY}%`, opacity: 0.2 }}
          animate={{ 
            x: [`${orb.initialX}%`, `${orb.initialX + 10}%`, `${orb.initialX - 5}%`, `${orb.initialX}%`],
            y: [`${orb.initialY}%`, `${orb.initialY - 10}%`, `${orb.initialY + 5}%`, `${orb.initialY}%`],
            opacity: [0.2, 0.5, 0.3, 0.2],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Centered animated token card */}
      <div className="relative z-10 perspective-1000">
        <AnimatePresence mode="wait">
          {tokens.length > 0 && (
            <FuturisticTokenCard 
              key={tokens[activeTokenIndex].id || `token-${activeTokenIndex}`} 
              token={tokens[activeTokenIndex]} 
              isActive={true}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FuturisticTokenDisplay;
