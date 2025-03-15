
import React, { useState, useEffect } from 'react';
import { ExternalLink, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface FuturisticTokenCardProps {
  token: any;
}

const FuturisticTokenCard: React.FC<FuturisticTokenCardProps> = ({ token }) => {
  const [isHovering, setIsHovering] = useState(false);
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
      className="glass-panel w-[280px] p-5 mx-auto"
      initial={{ opacity: 0, y: 20, rotateY: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotateY: isHovering ? 10 : 0,
        scale: isHovering ? 1.05 : 1,
        z: isHovering ? 50 : 0,
      }}
      exit={{ opacity: 0, y: -20, rotateY: -30 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        duration: 0.5
      }}
      key={`token-card-${token.id}`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovering ? 
          `0 0 25px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.7)` : 
          `0 0 15px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.3)`,
        borderColor: isHovering ? (isPositive ? 'rgba(0, 255, 120, 0.5)' : 'rgba(255, 61, 252, 0.5)') : 'rgba(255, 255, 255, 0.1)'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Holographic Effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ opacity: 0, x: -200 }}
          animate={{ 
            opacity: [0, 0.5, 0], 
            x: [isHovering ? -200 : -250, isHovering ? 200 : 250, isHovering ? 500 : 550] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: isHovering ? 1.5 : 3,
            ease: "linear"
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none"></div>
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
      <motion.div 
        className="relative h-[90px] mb-3 rounded-md overflow-hidden"
        whileHover={{ scale: 1.02 }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"
          style={{
            backgroundSize: '200% 100%',
            animation: 'border-flow 15s linear infinite'
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="relative"
            initial={{ scale: 0.9 }}
            animate={{ 
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className={`text-2xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
              ${formatPrice(token.currentPrice)}
            </span>
            <div className="absolute -right-8 -top-4">
              <motion.span 
                className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
              </motion.span>
            </div>
          </motion.div>
        </div>
        
        {/* Animated scan line */}
        <motion.div 
          className="absolute bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50"
          style={{
            height: '10px',
            width: '100%',
          }}
          animate={{
            top: ['0%', '100%', '0%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        ></motion.div>
      </motion.div>
      
      {/* Action Buttons */}
      <div className="flex justify-around">
        <motion.button 
          className="btn-moon py-1 px-3 text-sm relative overflow-hidden group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center">
            Moon <ArrowUp className="w-3 h-3 ml-1" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-green-300/30 group-hover:from-green-500/50 group-hover:to-green-300/50 transition-all duration-300"></div>
        </motion.button>
        <motion.button 
          className="btn-die py-1 px-3 text-sm relative overflow-hidden group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10 flex items-center">
            Die <ArrowDown className="w-3 h-3 ml-1" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-red-300/30 group-hover:from-red-500/50 group-hover:to-red-300/50 transition-all duration-300"></div>
        </motion.button>
      </div>
      
      {/* Token Links */}
      <div className="flex justify-between items-center mt-3">
        <Link to={`/token/${token.id}`} className="text-xs text-dream-foreground/70 hover:text-dream-foreground transition-colors duration-300">
          View Details
        </Link>
        <Link to="#" className="text-xs text-dream-foreground/70 hover:text-dream-foreground transition-colors duration-300 flex items-center">
          <ExternalLink className="w-3 h-3 mr-1" /> Pump.fun
        </Link>
      </div>
      
      {/* Data Flow Visualization */}
      <motion.div 
        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent2/20 to-dream-accent3/20 flex items-center justify-center"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
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
  const [displayToken, setDisplayToken] = useState<any | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  
  useEffect(() => {
    // Pick the first token when tokens array changes
    if (tokens.length > 0) {
      // Smooth transition between tokens
      if (displayToken) {
        setIsChanging(true);
        const timer = setTimeout(() => {
          setDisplayToken(tokens[0]);
          setIsChanging(false);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setDisplayToken(tokens[0]);
      }
    } else {
      setDisplayToken(null);
    }
  }, [tokens]);

  // Auto-change token every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokens.length > 1) {
        setIsChanging(true);
        
        setTimeout(() => {
          const currentIndex = tokens.findIndex(
            token => token.id === displayToken?.id
          );
          const nextIndex = (currentIndex + 1) % tokens.length;
          setDisplayToken(tokens[nextIndex]);
          setIsChanging(false);
        }, 500);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [tokens, displayToken]);

  return (
    <div className="relative w-full h-[250px] mt-2 mb-8 flex items-center justify-center perspective-1000">
      <AnimatePresence mode="wait">
        {displayToken && (
          <motion.div
            key={`token-${displayToken.id || 'default'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isChanging ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FuturisticTokenCard token={displayToken} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FuturisticTokenDisplay;
