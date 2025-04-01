
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface TokenDetailHeaderProps {
  token: any;
  tokenImage: string | null;
  imageLoading: boolean;
  imageError: boolean;
  isLive: boolean;
}

const TokenDetailHeader: React.FC<TokenDetailHeaderProps> = ({
  token,
  tokenImage,
  imageLoading,
  imageError,
  isLive,
}) => {
  const { toast } = useToast();

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

  const renderTokenImage = () => {
    if (imageLoading) {
      return <Skeleton className="w-16 h-16 rounded-full" />;
    }
    if (tokenImage && !imageError) {
      return <img src={tokenImage} alt={token?.symbol || 'Token'} className="w-16 h-16 rounded-full object-cover border border-white/10" />;
    }
    const colorGradient = token?.symbol ? generateColorFromSymbol(token.symbol) : 'from-dream-accent1/20 to-dream-accent3/20';
    return (
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-3xl border border-white/10`}>
        {token?.symbol ? token.symbol.charAt(0) : '🪙'}
      </div>
    );
  };

  const generateColorFromSymbol = (symbol: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-blue-500'
    ];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center">
        {renderTokenImage()}
        
        <div className="ml-4">
          <h1 className="text-2xl font-display font-bold flex items-center">
            {token.name}
            {isLive && (
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                LIVE
              </span>
            )}
          </h1>
          <div className="flex items-center text-dream-foreground/70">
            <span className="mr-2">{token.symbol}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(token.id);
                toast({
                  title: "Copied!",
                  description: "Token address copied to clipboard"
                });
              }} 
              className="text-xs text-dream-accent2 hover:text-dream-accent1 flex items-center"
            >
              {token.id.substring(0, 4)}...{token.id.substring(token.id.length - 4)}
              <Copy className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <div className="text-3xl font-bold flex items-center">
          ${formatPrice(token.currentPrice)}
          {token.change24h !== 0 && (
            <span className={`ml-2 text-sm flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.change24h >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {Math.abs(token.change24h).toFixed(2)}%
            </span>
          )}
        </div>
        
        <div className="text-sm text-dream-foreground/70 mt-1">
          {token.migrationTime ? (
            <span>
              First seen {formatDistanceToNow(new Date(token.migrationTime), { addSuffix: true })}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TokenDetailHeader;
