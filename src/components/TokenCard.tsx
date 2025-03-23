
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Zap, ExternalLink, Flame, Sparkles, Moon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateBetForm from './CreateBetForm';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getTokenImageUrl, getTokenFallbackImage } from '@/services/moralisService';

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
  imageUrl: initialImageUrl,
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
  const [selectedPrediction, setSelectedPrediction] = useState<'moon' | 'die' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenImage, setTokenImage] = useState<string | null>(initialImageUrl || null);

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

  // Fetch token image when component mounts
  useEffect(() => {
    const fetchTokenImage = async () => {
      if (!tokenImage && id) {
        try {
          const imageUrl = await getTokenImageUrl(id);
          if (imageUrl) {
            setTokenImage(imageUrl);
          }
        } catch (error) {
          console.error("Error fetching token image:", error);
        }
      }
    };

    fetchTokenImage();
  }, [id, tokenImage]);

  // Custom bet dialog handler
  const handleBetSelection = (type: 'moon' | 'die') => {
    setSelectedPrediction(type);
    
    // Dispatch prediction event for CreateBetForm to pick up
    const eventData = {
      prediction: type,
      percentageChange: type === 'moon' ? 80 : 50, // Default percentage change
      defaultBetAmount: 10,
      defaultDuration: 30
    };
    
    window.dispatchEvent(
      new CustomEvent('predictionSelected', { detail: eventData })
    );
    
    // Automatically open dialog with the form
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    // Don't reset the selection when dialog closes
    // so the visual indication stays
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
              {tokenImage ? (
                <img 
                  src={tokenImage} 
                  alt={name} 
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.onerror = null; // Prevent infinite loop
                    imgElement.src = getTokenFallbackImage(symbol);
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center border border-white/10">
                  <span className="font-display font-bold">{symbol ? symbol.charAt(0).toUpperCase() : 'T'}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-lg">{name}</h3>
                <a 
                  href={pairAddress ? `https://dexscreener.com/solana/${pairAddress}` : `https://dexscreener.com/solana/${id}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-dream-foreground/40"
                  onClick={(e) => e.stopPropagation()}
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
          <Dialog open={dialogOpen && selectedPrediction === 'moon'} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              handleBetSelection('moon');
            }} asChild>
              <button 
                className={`btn-moon py-1.5 flex items-center justify-center gap-1 relative overflow-hidden ${selectedPrediction === 'moon' ? 'ring-2 ring-green-400 animate-pulse-slow' : ''}`}
              >
                {selectedPrediction === 'moon' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-scan-line"></div>
                )}
                <div className="flex items-center justify-center gap-1 relative z-10">
                  {selectedPrediction === 'moon' ? <Sparkles className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                  <span>Moon</span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-3xl">
              <div className="relative">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-dream-background/80 to-blue-900/30 backdrop-blur-xl rounded-2xl z-0 animate-pulse-slow"></div>
                
                {/* Glow effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-dream-accent2/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-dream-accent1/20 rounded-full blur-3xl"></div>
                
                {/* Scan line effect */}
                <div className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-2xl pointer-events-none z-10">
                  <div className="absolute h-px w-[120%] bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent top-[40%] left-[-10%] animate-scan-line"></div>
                </div>
                
                {/* Border with gradient */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 z-10"></div>
                <div className="absolute inset-0 border border-gray-800/60 rounded-2xl z-10"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent2/50 to-transparent z-20"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent z-20"></div>
                
                {/* Content wrapper */}
                <div className="relative z-30 p-1">
                  <CreateBetForm 
                    tokenId={id}
                    tokenName={name}
                    tokenSymbol={symbol}
                    onCancel={handleDialogClose}
                    onSuccess={handleDialogClose}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen && selectedPrediction === 'die'} onOpenChange={(open) => !open && handleDialogClose()}>
            <DialogTrigger onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              handleBetSelection('die');
            }} asChild>
              <button 
                className={`btn-die py-1.5 flex items-center justify-center gap-1 relative overflow-hidden ${selectedPrediction === 'die' ? 'ring-2 ring-red-400 animate-pulse-slow' : ''}`}
              >
                {selectedPrediction === 'die' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-scan-line"></div>
                )}
                <div className="flex items-center justify-center gap-1 relative z-10">
                  {selectedPrediction === 'die' ? <Moon className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  <span>Die</span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-3xl">
              <div className="relative">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-dream-background/80 to-purple-900/30 backdrop-blur-xl rounded-2xl z-0 animate-pulse-slow"></div>
                
                {/* Glow effects */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-dream-accent1/20 rounded-full blur-3xl"></div>
                
                {/* Scan line effect */}
                <div className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-2xl pointer-events-none z-10">
                  <div className="absolute h-px w-[120%] bg-gradient-to-r from-transparent via-red-500/50 to-transparent top-[60%] left-[-10%] animate-scan-line"></div>
                </div>
                
                {/* Border with gradient */}
                <div className="absolute inset-0 rounded-2xl border border-white/10 z-10"></div>
                <div className="absolute inset-0 border border-gray-800/60 rounded-2xl z-10"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent z-20"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dream-accent1/50 to-transparent z-20"></div>
                
                {/* Content wrapper */}
                <div className="relative z-30 p-1">
                  <CreateBetForm 
                    tokenId={id}
                    tokenName={name}
                    tokenSymbol={symbol}
                    onCancel={handleDialogClose}
                    onSuccess={handleDialogClose}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Link>
    </div>
  );
};

export default TokenCard;
