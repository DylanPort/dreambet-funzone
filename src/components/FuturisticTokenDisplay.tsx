
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface TokenProps {
  tokenName: string;
  tokenSymbol: string;
  marketCap: number;
  volume: number;
  tokenMint: string;
}

interface TokensArrayProps {
  tokens: Array<{
    name?: string;
    symbol?: string;
    currentPrice?: number;
    id?: string;
    marketCap?: number;
    volume?: number;
  }>;
}

type FuturisticTokenDisplayProps = TokenProps | TokensArrayProps;

const FuturisticTokenDisplay: React.FC<FuturisticTokenDisplayProps> = (props) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const formatValue = (value: number | undefined) => {
    if (!value && value !== 0) return '$0.00';
    
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };
  
  // Check if props has 'tokens' property to determine which interface we're using
  if ('tokens' in props) {
    // This is the tokens array version
    const { tokens } = props;
    
    if (!tokens || tokens.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-400">No tokens available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token, index) => (
          <div 
            key={token.id || index}
            className={`relative p-4 rounded-xl bg-black/30 border ${isHovering ? 'border-white/30 shadow-glow' : 'border-white/10'} transition-all duration-300`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-blue-300/20 flex items-center justify-center border border-white/10">
                    <span className="font-bold">{token.symbol ? token.symbol.charAt(0) : 'T'}</span>
                  </div>
                  <span className="ml-2 font-semibold truncate">{token.name || 'Unknown Token'}</span>
                </div>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">PumpFun</span>
              </div>
              
              <div className="mb-4 p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Market Cap</p>
                    <p className="text-lg font-bold text-green-300">{formatValue(token.marketCap || token.currentPrice || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Volume (24h)</p>
                    <p className="text-lg font-bold text-blue-300">{formatValue(token.volume || 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-around mb-3">
                <Link 
                  to={`/betting?token=${token.id || ''}&bet=up`} 
                  className="flex items-center justify-center py-1 px-3 bg-green-500/20 text-green-300 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors duration-200"
                >
                  MOON <ArrowUp className="ml-1 w-3 h-3" />
                </Link>
                <Link 
                  to={`/betting?token=${token.id || ''}&bet=down`} 
                  className="flex items-center justify-center py-1 px-3 bg-red-500/20 text-red-300 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors duration-200"
                >
                  DUST <ArrowDown className="ml-1 w-3 h-3" />
                </Link>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <Link to={`/token/${token.id || ''}`} className="hover:text-white transition-colors duration-200">
                  View Details
                </Link>
                <a 
                  href={`https://pump.fun/token/${token.id || ''}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-white transition-colors duration-200"
                >
                  PumpFun <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </div>
            </div>
            
            <div className="absolute right-2 bottom-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
              <Zap className="w-3 h-3 text-green-300" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // This is the individual token props version
  const { tokenName, tokenSymbol, marketCap, volume, tokenMint } = props;
  
  return (
    <div 
      className={`relative p-4 rounded-xl bg-black/30 border ${isHovering ? 'border-white/30 shadow-glow' : 'border-white/10'} transition-all duration-300`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-blue-300/20 flex items-center justify-center border border-white/10">
              <span className="font-bold">{tokenSymbol ? tokenSymbol.charAt(0) : 'T'}</span>
            </div>
            <span className="ml-2 font-semibold truncate">{tokenName || 'Unknown Token'}</span>
          </div>
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">PumpFun</span>
        </div>
        
        <div className="mb-4 p-3 rounded-lg bg-black/40 border border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400">Market Cap</p>
              <p className="text-lg font-bold text-green-300">{formatValue(marketCap)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Volume (24h)</p>
              <p className="text-lg font-bold text-blue-300">{formatValue(volume)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-around mb-3">
          <Link 
            to={`/betting?token=${tokenMint}&bet=up`} 
            className="flex items-center justify-center py-1 px-3 bg-green-500/20 text-green-300 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors duration-200"
          >
            MOON <ArrowUp className="ml-1 w-3 h-3" />
          </Link>
          <Link 
            to={`/betting?token=${tokenMint}&bet=down`} 
            className="flex items-center justify-center py-1 px-3 bg-red-500/20 text-red-300 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors duration-200"
          >
            DUST <ArrowDown className="ml-1 w-3 h-3" />
          </Link>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-400">
          <Link to={`/token/${tokenMint}`} className="hover:text-white transition-colors duration-200">
            View Details
          </Link>
          <a 
            href={`https://pump.fun/token/${tokenMint}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-white transition-colors duration-200"
          >
            PumpFun <ExternalLink className="ml-1 w-3 h-3" />
          </a>
        </div>
      </div>
      
      <div className="absolute right-2 bottom-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
        <Zap className="w-3 h-3 text-green-300" />
      </div>
    </div>
  );
};

export default FuturisticTokenDisplay;
