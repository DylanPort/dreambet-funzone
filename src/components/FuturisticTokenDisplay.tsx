
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUp, ArrowDown, Zap, RefreshCw } from 'lucide-react';

interface FuturisticTokenCardProps {
  token: any;
  flipping: boolean;
}

const FuturisticTokenCard: React.FC<FuturisticTokenCardProps> = ({ token, flipping }) => {
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
    <div 
      className={`glass-panel transform transition-all duration-500 w-[280px] p-5 ${flipping ? 'animate-flip' : ''} ${isHovering ? 'scale-105 z-50' : 'z-10'}`}
      style={{
        transform: `perspective(1000px) rotateY(${isHovering ? '0' : '-15'}deg) rotateX(${isHovering ? '0' : '5'}deg)`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovering ? 
          `0 0 25px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.7)` : 
          `0 0 15px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.3)`,
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        borderColor: isHovering ? (isPositive ? 'rgba(0, 255, 120, 0.5)' : 'rgba(255, 61, 252, 0.5)') : 'rgba(255, 255, 255, 0.1)'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Holographic Effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-shine"></div>
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
      <div className="relative h-[80px] mb-3 rounded-md overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"
          style={{
            backgroundSize: '200% 100%',
            animation: 'border-flow 15s linear infinite'
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className={`text-xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
              ${formatPrice(token.currentPrice)}
            </span>
            <div className="absolute -right-8 -top-4">
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Animated scan line */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50"
          style={{
            height: '10px',
            width: '100%',
            animation: 'scan-line 2s linear infinite'
          }}
        ></div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-around">
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
      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent2/20 to-dream-accent3/20 flex items-center justify-center animate-pulse-glow">
        <Zap className="w-4 h-4 text-dream-accent2" />
      </div>
    </div>
  );
};

const FuturisticTokenDisplay: React.FC<{ tokens: any[] }> = ({ tokens }) => {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to rotate to the next token
  const rotateToNextToken = () => {
    if (tokens.length <= 1) return;
    
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentTokenIndex((prevIndex) => (prevIndex + 1) % tokens.length);
      setIsFlipping(false);
    }, 500); // Half the duration of the flip animation
  };
  
  // Set up interval to rotate tokens
  useEffect(() => {
    if (tokens.length > 1) {
      intervalRef.current = setInterval(rotateToNextToken, 5000); // Rotate every 5 seconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tokens.length]);
  
  // Don't render anything if there are no tokens
  if (!tokens.length) return null;
  
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <FuturisticTokenCard 
          key={tokens[currentTokenIndex]?.id || `token-${currentTokenIndex}`} 
          token={tokens[currentTokenIndex]} 
          flipping={isFlipping} 
        />
        
        <button 
          onClick={rotateToNextToken}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-dream-accent2/20 p-2 rounded-full hover:bg-dream-accent2/40 transition-colors"
          title="Show next token"
        >
          <RefreshCw className="w-4 h-4 text-dream-accent2" />
        </button>
      </div>
    </div>
  );
};

export default FuturisticTokenDisplay;
