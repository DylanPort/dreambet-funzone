
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';

interface TokenCardProps {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  timeRemaining: number; // in minutes
  imageUrl?: string; // Add optional image URL
}

const TokenCard: React.FC<TokenCardProps> = ({
  id,
  name,
  symbol,
  price,
  priceChange,
  timeRemaining,
  imageUrl,
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
    return `${minutes} min`;
  };

  return (
    <div className="glass-panel overflow-hidden transition-all duration-300 hover:shadow-neon hover:scale-[1.02]">
      <Link to={`/token/${id}`} className="block p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Properly cast the target to HTMLImageElement
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.style.display = 'none';
                  // Find the next element sibling and make it visible
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
            <div className="ml-3">
              <h3 className="font-display font-semibold text-lg">{name}</h3>
              <p className="text-dream-foreground/60 text-sm">{symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">${formatPrice(price)}</p>
            <p className={`text-sm flex items-center justify-end ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {Math.abs(priceChange).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 mb-3 text-sm text-dream-foreground/60">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-moon">
            Moon 🚀
          </button>
          <button className="btn-die">
            Die 💀
          </button>
        </div>
      </Link>
    </div>
  );
};

export default TokenCard;
