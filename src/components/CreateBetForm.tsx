import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Clock, RefreshCw } from 'lucide-react';
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

interface CreateBetFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  onBetCreated: () => void;
  token?: any; // Optional token prop for TokenDetail page
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateBetForm: React.FC<CreateBetFormProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onBetCreated,
  token,
  onSuccess,
  onCancel
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

  const { connected, publicKey, wallet, connecting, disconnect } = useWallet();
  const { userProfile, placeBet } = usePXBPoints();

  // Get max PXB points available for betting
  const maxPointsAvailable = userProfile?.pxbPoints || 0;

  useEffect(() => {
    if (token) {
      setTokenData({
        name: token.name || tokenName,
        symbol: token.symbol || tokenSymbol
      });
    } else if (tokenId) {
      setTokenData({
        name: tokenName || "Unknown Token",
        symbol: tokenSymbol || "UNKNOWN"
      });
    }
  }, [token, tokenId, tokenName, tokenSymbol]);

  // Listen for prediction selection events from the Moon/Dust buttons
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

  // Calculate reward multiplier based on percentage change
  const calculateMultiplier = (percent: number) => {
    let multiplier = 1;
    
    // For moon predictions (minimum 80%)
    if (percent >= 200) {
      multiplier = 3; // 3x for 200% or more
    } else if (percent >= 150) {
      multiplier = 2; // 2x for 150-199%
    } else if (percent >= 100) {
      multiplier = 1.5; // 1.5x for 100-149%
    }
    
    setRewardMultiplier(multiplier);
  };

  // Update multiplier when percentage changes
  useEffect(() => {
    const percent = parseInt(percentageChange, 10);
    if (!isNaN(percent)) {
      calculateMultiplier(percent);
    }
  }, [percentageChange]);

  // Enforce minimum percentage values based on prediction type
  useEffect(() => {
    if (prediction) {
      const minPercent = prediction === 'moon' ? 80 : prediction === 'die' ? 50 : 0;
      const currentPercent = parseInt(percentageChange, 10);
      
      if (isNaN(currentPercent) || currentPercent < minPercent) {
        setPercentageChange(minPercent.toString());
      }
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
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers for PXB points
    
    // Ensure amount doesn't exceed user's available points
    const numValue = parseInt(value || '0', 10);
    if (numValue > maxPointsAvailable) {
      setAmount(maxPointsAvailable.toString());
    } else {
      setAmount(value);
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    
    // Enforce minimum percentage based on prediction type
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
        toast("Reconnect wallet", {
          description: "Please reconnect your wallet to continue",
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleCheckWalletAgain = () => {
    setCheckAttempts(prev => prev + 1);
    toast("Checking wallet connection", {
      description: "Verifying your wallet connection status...",
    });
    
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
      toast.error('Please connect your wallet and mint PXB Points first');
      return;
    }

    const isWalletVerified = await verifyWalletConnection();
    
    if (!isWalletVerified) {
      toast.error(lastError || "Please ensure your wallet is fully connected and try again");
      return;
    }

    if (!prediction) {
      toast.error("Please choose whether the token will MOON or DIE");
      return;
    }

    if (!percentageChange || parseInt(percentageChange, 10) <= 0) {
      toast.error("Please enter a valid percentage change prediction");
      return;
    }

    const amountValue = parseInt(amount, 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    if (amountValue > maxPointsAvailable) {
      toast.error(`You only have ${maxPointsAvailable} PXB Points available to bet`);
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
      `);
      
      setTransactionStatus('Processing your bet...');
      
      // Convert prediction to betType for API call
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
      
      toast.success(`Bet created successfully! ${amountValue} PXB Points that ${tokenData.symbol} will ${prediction} by ${percentageChange}%`);
      
      setTimeout(() => {
        setAmount('10');
        setPrediction(null);
        setPercentageChange('10');
        setDuration(30);
        setTransactionStatus('');
        setSuccessMessage(null);
        
        if (onSuccess) {
          onSuccess();
        } else {
          onBetCreated();
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('Error creating bet:', error);
      setTransactionStatus('');
      setSuccessMessage(null);
      
      let errorMessage = "Something went wrong with placing your bet.";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Failed to create bet: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  const showExtraWalletReconnectOption = connected && publicKey && wallet && !isWalletReady && !walletCheckingInProgress;

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-xl font-display font-semibold">Create a New Bet</h3>
      
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
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Your Prediction
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setPrediction('moon');
              // Set minimum percentage for moon
              const currentPercent = parseInt(percentageChange, 10);
              if (isNaN(currentPercent) || currentPercent < 80) {
                setPercentageChange('80');
              }
              calculateMultiplier(Math.max(80, currentPercent));
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
              prediction === 'moon'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'border-dream-foreground/20 hover:bg-green-500/10'
            }`}
          >
            <img 
              src="/lovable-uploads/8b54a80c-266a-4fcc-8f22-788cab6ce1b4.png" 
              alt="Rocket" 
              className="w-5 h-5" 
            />
            <span>MOON 🚀</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setPrediction('die');
              // Set minimum percentage for die
              const currentPercent = parseInt(percentageChange, 10);
              if (isNaN(currentPercent) || currentPercent < 50) {
                setPercentageChange('50');
              }
              calculateMultiplier(Math.max(50, currentPercent));
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
              prediction === 'die'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'border-dream-foreground/20 hover:bg-red-500/10'
            }`}
          >
            <ArrowDown size={18} />
            <span>DIE 💀</span>
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Percentage Change Prediction {prediction === 'moon' ? '(min 80%)' : prediction === 'die' ? '(min 50%)' : ''}
        </label>
        <div className="relative">
          <Input
            type="text"
            value={percentageChange}
            onChange={handlePercentageChange}
            className="w-full p-3 bg-dream-surface border border-dream-foreground/20 rounded-md focus:outline-none focus:border-dream-accent2"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50">
            %
          </span>
        </div>
        <p className="text-xs text-dream-foreground/50 mt-1">
          Predict how much the market cap will {prediction === 'moon' ? 'increase' : prediction === 'die' ? 'decrease' : 'change'} by
          {rewardMultiplier > 1 && (
            <span className="ml-1 text-dream-accent2">
              (Reward multiplier: {rewardMultiplier}x)
            </span>
          )}
        </p>
      </div>
      
      <div>
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Bet Amount (PXB Points)
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-3 bg-dream-surface border border-dream-foreground/20 rounded-md focus:outline-none focus:border-dream-accent2"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50">
            PXB
          </span>
        </div>
        <p className="text-xs text-dream-foreground/50 mt-1">
          Min: 1 PXB | Max: {maxPointsAvailable} PXB Available
        </p>
      </div>
      
      <div>
        <label className="flex items-center text-sm text-dream-foreground/70 mb-2">
          <Clock className="w-4 h-4 mr-1" />
          Bet Duration: <span className="ml-2 font-semibold">{duration} minutes</span>
        </label>
        <Slider
          value={[duration]}
          min={10}
          max={60}
          step={5}
          onValueChange={(val) => setDuration(val[0])}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-dream-foreground/50 mt-1">
          <span>10m</span>
          <span>30m</span>
          <span>60m</span>
        </div>
      </div>
      
      {prediction && (
        <div className="p-3 bg-dream-surface/30 rounded-md">
          <p className="text-sm text-dream-foreground/70">
            You're betting that the market cap of {tokenData.symbol} will 
            <span className={prediction === 'moon' ? ' text-green-400' : ' text-red-400'}>
              {prediction === 'moon' ? ' increase' : ' decrease'} by {percentageChange}%
            </span> within {duration} minutes.
          </p>
          {parseInt(amount, 10) > 0 && (
            <p className="text-sm text-dream-foreground/70 mt-1">
              If your prediction is correct, you'll win <span className="text-green-400">{parseInt(amount, 10) * 2 * rewardMultiplier} PXB Points</span> 
              {rewardMultiplier > 1 && (
                <span className="text-dream-accent2"> (including {rewardMultiplier}x multiplier for ambitious prediction)</span>
              )}
            </p>
          )}
        </div>
      )}
      
      {transactionStatus && (
        <div className="bg-dream-accent2/10 p-3 rounded-md">
          <p className="flex items-center text-sm text-dream-accent2">
            <div className="w-4 h-4 border-2 border-dream-accent2 border-t-transparent rounded-full animate-spin mr-2"></div>
            {transactionStatus}
          </p>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          onClick={handleOpenConfirmation}
          disabled={!isWalletReady || isSubmitting || !prediction || !amount || !percentageChange || walletCheckingInProgress || !!successMessage || !userProfile}
          className="flex-1 bg-gradient-to-r from-dream-accent1 to-dream-accent3"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-dream-foreground border-t-transparent rounded-full animate-spin"></div>
              Placing Bet...
            </span>
          ) : successMessage ? (
            "Bet Placed!"
          ) : (
            "Place Bet"
          )}
        </Button>
        
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting || !!successMessage}
          >
            Cancel
          </Button>
        )}
      </div>
      
      {!userProfile ? (
        <div className="flex flex-col items-center text-sm p-3 bg-dream-surface/30 rounded-md">
          <p className="text-dream-foreground/70">Connect your wallet and mint PXB Points to place bets</p>
        </div>
      ) : !isWalletReady && (
        <div className="flex flex-col items-center text-sm p-3 bg-dream-surface/30 rounded-md">
          {connecting ? (
            <p className="text-yellow-400 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></span>
              Connecting wallet...
            </p>
          ) : !connected ? (
            <p className="text-dream-foreground/70">Connect your wallet to create bets</p>
          ) : walletCheckingInProgress ? (
            <p className="text-yellow-400 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></span>
              Verifying wallet connection...
            </p>
          ) : (
            <>
              <p className="text-red-400 flex items-center mb-2">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Wallet not properly connected
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
            </>
          )}
        </div>
      )}
      
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-dream-background border border-dream-foreground/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dream-foreground">Confirm Your Bet</AlertDialogTitle>
            <AlertDialogDescription className="text-dream-foreground/70">
              {`You are about to place a bet of ${amount} PXB Points that ${tokenData.symbol} will ${prediction} by ${percentageChange}% within ${duration} minutes.`}
              <div className="mt-2 p-3 bg-dream-foreground/10 rounded-md">
                <p className="text-dream-foreground/90 font-medium">
                  Current PXB Balance: {maxPointsAvailable} PXB
                </p>
                <p className="text-dream-foreground/90 mt-1">
                  After bet: {maxPointsAvailable - parseInt(amount, 10)} PXB
                </p>
              </div>
              <p className="mt-4 text-dream-foreground/70">
                These points will be deducted from your profile if you confirm.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex space-x-2">
            <AlertDialogCancel className="bg-dream-surface text-dream-foreground border-dream-foreground/20 hover:bg-dream-surface/80">
              Decline
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateBet} className="bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white">
              Accept & Place Bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateBetForm;
