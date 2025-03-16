
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, ExternalLink, Flame } from 'lucide-react';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from 'sonner';

interface PXBTokenCardProps {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  timeRemaining?: number;
  imageUrl?: string;
  index?: number;
  liquidity?: number;
  marketCap?: number;
  volume24h?: number;
  pairAddress?: string;
}

const PXBTokenCard: React.FC<PXBTokenCardProps> = ({
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
}) => {
  const { userProfile, placeBet, isLoading } = usePXBPoints();
  const isPositive = priceChange >= 0;

  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
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

  // Handle bet placement
  const handlePlaceBet = async (betType: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when betting
    e.stopPropagation(); // Stop event propagation
    
    if (!userProfile) {
      toast.error('You must be logged in to place a bet');
      return;
    }
    
    if (userProfile.pxbPoints < 10) {
      toast.error('Insufficient PXB Points. Minimum bet is 10 points.');
      return;
    }
    
    if (!marketCap) {
      toast.error('Market cap data is not available for this token');
      return;
    }
    
    try {
      // Clear notification of previous bets
      toast.dismiss();
      
      // Show initial betting notification
      const toastId = `bet-${id}-${Date.now()}`;
      toast.loading(`Placing ${betType === 'up' ? 'MOON' : 'DIE'} bet on ${symbol}...`, {
        id: toastId
      });
      
      // Show the current market cap in the toast
      const currentMcap = formatLargeNumber(marketCap);
      const percentChange = 10; // Default 10% change
      
      // Calculate the target market cap based on bet type
      let targetMcap;
      if (betType === 'up') {
        targetMcap = formatLargeNumber(marketCap * 1.1); // 10% increase
      } else {
        targetMcap = formatLargeNumber(marketCap * 0.9); // 10% decrease
      }
      
      toast.loading(`Placing ${betType === 'up' ? 'MOON' : 'DIE'} bet on ${symbol}...
        Starting MCAP: ${currentMcap}
        Target MCAP: ${targetMcap}`, 
        { id: toastId }
      );
      
      // Add a default percentage change of 10% for quick betting
      await placeBet(id, name, symbol, 10, betType, 10, 30);
      
      // Success notification is handled by placeBet function
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Please try again.');
    }
  };

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
                src="/lovable-uploads/74707f80-3a88-4b9c-82d2-5a590a3a32df.png" 
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
                  onClick={(e) => e.stopPropagation()} // Prevent the Link click when clicking on the external link
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

        <div className="grid grid-cols-2 gap-3">
          <button 
            className="btn-moon py-1.5 flex items-center justify-center gap-1"
            onClick={(e) => handlePlaceBet('up', e)}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Moon (10 PXB)</span>
          </button>
          <button 
            className="btn-die py-1.5 flex items-center justify-center gap-1"
            onClick={(e) => handlePlaceBet('down', e)}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Die (10 PXB)</span>
          </button>
        </div>
        
        <div className="mt-3 p-2 bg-dream-foreground/5 rounded text-xs text-dream-foreground/70">
          <p>Bet against the house: Win up to 2x your bet. If you win, points are awarded from the PXB supply. If you lose, your points return to the PXB supply.</p>
        </div>
      </Link>
    </div>
  );
};

export default PXBTokenCard;
