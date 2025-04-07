import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { User, ArrowUpRight, Clock, Copy, DollarSign, BarChart3, Coins } from 'lucide-react';
import { PXBBet } from '@/types/pxb';
import { fetchTokenImage } from '@/services/moralisService';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';

interface PXBBetCardProps {
  bet: PXBBet;
  marketCapData: {
    initialMarketCap: number | null;
    currentMarketCap: number | null;
  } | undefined;
  isLoading: boolean;
}

const PXBBetCard: React.FC<PXBBetCardProps> = ({ bet, marketCapData: initialMarketCapData, isLoading }) => {
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [marketCapData, setMarketCapData] = useState(initialMarketCapData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [isSelling, setIsSelling] = useState(false);
  const [livePxbValue, setLivePxbValue] = useState<number>(bet.betAmount || 0);
  const { addPointsToUser, userProfile } = usePXBPoints();
  
  useEffect(() => {
    const loadTokenImage = async () => {
      if (!bet.tokenMint) return;
      
      try {
        setImageLoading(true);
        const imageUrl = await fetchTokenImage(bet.tokenMint, bet.tokenSymbol);
        setTokenImage(imageUrl);
      } catch (error) {
        console.error("Error loading token image:", error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadTokenImage();
  }, [bet.tokenMint, bet.tokenSymbol]);

  useEffect(() => {
    const updateMarketCap = async () => {
      try {
        if (!bet.tokenMint) return;
        
        const tokenData = await fetchDexScreenerData(bet.tokenMint);
        if (tokenData && tokenData.marketCap) {
          const newMarketCap = tokenData.marketCap;
          setMarketCapData(prev => ({
            initialMarketCap: prev?.initialMarketCap || bet.initialMarketCap,
            currentMarketCap: newMarketCap
          }));
          setLastUpdated(new Date());
          
          if (bet.betAmount && bet.initialMarketCap) {
            const percentageChange = ((newMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
            const updatedPxbValue = bet.betAmount * (1 + (percentageChange / 100));
            setLivePxbValue(updatedPxbValue);
          }
        }
      } catch (error) {
        console.error("Error updating market cap:", error);
      }
    };

    updateMarketCap();
    const intervalId = setInterval(updateMarketCap, 10000);
    
    return () => clearInterval(intervalId);
  }, [bet.tokenMint, bet.initialMarketCap, bet.betAmount, initialMarketCapData]);

  useEffect(() => {
    if (bet.initialMarketCap && bet.betAmount) {
      const totalSupply = 1_000_000_000;
      const tokenPrice = bet.initialMarketCap / totalSupply;
      const tokensReceived = bet.betAmount / tokenPrice;
      setTokenAmount(tokensReceived);
    }
  }, [bet.initialMarketCap, bet.betAmount]);

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

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: false
      });
    } catch (e) {
      return 'recently';
    }
  };

  const calculateMarketCapChange = () => {
    const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
    const currentMarketCap = marketCapData?.currentMarketCap;
    
    if (!initialMarketCap || !currentMarketCap) {
      return 0;
    }
    
    return ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
  };

  const formatLargeNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "N/A";
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

  const renderTokenImage = () => {
    if (imageLoading) {
      return <Skeleton className="w-10 h-10 rounded-full" />;
    }
    
    if (tokenImage && !imageError) {
      return (
        <img 
          src={tokenImage} 
          alt={bet.tokenSymbol}
          className="w-10 h-10 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }
    
    const colorGradient = generateColorFromSymbol(bet.tokenSymbol);
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white font-bold text-sm`}>
        {bet.tokenSymbol ? bet.tokenSymbol.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 3) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleSellToken = async () => {
    if (!userProfile || !marketCapData?.currentMarketCap) return;
    
    try {
      setIsSelling(true);
      
      const initialMarketCap = bet.initialMarketCap || marketCapData.initialMarketCap || 0;
      const currentMarketCap = marketCapData.currentMarketCap;
      const percentageChange = ((currentMarketCap - initialMarketCap) / initialMarketCap) * 100;
      
      const originalPXB = bet.betAmount;
      const returnAmount = originalPXB * (1 + (percentageChange / 100));
      const displayReturnAmount = returnAmount.toFixed(2);
      
      console.log(`Original PXB: ${originalPXB}`);
      console.log(`Percentage Change: ${percentageChange.toFixed(2)}%`);
      console.log(`Return Amount: ${returnAmount}`);
      console.log(`Display Return Amount: ${displayReturnAmount}`);
      
      const roundedAmount = Math.round(returnAmount);
      await addPointsToUser(roundedAmount);
      
      toast({
        title: "Tokens Sold Successfully",
        description: `You've received ${displayReturnAmount} PXB from selling your ${bet.tokenSymbol} tokens (${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%).`,
        variant: percentageChange >= 0 ? "default" : "destructive",
      });
      
      localStorage.setItem(`sold_${bet.id}`, 'true');
      window.location.reload();
    } catch (error) {
      console.error("Error selling tokens:", error);
      toast({
        title: "Error Selling Tokens",
        description: "There was a problem selling your tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  const truncatedAddress = bet.userId ? `${bet.userId.substring(0, 4)}...${bet.userId.substring(bet.userId.length - 4)}` : '8efb9f...9547';
  const initialMarketCap = bet.initialMarketCap || marketCapData?.initialMarketCap;
  const currentMarketCap = marketCapData?.currentMarketCap || initialMarketCap;
  const marketCapChange = calculateMarketCapChange();
  const isPositiveChange = marketCapChange >= 0;
  const isSold = localStorage.getItem(`sold_${bet.id}`) === 'true';

  const calculateReturnAmount = () => {
    if (!bet.betAmount) return 0;
    
    const returnAmount = bet.betAmount * (1 + (marketCapChange / 100));
    return returnAmount.toFixed(2);
  };

  const [pulseAnimate, setPulseAnimate] = useState(false);
  
  useEffect(() => {
    setPulseAnimate(true);
    const timeout = setTimeout(() => setPulseAnimate(false), 1000);
    return () => clearTimeout(timeout);
  }, [livePxbValue]);

  return (
    <div className="bg-black/60 rounded-lg border border-white/10 mb-4 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {renderTokenImage()}
            <div>
              <span className="text-purple-400 font-semibold">PumpXBounty</span>
              <span className="text-dream-foreground/60 ml-1">POINTS</span>
            </div>
          </div>
          <div className="text-purple-400 font-mono font-bold text-lg">
            {bet.betAmount} PXB
          </div>
        </div>

        <div className="flex items-center text-sm text-dream-foreground/70 mt-1">
          <Clock className="w-4 h-4 mr-1 opacity-70" />
          <span>{formatTimeAgo(bet.createdAt)} ago</span>
          <span className="mx-2">•</span>
          <span>Purchase</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-black/40 rounded-md p-2 flex flex-col">
            <span className="text-xs text-dream-foreground/60 flex items-center mb-1">
              <DollarSign className="w-3 h-3 mr-1" />
              PXB Used
            </span>
            <span className="font-bold text-purple-400">
              {bet.betAmount} PXB
            </span>
          </div>
          
          <div className="bg-black/40 rounded-md p-2 flex flex-col">
            <span className="text-xs text-dream-foreground/60 flex items-center mb-1">
              <Coins className="w-3 h-3 mr-1" />
              Tokens Received
            </span>
            <span className="font-bold text-dream-foreground">
              {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {bet.tokenSymbol}
            </span>
          </div>
        </div>

        <div className="mt-4 bg-black/40 rounded-md p-2 flex justify-between items-center relative overflow-hidden">
          <span className="text-xs text-dream-foreground/60">
            Current PXB Value
          </span>
          <div className={`font-mono font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'} ${pulseAnimate ? 'animate-pulse' : ''}`}>
            {livePxbValue.toFixed(2)} PXB 
            <span className="ml-1 text-xs">
              ({isPositiveChange ? '+' : ''}{marketCapChange.toFixed(2)}%)
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse opacity-50"></div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-dream-foreground/70 flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              Market Performance
            </span>
            <span className={`text-xs font-mono ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
              {isPositiveChange ? '+' : ''}{marketCapChange.toFixed(2)}%
            </span>
          </div>
          
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-1 relative">
            <div 
              className={`h-full ${isPositiveChange ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.abs(marketCapChange))}%` }}
            >
              <div className="absolute left-0 top-0 w-full h-full flex">
                <div className={`h-full w-2 ${isPositiveChange ? 'bg-green-600' : 'bg-red-600'} opacity-50`}></div>
                <div className={`h-full w-2 ${isPositiveChange ? 'bg-green-600' : 'bg-red-600'} opacity-50 ml-auto`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-dream-foreground/60">Initial: </span>
            <span>{formatLargeNumber(initialMarketCap)}</span>
          </div>
          <div className="text-dream-foreground/50">→</div>
          <div>
            <span className="text-dream-foreground/60">Current: </span>
            <span>{formatLargeNumber(currentMarketCap)}</span>
            <span className="text-xs text-dream-foreground/40 ml-1">
              {lastUpdated ? getLastUpdatedText() : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1 text-dream-foreground/60" />
            <span className="text-dream-foreground/60 mr-1">Buyer</span>
            <span className="font-medium">{truncatedAddress}</span>
          </div>
          
          <div className={`flex items-center ${isPositiveChange ? 'text-green-400' : 'text-red-400'} font-semibold`}>
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>{isPositiveChange ? 'Profit' : 'Loss'}</span>
            <span className="ml-2 font-bold">{Math.abs(marketCapChange).toFixed(2)}%</span>
          </div>
        </div>

        {!isSold && (
          <div className="mt-4">
            <Button 
              variant={isPositiveChange ? "default" : "destructive"} 
              className="w-full" 
              onClick={handleSellToken}
              disabled={isSelling}
            >
              {isSelling ? "Processing..." : `Sell for ${calculateReturnAmount()} PXB (${isPositiveChange ? '+' : ''}${marketCapChange.toFixed(2)}%)`}
            </Button>
          </div>
        )}

        {isSold && (
          <div className="mt-4 text-center p-2 bg-black/30 rounded-md border border-green-500/20 text-green-400">
            Sold successfully
          </div>
        )}

        <div className="mt-2 text-xs text-dream-foreground/40">
          <div className="cursor-pointer hover:text-dream-foreground/60 transition-colors truncate" 
            onClick={() => copyToClipboard(bet.tokenMint || '')}>
            {bet.tokenMint}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PXBBetCard;
