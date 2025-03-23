import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Clock, RefreshCw, Info, TrendingUp, TrendingDown, Coins, HelpCircle, Sparkles, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { BetPrediction } from '@/types/bet';
import { Slider } from '@/components/ui/slider';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  fetchTokenMetrics, 
  subscribeToTokenMetric, 
  meetsMarketCapRequirements, 
  calculateTargetMarketCap,
  MIN_MARKET_CAP_MOON,
  MIN_MARKET_CAP_DUST,
  TokenMetrics
} from '@/services/tokenDataCache';

interface CreateBetFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  onCancel?: () => void;
  onSuccess?: (betType?: string) => void;
  onBetCreated?: () => void;
}

const CreateBetForm: React.FC<CreateBetFormProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onCancel,
  onSuccess,
  onBetCreated
}) => {
  const [amount, setAmount] = useState<string>('10');
  const [prediction, setPrediction] = useState<BetPrediction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState<number>(30); // Default to 30 minutes
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [walletCheckingInProgress, setWalletCheckingInProgress] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>({
    name: tokenName || "Unknown Token",
    symbol: tokenSymbol || "UNKNOWN"
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [percentageChange, setPercentageChange] = useState<string>('10');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [rewardMultiplier, setRewardMultiplier] = useState<number>(1);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [predictionImpact, setPredictionImpact] = useState<string>('');
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [currentMarketCap, setCurrentMarketCap] = useState<number | null>(null);
  const [isLoadingMarketCap, setIsLoadingMarketCap] = useState<boolean>(true);
  const [targetMarketCap, setTargetMarketCap] = useState<number | null>(null);
  const [meetsRequirements, setMeetsRequirements] = useState<boolean>(false);

  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const { userProfile, placeBet } = usePXBPoints();

  const maxPointsAvailable = userProfile?.pxbPoints || 0;

  useEffect(() => {
    if (tokenId) {
      setTokenData({
        name: tokenName || "Unknown Token",
        symbol: tokenSymbol || "UNKNOWN"
      });
    }
  }, [tokenId, tokenName, tokenSymbol]);

  // Fetch the token's market cap from DexScreener
  useEffect(() => {
    setIsLoadingMarketCap(true);
    
    // Setup subscription to market cap updates
    const unsubscribe = subscribeToTokenMetric(
      tokenId,
      'marketCap',
      (value) => {
        setCurrentMarketCap(value);
        // Keep loading state for a short time even after data is fetched
        // to ensure user sees the loading state
        setTimeout(() => {
          setIsLoadingMarketCap(false);
        }, 500);
        
        // Check if token meets requirements for the current prediction
        if (prediction && value) {
          const meets = meetsMarketCapRequirements(
            { marketCap: value, volume24h: null, priceUsd: null, priceChange24h: null, liquidity: null, timestamp: Date.now() },
            prediction === 'moon' ? 'moon' : 'die'
          );
          setMeetsRequirements(meets);
        }
      }
    );
    
    // Initial fetch to get immediate data
    fetchTokenMetrics(tokenId).then(metrics => {
      if (metrics) {
        setCurrentMarketCap(metrics.marketCap);
        // Still keep loading state for a short time
        setTimeout(() => {
          setIsLoadingMarketCap(false);
        }, 500);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [tokenId]);
  
  // Update requirements check when prediction changes
  useEffect(() => {
    if (prediction && currentMarketCap) {
      const meets = meetsMarketCapRequirements(
        { marketCap: currentMarketCap, volume24h: null, priceUsd: null, priceChange24h: null, liquidity: null, timestamp: Date.now() },
        prediction === 'moon' ? 'moon' : 'die'
      );
      setMeetsRequirements(meets);
    } else {
      setMeetsRequirements(false);
    }
  }, [prediction, currentMarketCap]);

  // Calculate target market cap for bet
  useEffect(() => {
    if (prediction && currentMarketCap && percentageChange) {
      const percent = parseInt(percentageChange, 10);
      if (!isNaN(percent) && percent > 0) {
        const target = calculateTargetMarketCap(
          currentMarketCap,
          prediction === 'moon' ? 'moon' : 'die',
          percent
        );
        setTargetMarketCap(target);
      } else {
        setTargetMarketCap(null);
      }
    } else {
      setTargetMarketCap(null);
    }
  }, [prediction, currentMarketCap, percentageChange]);

  useEffect(() => {
    const handlePredictionSelected = (event: CustomEvent) => {
      if (event.detail) {
        const { prediction: predictionType, percentageChange: percent, defaultBetAmount, defaultDuration } = event.detail;
        
        setPrediction(predictionType as BetPrediction);
        setPercentageChange(percent.toString());
        
        if (defaultBetAmount) {
          setAmount(defaultBetAmount.toString());
        }
        
        if (defaultDuration) {
          setDuration(defaultDuration);
        }
        
        calculateMultiplier(percent);
      }
    };

    window.addEventListener('predictionSelected', handlePredictionSelected as EventListener);
    return () => {
      window.removeEventListener('predictionSelected', handlePredictionSelected as EventListener);
    };
  }, []);

  const calculateMultiplier = (percent: number) => {
    let multiplier = 1;
    
    if (percent >= 200) {
      multiplier = 3;
    } else if (percent >= 150) {
      multiplier = 2;
    } else if (percent >= 100) {
      multiplier = 1.5;
    }
    
    setRewardMultiplier(multiplier);
  };

  useEffect(() => {
    const percent = parseInt(percentageChange, 10);
    if (!isNaN(percent)) {
      calculateMultiplier(percent);
    }
  }, [percentageChange]);

  useEffect(() => {
    const minPercent = prediction === 'moon' ? 80 : prediction === 'die' ? 50 : 0;
    const currentPercent = parseInt(percentageChange, 10);
    
    if (isNaN(currentPercent) || currentPercent < minPercent) {
      setPercentageChange(minPercent.toString());
    }
  }, [prediction, percentageChange]);

  useEffect(() => {
    const handleWalletReady = (event: CustomEvent) => {
      console.log("Received walletReady event", event.detail);
      if (event.detail?.publicKey && publicKey?.toString() === event.detail.publicKey) {
        console.log("✅ Setting wallet as ready from external event");
        setIsWalletReady(true);
      }
    };

    window.addEventListener('walletReady', handleWalletReady as EventListener);
    return () => {
      window.removeEventListener('walletReady', handleWalletReady as EventListener);
    };
  }, [publicKey]);

  const verifyWalletConnection = useCallback(async () => {
    if (connected && publicKey && wallet) {
      try {
        setWalletCheckingInProgress(true);
        setLastError(null);
        console.log("Verifying wallet connection in CreateBetForm...");
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const adapterState = {
          connected: wallet?.adapter?.connected,
          publicKey: wallet?.adapter?.publicKey?.toString(), 
          name: wallet?.adapter?.name
        };
        
        console.log("Wallet state:", {
          connected,
          publicKey: publicKey?.toString(),
          walletAdapter: wallet?.adapter?.name,
          adapterPublicKey: wallet?.adapter?.publicKey?.toString(),
          adapterConnected: wallet?.adapter?.connected
        });
        
        if (wallet.adapter.publicKey && 
            wallet.adapter.publicKey.toString() === publicKey.toString() &&
            wallet.adapter.connected) {
            
          console.log("✅ Wallet successfully verified - Ready for transactions");
          setIsWalletReady(true);
          return true;
        } else {
          console.warn("⚠️ Wallet not fully ready");
          setLastError("Wallet missing public key");
          setIsWalletReady(false);
          return false;
        }
      } catch (error) {
        console.error("Error verifying wallet:", error);
        setIsWalletReady(false);
        setLastError("Error checking wallet status");
        return false;
      } finally {
        setWalletCheckingInProgress(false);
      }
    } else {
      console.log("Wallet not ready, missing basics:", {
        connected,
        hasPublicKey: !!publicKey,
        hasWallet: !!wallet
      });
      setIsWalletReady(false);
      setLastError(connected ? "Wallet missing required properties" : "Wallet not connected");
      return false;
    }
  }, [connected, publicKey, wallet]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      verifyWalletConnection();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [verifyWalletConnection, connected, publicKey, wallet, checkAttempts]);

  useEffect(() => {
    const initialCheckTimeout = setTimeout(() => {
      if (connected && publicKey && !isWalletReady) {
        console.log("Performing initial wallet verification check on page load");
        verifyWalletConnection();
      }
    }, 2000);
    
    const secondaryCheckTimeout = setTimeout(() => {
      if (connected && publicKey && !isWalletReady) {
        console.log("Performing secondary wallet verification check with longer delay");
        verifyWalletConnection();
      }
    }, 5000);
    
    return () => {
      clearTimeout(initialCheckTimeout);
      clearTimeout(secondaryCheckTimeout);
    };
  }, [connected, publicKey, isWalletReady, verifyWalletConnection]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    const numValue = parseInt(value || '0', 10);
    if (numValue > maxPointsAvailable) {
      setAmount(maxPointsAvailable.toString());
    } else {
      setAmount(value);
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    const numValue = parseInt(value || '0', 10);
    const minPercent = prediction === 'moon' ? 80 : prediction === 'die' ? 50 : 0;
    
    if (numValue < minPercent && numValue !== 0) {
      setPercentageChange(minPercent.toString());
    } else if (numValue > 1000) {
      setPercentageChange('1000');
    } else {
      setPercentageChange(value);
      calculateMultiplier(numValue);
    }
  };

  const handleDurationChange = (value: number[]) => {
    setDuration(value[0]);
  };

  const handleRetryWalletConnection = async () => {
    try {
      console.log("Forcing wallet disconnect/reconnect");
      if (disconnect) {
        await disconnect();
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleCheckWalletAgain = () => {
    setCheckAttempts(prev => prev + 1);
    
    setTimeout(() => {
      const forcedCheck = async () => {
        if (wallet && wallet.adapter) {
          try {
            await wallet.adapter.connect();
            console.log("Forced wallet adapter reconnect");
          } catch (err) {
            console.warn("Failed to force reconnect, continuing with verification", err);
          }
        }
        verifyWalletConnection();
      };
      forcedCheck();
    }, 300);
  };

  const handleOpenConfirmation = async () => {
    if (!userProfile) {
      return;
    }

    const isWalletVerified = await verifyWalletConnection();
    
    if (!isWalletVerified) {
      return;
    }

    if (!prediction) {
      return;
    }

    if (!percentageChange || parseInt(percentageChange, 10) <= 0) {
      return;
    }

    const amountValue = parseInt(amount, 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    if (amountValue > maxPointsAvailable) {
      return;
    }
    
    // Check if token meets minimum market cap requirements
    if (!meetsRequirements) {
      const minRequirement = prediction === 'moon' ? MIN_MARKET_CAP_MOON : MIN_MARKET_CAP_DUST;
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleCreateBet = async () => {
    try {
      setIsSubmitting(true);
      setTransactionStatus('Preparing bet...');
      
      const amountValue = parseInt(amount, 10);
      
      console.log(`Creating bet with: 
        token: ${tokenId} (${tokenData.name})
        wallet: ${publicKey?.toString()}
        amount: ${amountValue} PXB Points
        prediction: ${prediction}
        percentage: ${percentageChange}%
        duration: ${duration} minutes
        current market cap: $${currentMarketCap}
        target market cap: $${targetMarketCap}
      `);
      
      setTransactionStatus('Processing your bet...');
      
      const betType = prediction === 'moon' ? 'up' : 'down';
      
      await placeBet(
        tokenId,
        tokenData.name,
        tokenData.symbol,
        amountValue,
        betType,
        parseInt(percentageChange, 10),
        duration
      );
      
      setTransactionStatus('Bet placed successfully!');
      setSuccessMessage(`Your ${amountValue} PXB Points bet that ${tokenData.symbol} will ${prediction} by ${percentageChange}% is now live!`);
      
      toast.success(`Bet created successfully!`);
      
      setTimeout(() => {
        setAmount('10');
        setPrediction(null);
        setPercentageChange('10');
        setDuration(30);
        setTransactionStatus('');
        setSuccessMessage(null);
        
        handleBetCreated();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error creating bet:', error);
      setTransactionStatus('');
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  const calculatePotentialReward = useCallback(() => {
    const amountValue = parseInt(amount, 10);
    if (!isNaN(amountValue) && rewardMultiplier) {
      return amountValue * 2 * rewardMultiplier;
    }
    return 0;
  }, [amount, rewardMultiplier]);

  useEffect(() => {
    if (prediction === 'moon') {
      const percent = parseInt(percentageChange, 10);
      if (percent >= 200) {
        setPredictionImpact('Extremely ambitious prediction! High risk, high reward.');
      } else if (percent >= 150) {
        setPredictionImpact('Very ambitious prediction with good multiplier.');
      } else if (percent >= 100) {
        setPredictionImpact('Solid prediction with decent multiplier.');
      } else {
        setPredictionImpact('Standard moon prediction.');
      }
    } else if (prediction === 'die') {
      const percent = parseInt(percentageChange, 10);
      if (percent >= 80) {
        setPredictionImpact('Extremely bearish prediction! High risk.');
      } else if (percent >= 70) {
        setPredictionImpact('Very bearish prediction.');
      } else if (percent >= 60) {
        setPredictionImpact('Significant drop prediction.');
      } else {
        setPredictionImpact('Standard die prediction.');
      }
    } else {
      setPredictionImpact('');
    }
  }, [prediction, percentageChange]);

  const showExtraWalletReconnectOption = connected && publicKey && wallet && !isWalletReady && !walletCheckingInProgress;

  // Format market cap for display
  const formatMarketCap = (value: number | null): string => {
    if (value === null) return "Loading...";
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const handleBetCreated = () => {
    if (onBetCreated) {
      onBetCreated();
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold">Create a New Bet</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-dream-foreground/70 hover:bg-dream-foreground/10"
                onClick={() => setShowExplanations(!showExplanations)}
              >
                {showExplanations ? <Info className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showExplanations ? "Hide explanations" : "Show explanations"}
            </TooltipContent>
          </TooltipProvider>
      </div>
      
      {/* Market Cap Display - Always show loading animation until data is ready */}
      <div className="mb-2 p-3 bg-dream-background/60 rounded-md border border-dream-foreground/10">
        <div className="flex justify-between items-center">
          <span className="text-sm text-dream-foreground/70">Current Market Cap:</span>
          <span className={`font-semibold ${isLoadingMarketCap ? 'text-dream-foreground/50 animate-pulse' : 'text-dream-accent2'}`}>
            {isLoadingMarketCap ? "Loading..." : formatMarketCap(currentMarketCap)}
          </span>
        </div>
        
        {targetMarketCap !== null && prediction && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-dream-foreground/70">Target Market Cap:</span>
            <span className={`font-semibold ${prediction === 'moon' ? 'text-green-400' : 'text-red-400'}`}>
              {isLoadingMarketCap ? "Loading..." : formatMarketCap(targetMarketCap)}
            </span>
          </div>
        )}
        
        {prediction && !meetsRequirements && currentMarketCap !== null && !isLoadingMarketCap && (
          <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Market cap too low for {prediction === 'moon' ? 'MOON' : 'DUST'} bet. 
              Need minimum ${prediction === 'moon' ? MIN_MARKET_CAP_MOON.toLocaleString() : MIN_MARKET_CAP_DUST.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex justify-around py-2">
        <div 
          className={`relative group cursor-pointer transition-all duration-300 ${prediction === 'moon' ? 'scale-110' : 'hover:scale-105'}`}
          onClick={() => {
            setPrediction('moon');
            setPercentageChange('80');
            calculateMultiplier(80);
          }}
        >
          <div className={`absolute inset-0 rounded-full ${prediction === 'moon' ? 'bg-gradient-to-r from-purple-500/20 via-cyan-400/30 to-pink-500/40 animate-pulse-slow' : 'bg-transparent'}`}></div>
          <img 
            src="/lovable-uploads/24c9c7f3-aec1-4095-b55f-b6198e22db19.png" 
            alt="MOON" 
            className={`w-16 h-16 transition-transform duration-300 filter ${prediction === 'moon' ? 'drop-shadow-[0_0_8px_rgba(209,103,243,0.7)]' : ''}`}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-cyan-400/20 to-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
          <span className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold ${prediction === 'moon' ? 'text-cyan-400' : 'bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 bg-clip-text text-transparent'}`}>MOON</span>
        </div>
        
        <div 
          className={`relative group cursor-pointer transition-all duration-300 ${prediction === 'die' ? 'scale-110' : 'hover:scale-105'}`}
          onClick={() => {
            setPrediction('die');
            setPercentageChange('50');
            calculateMultiplier(50);
          }}
        >
          <div className={`absolute inset-0 rounded-full ${prediction === 'die' ? 'bg-gradient-to-r from-blue-500/20 via-cyan-400/30 to-magenta-500/40 animate-pulse-slow' : 'bg-transparent'}`}></div>
          <img 
            src="/lovable-uploads/73262649-413c-4ed4-9248-1138e844ace7.png" 
            alt="DUST" 
            className={`w-16 h-16 transition-transform duration-300 filter ${prediction === 'die' ? 'drop-shadow-[0_0_8px_rgba(0,179,255,0.7)]' : ''}`}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-cyan-400/20 to-magenta-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
          <span className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold ${prediction === 'die' ? 'text-cyan-400' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent'}`}>DUST</span>
        </div>
      </div>
      
      <Collapsible open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex justify-between bg-dream-surface/40 border-dream-foreground/20 text-dream-foreground/70"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              How PXB Betting Works
            </span>
            <span className="text-xs">{isHowItWorksOpen ? "Hide" : "Show"}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2 animate-accordion-down">
          <Card className="bg-dream-surface/40 border-dream-foreground/20">
            <CardContent className="pt-4 pb-2 px-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-2 items-start">
                  <div className="bg-dream-accent2/20 p-1 rounded-full">
                    <Coins className="h-4 w-4 text-dream-accent2" />
                  </div>
                  <p><span className="font-semibold">Place Bets with PXB Points</span><br />
                  Use your PXB Points to bet on whether tokens will moon (increase) or die (decrease).</p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <div className="bg-dream-accent2/20 p-1 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <p><span className="font-semibold">MOON Predictions</span><br />
                  Predict the token will increase by at least 80%. Higher percentage predictions earn higher multipliers.<br />
                  <span className="text-xs text-dream-accent2">Minimum market cap: ${MIN_MARKET_CAP_MOON.toLocaleString()}</span></p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <div className="bg-dream-accent2/20 p-1 rounded-full">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </div>
                  <p><span className="font-semibold">DIE Predictions</span><br />
                  Predict the token will decrease by at least 50%. Higher percentage predictions earn higher multipliers.<br />
                  <span className="text-xs text-dream-accent2">Minimum market cap: ${MIN_MARKET_CAP_DUST.toLocaleString()}</span></p>
                </div>
                
                <div className="flex gap-2 items-start">
                  <div className="bg-dream-accent2/20 p-1 rounded-full">
                    <Clock className="h-4 w-4 text-dream-accent2" />
                  </div>
                  <p><span className="font-semibold">Time-based Bets</span><br />
                  Set a duration between 10-60 minutes. Your prediction must come true within this timeframe to win.</p>
                </div>

                <div className="flex gap-2 items-start">
                  <div className="bg-green-500/20 p-1 rounded-full">
                    <ArrowUp className="h-4 w-4 text-green-400" />
                  </div>
                  <p><span className="font-semibold">Reward Multipliers</span><br />
                  <span className="text-green-400">1.5x</span> for 100-149% changes<br />
                  <span className="text-green-400">2x</span> for 150-199% changes<br />
                  <span className="text-green-400">3x</span> for 200%+ changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      {successMessage && (
        <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-md animate-pulse-slow">
          <div className="flex items-center text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            <p>{successMessage}</p>
          </div>
        </div>
      )}
      
      {showExtraWalletReconnectOption && (
        <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-md">
          <div className="flex flex-col items-center text-sm">
            <p className="text-yellow-400 flex items-center mb-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
              Wallet appears connected but not ready for transactions
              {lastError && <span className="ml-1 opacity-70">({lastError})</span>}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetryWalletConnection}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconnect Wallet
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleCheckWalletAgain}
                className="text-xs"
              >
                Check Again
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm text-dream-foreground/70">
            Percentage Change Prediction {prediction === 'moon' ? '(min 80%)' : prediction === 'die' ? '(min 50%)' : ''}
          </label>
          {showExplanations && prediction && (
            <span className={`text-xs animate-fade-in ${prediction === 'moon' ? 'text-green-400' : 'text-red-400'}`}>
              {prediction === 'moon' ? 'Price increases by' : 'Price decreases by'}
            </span>
          )}
        </div>
        <div className="relative group">
          <Input
            type="text"
            value={percentageChange}
            onChange={handlePercentageChange}
            className={`w-full p-3 bg-black/30 border ${
              prediction 
                ? (prediction === 'moon' 
                  ? 'border-green-500/30 focus-visible:border-green-500/60 focus-visible:ring-green-500/30' 
                  : 'border-red-500/30 focus-visible:border-red-500/60 focus-visible:ring-red-500/30') 
                : 'border-dream-foreground/20'
            } rounded-md focus:outline-none focus-visible:border-dream-accent2/50 backdrop-blur-lg`}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50">
            %
          </span>
          <div className={`absolute inset-0 -z-10 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none ${
            prediction === 'moon' 
              ? 'bg-gradient-to-r from-green-500/10 to-dream-accent2/10' 
              : prediction === 'die' 
                ? 'bg-gradient-to-r from-red-500/10 to-dream-accent3/10' 
                : 'bg-gradient-to-r from-dream-accent1/10 to-dream-accent3/10'
          } rounded-md filter blur-sm`}></div>
        </div>
        {showExplanations && (
          <>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-dream-foreground/50">
                Predict how much the market cap will {prediction === 'moon' ? 'increase' : prediction === 'die' ? 'decrease' : 'change'} by
              </p>
              {rewardMultiplier > 1 && (
                <span className="text-xs bg-dream
