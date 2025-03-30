
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchTokenImage } from '@/services/moralisService';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PXBTokenCardProps {
  tokenMint: string;
  tokenName?: string;
  tokenSymbol?: string;
  price?: number;
  change24h?: number;
  onClick?: () => void;
  showComingSoon?: boolean;
}

const PXBTokenCard: React.FC<PXBTokenCardProps> = ({ 
  tokenMint,
  tokenName = "Token", 
  tokenSymbol = "TKN",
  price,
  change24h,
  onClick,
  showComingSoon = false
}) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadTokenImage = async () => {
      if (!tokenMint) return;
      
      try {
        setLoading(true);
        const imageUrl = await fetchTokenImage(tokenMint, tokenSymbol);
        setTokenImage(imageUrl);
      } catch (error) {
        console.error("Error loading token image:", error);
        setImageError(true);
      } finally {
        setLoading(false);
      }
    };

    loadTokenImage();
  }, [tokenMint, tokenSymbol]);

  // Generate a color based on token symbol for fallback background
  const generateColorFromSymbol = (symbol: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const colorGradient = generateColorFromSymbol(tokenSymbol);
  
  // Format price with appropriate precision
  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (value < 0.0001) return value.toExponential(2);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showComingSoon) {
      toast.info("$POINTS Contract address will be available at launch!");
      return;
    }
    
    navigator.clipboard.writeText(tokenMint).then(() => {
      setIsCopied(true);
      toast.success('Contract address copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      toast.error('Failed to copy address');
      console.error('Could not copy text: ', err);
    });
  };

  const renderTokenImage = () => {
    if (loading) {
      return <Skeleton className="w-12 h-12 rounded-full" />;
    }
    
    if (tokenImage && !imageError) {
      return (
        <img 
          src={tokenImage} 
          alt={tokenSymbol}
          className="w-12 h-12 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }
    
    // For POINTS token, use specific image
    if (tokenSymbol === "POINTS") {
      return (
        <img 
          src="/lovable-uploads/c5a2b975-3b82-4cbf-94db-8cb2fe2be3a6.png"
          alt={tokenSymbol}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }
    
    // Fallback to first letter of symbol with gradient background
    return (
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white font-bold text-xl`}>
        {tokenSymbol ? tokenSymbol.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  const linkTo = tokenMint ? `/token/${tokenMint}` : '#';

  return (
    <Link to={linkTo} onClick={onClick}>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border border-dream-accent1/20 bg-dream-background/40 backdrop-blur-sm hover:bg-dream-background/60">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {renderTokenImage()}
            
            <div className="flex-1">
              <h3 className="font-semibold text-dream-foreground truncate">
                {tokenName}
              </h3>
              <div className="flex items-center">
                <p className="text-dream-foreground/70 text-sm mr-2">
                  {tokenSymbol}
                </p>
                {showComingSoon && (
                  <span className="text-xs bg-dream-accent1/20 text-dream-accent1 px-1.5 py-0.5 rounded">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex items-center text-xs text-dream-foreground/50">
                <span className="truncate w-24">{tokenMint.substring(0, 8)}...</span>
                <button 
                  onClick={copyToClipboard}
                  className="ml-1 text-dream-accent2 hover:text-dream-accent1 transition-colors"
                >
                  {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            
            {price !== undefined && (
              <div className="text-right">
                <div className="font-medium">${formatPrice(price)}</div>
                {change24h !== undefined && (
                  <div className={`text-xs ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PXBTokenCard;
