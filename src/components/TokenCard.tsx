
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Zap, ExternalLink } from 'lucide-react';

interface TokenCardProps {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  timeRemaining: number; // in minutes
  imageUrl?: string; // Add optional image URL
  index?: number; // Add optional index for key generation
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
}) => {
  const isPositive = priceChange >= 0;

  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Format time remaining
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m ago`;
  };

  // Generate a more unique key by combining id with index if provided
  const uniqueId = index !== undefined ? `${id}-${index}` : id;

  return (
    <div className="glass-panel overflow-hidden transition-all duration-300 hover:shadow-neon hover:scale-[1.02]">
      <Link to={`/token/${id}`} className="block p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-10 h-10 rounded-full object-cover"
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
            <div 
              className={`w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10 ${imageUrl ? 'hidden' : ''}`}
            >
              <span className="font-display font-bold text-lg">{symbol.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-lg">{name}</h3>
                <ExternalLink className="w-3.5 h-3.5 text-dream-foreground/40" />
              </div>
              <p className="text-dream-foreground/60 text-sm">{symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 h-6 px-2 rounded-md bg-dream-background/40 text-xs text-dream-foreground/60">
              <Zap className="w-3 h-3" />
              <span>0.6</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(priceChange).toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-dream-foreground/40 border border-dream-foreground/10 px-1.5 py-0.5 rounded">
              {isPositive ? '+' : '-'}{Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium flex items-center">
              <span className="mr-1 text-dream-foreground/60">MC</span>
              <span className="text-dream-foreground/90">${formatPrice(price)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-dream-foreground/60">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Just now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>SOL {formatPrice(price / 100)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
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
