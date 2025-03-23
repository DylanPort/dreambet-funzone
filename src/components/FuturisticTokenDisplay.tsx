import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUp, ArrowDown, Zap, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePumpPortal } from '@/hooks/usePumpPortal';
interface FuturisticTokenCardProps {
  token: any;
  flipping: boolean;
}
const FuturisticTokenCard: React.FC<FuturisticTokenCardProps> = ({
  token,
  flipping
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const isPositive = token.change24h >= 0;

  // Use the PumpPortal hook to get token metrics
  const {
    tokenMetrics,
    subscribeToToken
  } = usePumpPortal(token.id);

  // Subscribe to token when component mounts
  useEffect(() => {
    if (token && token.id) {
      subscribeToToken(token.id);
    }
  }, [token, subscribeToToken]);

  // Update market cap when token metrics change
  useEffect(() => {
    if (tokenMetrics && tokenMetrics.market_cap) {
      setMarketCap(tokenMetrics.market_cap);
    }
  }, [tokenMetrics]);
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
    return numPrice.toLocaleString('en-US', {
      maximumFractionDigits: 2
    });
  };

  // Fallback calculation in case market cap isn't available from PumpPortal
  const calculateMarketCap = (price: number) => {
    // Assuming a standard supply of 1 billion for PumpFun tokens
    const totalSupply = 1000000000;
    return price * totalSupply;
  };
  const copyToClipboard = () => {
    if (token && token.id) {
      navigator.clipboard.writeText(token.id).then(() => {
        setIsCopied(true);
        toast.success('Contract address copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        toast.error('Failed to copy address');
        console.error('Could not copy text: ', err);
      });
    }
  };

  // Get the market cap to display - use tokenMetrics if available, otherwise calculate
  const displayMarketCap = marketCap !== null ? marketCap : calculateMarketCap(token.currentPrice);
  return <Link to={`/token/${token.id}`} className="block">
      <div className={`glass-panel transform transition-all duration-500 w-[280px] p-5 h-[420px] flex flex-col justify-between ${flipping ? 'animate-flip' : ''} ${isHovering ? 'scale-105 z-50' : 'z-10'} cursor-pointer`} style={{
      transform: `perspective(1000px) rotateY(${isHovering ? '0' : '-15'}deg) rotateX(${isHovering ? '0' : '5'}deg)`,
      transformStyle: 'preserve-3d',
      boxShadow: isHovering ? `0 0 25px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.7)` : `0 0 15px rgba(${isPositive ? '0, 255, 120' : '255, 61, 252'}, 0.3)`,
      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      borderColor: isHovering ? isPositive ? 'rgba(0, 255, 120, 0.5)' : 'rgba(255, 61, 252, 0.5)' : 'rgba(255, 255, 255, 0.1)'
    }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        {/* Holographic Effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-shine"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none"></div>
        </div>
        
        {/* Token Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {token.imageUrl ? <img src={token.imageUrl} alt={token.name} className="w-10 h-10 rounded-full object-cover" onError={e => {
            const imgElement = e.target as HTMLImageElement;
            imgElement.style.display = 'none';
            const nextElement = imgElement.nextElementSibling as HTMLElement;
            if (nextElement) {
              nextElement.style.display = 'flex';
            }
          }} /> : null}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-300/20 flex items-center justify-center border border-white/10 ${token.imageUrl ? 'hidden' : ''}`}>
              <span className="font-display font-bold">{getTokenSymbol(token)}</span>
            </div>
            <span className="ml-2 font-semibold text-lg">{token.name}</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">PumpXBounty</span>
          </div>
        </div>
        
        {/* Contract Address */}
        <div className="flex items-center mb-3 bg-black/30 rounded-lg p-2 text-xs">
          <div className="truncate mr-2 text-white/70 flex-1">
            {token.id || 'Unknown Address'}
          </div>
          <button onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          copyToClipboard();
        }} className="text-cyan-400 hover:text-cyan-300 transition-colors">
            {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          </button>
        </div>
        
        {/* Market Cap Display */}
        <div className="relative h-[120px] mb-6 rounded-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" style={{
          backgroundSize: '200% 100%',
          animation: 'border-flow 15s linear infinite'
        }}></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs text-white/50 mb-1">Market Cap</div>
            <div className="relative">
              <span className={`text-3xl font-bold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                {formatPrice(displayMarketCap)} SOL
              </span>
              <div className="absolute -right-8 -top-4">
                <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Animated scan line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50" style={{
          height: '10px',
          width: '100%',
          animation: 'scan-line 2s linear infinite'
        }}></div>
        </div>
        
        {/* Action Buttons - Rocket for MOON and Skull for DUST */}
        <div className="flex justify-around py-4">
          <div className="relative group">
            <img src="/lovable-uploads/24c9c7f3-aec1-4095-b55f-b6198e22db19.png" alt="MOON" className="w-16 h-16 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(209,103,243,0.7)]" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-cyan-400/20 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">MOON</span>
          </div>
          
          <div className="relative group">
            <img src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" alt="DUST" className="w-16 h-16 transition-transform duration-300 group-hover:scale-110 filter drop-shadow-[0_0_8px_rgba(0,179,255,0.7)]" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-cyan-400/20 to-magenta-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">DUST</span>
          </div>
        </div>
        
        {/* Token Links */}
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs text-dream-foreground/70 hover:text-dream-foreground transition-colors duration-300">
            View Details
          </span>
          
        </div>
      </div>
    </Link>;
};
const FuturisticTokenDisplay: React.FC<{
  tokens: any[];
}> = ({
  tokens
}) => {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to rotate to the next token
  const rotateToNextToken = () => {
    if (tokens.length <= 1) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentTokenIndex(prevIndex => (prevIndex + 1) % tokens.length);
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
  return <div className="flex items-center justify-center">
      <div className="relative">
        <FuturisticTokenCard key={tokens[currentTokenIndex]?.id || `token-${currentTokenIndex}`} token={tokens[currentTokenIndex]} flipping={isFlipping} />
      </div>
    </div>;
};
export default FuturisticTokenDisplay;