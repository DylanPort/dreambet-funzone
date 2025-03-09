import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Zap, ExternalLink, Flame } from 'lucide-react';

interface TokenCardProps {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  timeRemaining: number; // in minutes
  imageUrl?: string; // Add optional image URL
  index?: number; // Add optional index for key generation
  liquidity?: number;
  marketCap?: number;
  volume24h?: number;
  pairAddress?: string;
  priceChange1h?: number;
  priceChange6h?: number;
  transactions?: number;
  age?: string;
}

const TokenCard: React.FC<TokenCardProps> = ({
  id,
  name,
  symbol,
  price,
  priceChange,
  timeRemaining,
  imageUrl,
  index,
  liquidity,
  marketCap,
  volume24h,
  pairAddress,
  priceChange1h,
  priceChange6h,
  transactions,
  age,
}) => {
  const isPositive = priceChange >= 0;
  const isPositive1h = priceChange1h ? priceChange1h >= 0 : true;
  const isPositive6h = priceChange6h ? priceChange6h >= 0 : true;

  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Format time remaining
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format large numbers
  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined) return "-";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  // Generate a more unique key by combining id with index if provided
  const uniqueId = index !== undefined ? `${id}-${index}` : id;

  return (
    <div className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1 to-transparent opacity-50"></div>
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-dream-accent2/10 blur-xl rounded-full group-hover:bg-dream-accent2/20 transition-all"></div>
      <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-dream-accent1/10 blur-xl rounded-full group-hover:bg-dream-accent1/20 transition-all"></div>
      
      <Link to={`/token/${id}`} className="block glass-panel p-4 relative backdrop-blur-md z-10 border border-white/10 group-hover:border-white/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/5887548a-f14d-402c-8906-777603cd0875.png" 
                alt={name} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-lg">{name}</h3>
                <a 
                  href={pairAddress ? `https://dexscreener.com/solana/${pairAddress}` : `https://dexscreener.com/solana/${id}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-dream-foreground/40"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
                </a>
              </div>
              <p className="text-dream-foreground/60 text-sm">{symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
              <Flame className="w-3 h-3" />
              <span>#{index !== undefined ? (index + 1) : ""}</span>
            </div>
            {age && (
              <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
                <Clock className="w-3 h-3" />
                <span>{age}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-dream-foreground/40 border border-dream-foreground/10 px-1.5 py-0.5 rounded">
              {isPositive ? '+' : '-'}{Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium flex items-center">
              <span className="mr-1 text-dream-foreground/60">Price</span>
              <span className="text-dream-foreground/90">${formatPrice(price)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">Volume</div>
            <div className="font-medium">{formatLargeNumber(volume24h)}</div>
          </div>
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">Liquidity</div>
            <div className="font-medium">{formatLargeNumber(liquidity)}</div>
          </div>
          <div className="bg-dream-foreground/5 px-2 py-1.5 rounded">
            <div className="text-dream-foreground/50 mb-1">MCAP</div>
            <div className="font-medium">{formatLargeNumber(marketCap)}</div>
          </div>
        </div>

        {transactions && (
          <div className="flex items-center justify-between text-xs text-dream-foreground/60 mb-3">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{transactions.toLocaleString()} transactions</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-moon py-1.5 flex items-center justify-center gap-1">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Moon</span>
          </button>
          <button className="btn-die py-1.5 flex items-center justify-center gap-1">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Die</span>
          </button>
        </div>
      </Link>
    </div>
  );
};

export default TokenCard;
