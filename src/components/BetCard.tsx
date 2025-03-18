
import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, Wallet, Users, Timer, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bet } from '@/types/bet';
import { formatTimeRemaining, formatAddress, formatBetDuration } from '@/utils/betUtils';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { fetchDexScreenerData } from '@/services/dexScreenerService';
import { toast } from 'sonner';

interface BetCardProps {
  bet: Bet;
  connected: boolean;
  publicKeyString: string | null;
  onAcceptBet: (bet: Bet) => void;
  onBetAccepted?: () => void; // Added for TokenDetail page
}

const BetCard: React.FC<BetCardProps> = ({ 
  bet, 
  connected, 
  publicKeyString, 
  onAcceptBet,
  onBetAccepted
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(bet.currentMarketCap || null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isExpiringSoon = bet.expiresAt - new Date().getTime() < 3600000; // less than 1 hour
  const isActive = bet.status === 'open';
  const expiryDate = new Date(bet.expiresAt);
  const timeLeft = isActive ? formatDistanceToNow(expiryDate, { addSuffix: true }) : '';
  
  // Fetch current market cap on component mount and set up refresh interval
  useEffect(() => {
    let intervalId: number;
    
    const fetchMarketCapData = async () => {
      if (!bet.tokenMint || !isActive) return;
      
      try {
        setIsLoading(true);
        const data = await fetchDexScreenerData(bet.tokenMint);
        if (data && data.marketCap) {
          setCurrentMarketCap(data.marketCap);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Error fetching market cap data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchMarketCapData();
    
    // Set up interval to refresh data every 30 seconds if bet is active
    if (isActive) {
      intervalId = window.setInterval(fetchMarketCapData, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bet.tokenMint, isActive]);
  
  const handleAcceptBet = async () => {
    try {
      await onAcceptBet(bet);
      
      if (onBetAccepted) {
        onBetAccepted();
      }
    } catch (error) {
      console.error("Error accepting bet:", error);
    }
  };
  
  const calculateProgress = () => {
    if (!bet.initialMarketCap || !currentMarketCap) return null;
    
    const actualChange = ((currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
    const targetChange = 10; // Default target change percentage
    
    if (bet.prediction === 'migrate') {
      if (actualChange < 0) return 0;
      return Math.min(100, (actualChange / targetChange) * 100);
    } else {
      if (actualChange > 0) return 0;
      return Math.min(100, (Math.abs(actualChange) / targetChange) * 100);
    }
  };
  
  const calculateActualPercentageChange = () => {
    if (!bet.initialMarketCap || !currentMarketCap) return null;
    
    return ((currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
  };
  
  const isCurrentlyWinning = () => {
    if (!bet.initialMarketCap || !currentMarketCap) return null;
    
    const actualChange = ((currentMarketCap - bet.initialMarketCap) / bet.initialMarketCap) * 100;
    
    if (bet.prediction === 'migrate') {
      return actualChange > 0; // For "migrate" bets, winning if market cap increased
    } else {
      return actualChange < 0; // For "die" bets, winning if market cap decreased
    }
  };
  
  const progress = calculateProgress();
  const percentageChange = calculateActualPercentageChange();
  const winning = isCurrentlyWinning();
  
  let statusIcon;
  let statusClass;
  let borderClass;
  let bgClass;
  
  if (bet.status === 'open') {
    statusIcon = <HelpCircle className="h-4 w-4 text-yellow-400" />;
    statusClass = 'text-yellow-400';
    borderClass = 'border-yellow-400/30';
    bgClass = 'animate-pulse-slow';
  } else if (bet.status === 'completed' && bet.winner === publicKeyString) {
    statusIcon = <CheckCircle className="h-4 w-4 text-green-400" />;
    statusClass = 'text-green-400';
    borderClass = 'border-green-400/30';
    bgClass = '';
  } else {
    statusIcon = <XCircle className="h-4 w-4 text-red-400" />;
    statusClass = 'text-red-400';
    borderClass = 'border-red-400/30';
    bgClass = '';
  }
  
  const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return "N/A";
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };
  
  const calculateWinningMarketCap = () => {
    if (!bet.initialMarketCap) return null;
    
    return bet.prediction === 'migrate'
      ? bet.initialMarketCap * 1.1
      : bet.initialMarketCap * 0.9;
  };
  
  const winningMarketCap = calculateWinningMarketCap();
  
  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return "";
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffSeconds < 10) return "just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };
  
  return (
    <div 
      className={`relative overflow-hidden backdrop-blur-lg bg-black/20 border ${borderClass} rounded-xl shadow-xl transition-all ${bgClass} group`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-dream-accent1/5 to-dream-accent3/5 group-hover:from-dream-accent1/10 group-hover:to-dream-accent3/10 transition-all duration-500"></div>
      
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent2/40 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dream-accent1/40 to-transparent"></div>
      
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dream-accent1/20 to-dream-accent3/20 flex items-center justify-center mr-2 border border-white/10">
              {bet.prediction === 'migrate' 
                ? <img src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" alt="Rocket" className="h-5 w-5" />
                : <img src="/lovable-uploads/d4517df7-78f7-4229-a4d5-0e4cba7bdbf1.png" alt="Skull" className="h-5 w-5" />
              }
            </div>
            <div>
              <p className="font-display font-semibold text-base">{bet.tokenSymbol}</p>
              <p className="text-xs text-dream-foreground/60">{bet.tokenName}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-dream-accent2/10 px-3 py-1 rounded-lg flex items-center">
              <Wallet className="h-3.5 w-3.5 mr-1.5 text-dream-accent2" />
              <p className="font-semibold">{bet.amount} PXB</p>
            </div>
            <p className="text-xs text-dream-foreground/60 mt-1 flex items-center justify-end">
              {bet.prediction === 'migrate' 
                ? <ArrowUp className="h-3 w-3 mr-1 text-green-400" /> 
                : <ArrowDown className="h-3 w-3 mr-1 text-red-400" />
              }
              <span className={`${bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}`}>
                {bet.prediction === 'migrate' ? 'MOON' : 'DIE'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3 mt-3 text-xs">
          <div className="bg-dream-foreground/10 px-2 py-2 rounded-lg">
            <div className="text-dream-foreground/50 mb-1">Entry MCAP</div>
            <div className="font-medium">
              {formatLargeNumber(bet.initialMarketCap || 0)}
            </div>
          </div>
          <div className="bg-dream-foreground/10 px-2 py-2 rounded-lg relative overflow-hidden">
            <div className="text-dream-foreground/50 mb-1">Current MCAP</div>
            <div className="font-medium flex items-center">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>
                  {formatLargeNumber(currentMarketCap || 0)}
                  {lastUpdated && (
                    <span className="ml-1 text-xs text-dream-foreground/40">
                      ({getLastUpdatedText()})
                    </span>
                  )}
                </>
              )}
            </div>
            {isActive && lastUpdated && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-dream-accent2/20">
                <div 
                  className="h-full bg-dream-accent2/50 animate-pulse"
                  style={{ width: `${Math.min(100, (Date.now() - lastUpdated.getTime()) / 300)}%` }}
                ></div>
              </div>
            )}
          </div>
          <div className="bg-dream-foreground/10 px-2 py-2 rounded-lg">
            <div className="text-dream-foreground/50 mb-1">Win MCAP</div>
            <div className="font-medium">
              {formatLargeNumber(winningMarketCap || 0)}
            </div>
          </div>
        </div>
        
        {isActive && progress !== null && (
          <div className="mb-4 mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-dream-foreground/60">Progress towards target</span>
              <span className={bet.prediction === 'migrate' ? 'text-green-400' : 'text-red-400'}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-2 w-full bg-dream-foreground/10 rounded-full overflow-hidden">
              <Progress 
                value={progress} 
                className={`h-2 ${bet.prediction === 'migrate' ? 'bg-gradient-to-r from-green-500/40 to-green-400' : 'bg-gradient-to-r from-red-500/40 to-red-400'}`} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>
            {percentageChange !== null && (
              <div className="text-xs text-dream-foreground/60 mt-1 flex justify-between">
                <span>
                  Market cap change: <span className={percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {percentageChange.toFixed(2)}%
                  </span>
                </span>
                <span>
                  Target: {bet.prediction === 'migrate' ? '+10%' : '-10%'}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs">
          {isActive ? (
            <>
              <div className="flex items-center">
                {statusIcon}
                <span className={`ml-1 ${statusClass}`}>Active</span>
                <span className="ml-2 text-dream-foreground/60 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}
                </span>
              </div>
              
              {/* Real-time win/loss indicator for active bets */}
              {winning !== null && (
                <div className={`px-2 py-1 rounded ${winning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} flex items-center`}>
                  {winning ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>WINNING</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      <span>LOSING</span>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center items-center py-1">
              {bet.status === 'completed' && bet.winner === publicKeyString ? (
                <span className="text-green-400 font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" /> WIN (+{bet.amount * 2} PXB)
                </span>
              ) : (
                <span className="text-red-400 font-semibold flex items-center">
                  <XCircle className="h-4 w-4 mr-2" /> LOSS
                </span>
              )}
            </div>
          )}
        </div>
        
        {isActive && (
          <>
            <div className="mt-3 text-xs text-dream-foreground/50 border-t border-dream-foreground/10 pt-3">
              <p>Betting against the house: If you win, you'll earn {bet.amount} PXB from the house.</p>
            </div>
            
            {publicKeyString !== bet.initiator && (
              <Button 
                onClick={handleAcceptBet}
                className="w-full mt-3 bg-gradient-to-r from-dream-accent1/80 to-dream-accent2/80 hover:from-dream-accent1 hover:to-dream-accent2 transition-all duration-300 border border-white/10 shadow-lg"
                disabled={!connected}
              >
                Bet Against This
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BetCard;
