
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
  const [selectedPrediction, setSelectedPrediction] = useState<BetPrediction>('moon');
  const [percentageChange, setPercentageChange] = useState<number>(50);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [duration, setDuration] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const { connected } = useWallet();
  const { placeBet, userProfile } = usePXBPoints();
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [isLoadingMarketCap, setIsLoadingMarketCap] = useState(true);
  const [targetMarketCap, setTargetMarketCap] = useState<number | null>(null);
  const [meetsMcapRequirements, setMeetsMcapRequirements] = useState(false);

  // Listen for prediction selection from parent components (like TokenCard)
  useEffect(() => {
    const handlePredictionSelected = (event: CustomEvent) => {
      if (event.detail) {
        const { prediction, percentageChange, defaultBetAmount, defaultDuration } = event.detail;
        setSelectedPrediction(prediction);
        if (percentageChange) setPercentageChange(percentageChange);
        if (defaultBetAmount) setBetAmount(defaultBetAmount);
        if (defaultDuration) setDuration(defaultDuration);
      }
    };

    window.addEventListener('predictionSelected', handlePredictionSelected as EventListener);
    
    return () => {
      window.removeEventListener('predictionSelected', handlePredictionSelected as EventListener);
    };
  }, []);

  // Subscribe to market cap updates
  useEffect(() => {
    const unsubscribe = subscribeToTokenMetric(tokenId, 'marketCap', (value) => {
      if (value !== null) {
        setMarketCap(value);
        setIsLoadingMarketCap(false);
        
        // Check if token meets market cap requirements
        const tokenMetrics: TokenMetrics = {
          marketCap: value,
          volume24h: null,
          priceUsd: null,
          priceChange24h: null,
          liquidity: null,
          timestamp: Date.now()
        };
        
        const meetsRequirements = meetsMarketCapRequirements(tokenMetrics, selectedPrediction);
        setMeetsMcapRequirements(meetsRequirements);
        
        // Calculate target market cap if requirements are met
        if (meetsRequirements && value) {
          const target = calculateTargetMarketCap(value, selectedPrediction, percentageChange);
          setTargetMarketCap(target);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [tokenId, selectedPrediction, percentageChange]);

  // Recalculate target market cap when inputs change
  useEffect(() => {
    if (marketCap && meetsMcapRequirements) {
      const target = calculateTargetMarketCap(marketCap, selectedPrediction, percentageChange);
      setTargetMarketCap(target);
    }
  }, [marketCap, selectedPrediction, percentageChange, meetsMcapRequirements]);

  // Initialize market cap on mount
  useEffect(() => {
    const initMarketCap = async () => {
      setIsLoadingMarketCap(true);
      try {
        const metrics = await fetchTokenMetrics(tokenId);
        if (metrics && metrics.marketCap !== null) {
          setMarketCap(metrics.marketCap);
          
          // Check if token meets market cap requirements
          const meetsRequirements = meetsMarketCapRequirements(metrics, selectedPrediction);
          setMeetsMcapRequirements(meetsRequirements);
          
          // Calculate target market cap if requirements are met
          if (meetsRequirements && metrics.marketCap) {
            const target = calculateTargetMarketCap(metrics.marketCap, selectedPrediction, percentageChange);
            setTargetMarketCap(target);
          }
        }
      } catch (error) {
        console.error("Error fetching initial market cap:", error);
        toast.error("Couldn't fetch token market cap data");
      } finally {
        setIsLoadingMarketCap(false);
      }
    };
    
    initMarketCap();
  }, [tokenId, selectedPrediction]);

  const handlePredictionChange = (prediction: BetPrediction) => {
    setSelectedPrediction(prediction);
    
    // Set default percentage based on prediction type
    if (prediction === 'moon') {
      setPercentageChange(80); // 80% increase for moon
    } else {
      setPercentageChange(50); // 50% decrease for die
    }
    
    // Check if token meets requirements for the new prediction type
    if (marketCap !== null) {
      const tokenMetrics: TokenMetrics = {
        marketCap,
        volume24h: null,
        priceUsd: null,
        priceChange24h: null,
        liquidity: null,
        timestamp: Date.now()
      };
      
      const meetsRequirements = meetsMarketCapRequirements(tokenMetrics, prediction);
      setMeetsMcapRequirements(meetsRequirements);
      
      // Recalculate target market cap
      if (meetsRequirements) {
        const target = calculateTargetMarketCap(marketCap, prediction, prediction === 'moon' ? 80 : 50);
        setTargetMarketCap(target);
      }
    }
  };

  const handlePercentageChange = (values: number[]) => {
    const newPercentage = values[0];
    setPercentageChange(newPercentage);
    
    // Recalculate target market cap
    if (marketCap !== null && meetsMcapRequirements) {
      const target = calculateTargetMarketCap(marketCap, selectedPrediction, newPercentage);
      setTargetMarketCap(target);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error("Please connect your wallet to place a bet");
      return;
    }
    
    if (!userProfile) {
      toast.error("Please sign in to place a bet");
      return;
    }
    
    if (userProfile.pxbPoints < betAmount) {
      toast.error(`Insufficient PXB points. You need ${betAmount} points.`);
      return;
    }
    
    if (!meetsMcapRequirements) {
      const minRequirement = selectedPrediction === 'moon' 
        ? `$${MIN_MARKET_CAP_MOON.toLocaleString()}`
        : `$${MIN_MARKET_CAP_DUST.toLocaleString()}`;
        
      toast.error(`Token doesn't meet minimum market cap requirement of ${minRequirement}`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await placeBet(
        tokenId,
        tokenName,
        tokenSymbol,
        betAmount,
        selectedPrediction,
        percentageChange,
        duration
      );
      
      toast.success("Bet placed successfully!");
      onBetCreated();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  const refreshMarketCap = async () => {
    setIsLoadingMarketCap(true);
    try {
      const metrics = await fetchTokenMetrics(tokenId);
      if (metrics && metrics.marketCap !== null) {
        setMarketCap(metrics.marketCap);
        
        // Check if token meets market cap requirements
        const meetsRequirements = meetsMarketCapRequirements(metrics, selectedPrediction);
        setMeetsMcapRequirements(meetsRequirements);
        
        // Recalculate target market cap
        if (meetsRequirements && metrics.marketCap) {
          const target = calculateTargetMarketCap(metrics.marketCap, selectedPrediction, percentageChange);
          setTargetMarketCap(target);
        }
        
        toast.success("Market cap data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing market cap:", error);
      toast.error("Failed to refresh market cap data");
    } finally {
      setIsLoadingMarketCap(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-semibold flex items-center">
            Place Bet on {tokenSymbol}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowInfoDialog(true)} 
                    className="ml-2 text-dream-foreground/50 hover:text-dream-foreground"
                  >
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-64">Get more info about betting</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <p className="text-sm text-dream-foreground/60">
            Bet against the house and win up to 2x your points
          </p>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={refreshMarketCap}
          disabled={isLoadingMarketCap}
        >
          <RefreshCw size={16} className={isLoadingMarketCap ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Market Cap Display */}
      <div className="flex justify-between items-center p-3 border border-dream-foreground/10 rounded-md bg-dream-foreground/5">
        <div>
          <div className="text-sm text-dream-foreground/70">Current Market Cap</div>
          <div className="text-lg font-semibold">
            {isLoadingMarketCap ? (
              <div className="animate-pulse">Loading...</div>
            ) : marketCap !== null ? (
              formatLargeNumber(marketCap)
            ) : (
              "Not available"
            )}
          </div>
        </div>
        
        {targetMarketCap !== null && meetsMcapRequirements && (
          <div>
            <div className="text-sm text-dream-foreground/70">
              Target for {selectedPrediction === 'moon' ? 'Win' : 'Dust'}
            </div>
            <div className={`text-lg font-semibold ${selectedPrediction === 'moon' ? 'text-green-400' : 'text-red-400'}`}>
              {formatLargeNumber(targetMarketCap)}
            </div>
          </div>
        )}
      </div>

      {/* Market Cap Requirements Warning */}
      {!meetsMcapRequirements && marketCap !== null && (
        <div className="p-3 border border-red-500/30 rounded-md bg-red-500/10 text-red-300 text-sm">
          <p className="flex items-center">
            <HelpCircle size={16} className="mr-2" />
            This token doesn't meet minimum market cap requirements:
          </p>
          <ul className="list-disc ml-6 mt-1">
            <li>Moon bets: Minimum ${MIN_MARKET_CAP_MOON.toLocaleString()} market cap</li>
            <li>Die bets: Minimum ${MIN_MARKET_CAP_DUST.toLocaleString()} market cap</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Moon/Die selection */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button 
            type="button"
            className={`btn-moon ${selectedPrediction === 'moon' ? 'ring-2 ring-green-400 animate-pulse-slow text-white' : 'text-white/80'} py-6 flex items-center justify-center gap-2 relative overflow-hidden`}
            onClick={() => handlePredictionChange('moon')}
          >
            {selectedPrediction === 'moon' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-scan-line"></div>
            )}
            <div className="flex flex-col items-center justify-center relative z-10">
              <Sparkles className="w-8 h-8 mb-2" />
              <span className="text-lg font-semibold">Moon</span>
              <span className="text-xs text-dream-foreground/70 mt-1">Token goes up 📈</span>
            </div>
          </button>
          
          <button 
            type="button"
            className={`btn-die ${selectedPrediction === 'die' ? 'ring-2 ring-red-400 animate-pulse-slow text-white' : 'text-white/80'} py-6 flex items-center justify-center gap-2 relative overflow-hidden`}
            onClick={() => handlePredictionChange('die')}
          >
            {selectedPrediction === 'die' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-scan-line"></div>
            )}
            <div className="flex flex-col items-center justify-center relative z-10">
              <Moon className="w-8 h-8 mb-2" />
              <span className="text-lg font-semibold">Die</span>
              <span className="text-xs text-dream-foreground/70 mt-1">Token goes down 📉</span>
            </div>
          </button>
        </div>

        <div className="space-y-4">
          <Collapsible
            open={showCustomization}
            onOpenChange={setShowCustomization}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="flex justify-between w-full"
              >
                <span>Customize Bet</span>
                <span className="text-dream-accent2">{showCustomization ? '▲ Less' : '▼ More'}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {/* Percentage change slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="percentageChange" className="text-sm text-dream-foreground/70">
                    {selectedPrediction === 'moon' ? 'Price Increase Target' : 'Price Decrease Target'}
                  </label>
                  <span className="text-sm font-medium">{percentageChange}%</span>
                </div>
                <Slider
                  id="percentageChange"
                  min={selectedPrediction === 'moon' ? 20 : 20}
                  max={selectedPrediction === 'moon' ? 200 : 90}
                  step={5}
                  value={[percentageChange]}
                  onValueChange={handlePercentageChange}
                  className={`${selectedPrediction === 'moon' ? 'moon-slider' : 'die-slider'}`}
                  disabled={!meetsMcapRequirements}
                />
                <div className="flex justify-between text-xs text-dream-foreground/50">
                  <span>{selectedPrediction === 'moon' ? '20%' : '20%'}</span>
                  <span>{selectedPrediction === 'moon' ? '200%' : '90%'}</span>
                </div>
              </div>

              {/* Duration selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="duration" className="text-sm text-dream-foreground/70">
                    Time to Achieve Target
                  </label>
                  <span className="text-sm font-medium">{duration} days</span>
                </div>
                <Slider
                  id="duration"
                  min={1}
                  max={60}
                  step={1}
                  value={[duration]}
                  onValueChange={(values) => setDuration(values[0])}
                  className="timeline-slider"
                  disabled={!meetsMcapRequirements}
                />
                <div className="flex justify-between text-xs text-dream-foreground/50">
                  <span>1 day</span>
                  <span>60 days</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Bet amount */}
          <div className="space-y-2">
            <label htmlFor="betAmount" className="text-sm text-dream-foreground/70 flex items-center">
              <Coins size={14} className="mr-1" />
              Bet Amount
            </label>
            <div className="relative">
              <Input
                id="betAmount"
                type="number"
                min="10"
                max={userProfile?.pxbPoints || 1000}
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                className="pr-16"
                disabled={!meetsMcapRequirements}
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-dream-foreground/70">
                PXB
              </div>
            </div>
            <div className="text-xs text-dream-foreground/50 flex justify-between">
              <span>Min: 10 PXB</span>
              <span>Available: {userProfile?.pxbPoints || 0} PXB</span>
            </div>
          </div>

          {/* Win amount calculation */}
          <div className="p-3 border border-dream-foreground/10 rounded-md bg-dream-foreground/5 flex justify-between">
            <span className="text-sm text-dream-foreground/70">Potential Win</span>
            <span className="font-medium text-dream-accent2">
              {(betAmount * 2).toLocaleString()} PXB
            </span>
          </div>

          {/* Submit and Cancel buttons */}
          <div className="flex space-x-2">
            <Button
              type="submit"
              className="flex-1 text-black font-semibold bg-dream-accent2 hover:bg-dream-accent2/80 disabled:bg-dream-accent2/50"
              disabled={isSubmitting || !connected || !meetsMcapRequirements}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Placing Bet...
                </>
              ) : (
                <>
                  {selectedPrediction === 'moon' ? 'Bet on Moon' : 'Bet on Die'}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Info Dialog */}
      <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display">
              How Betting Works
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Betting lets you wager PXB Points on whether a token's price will 
                increase (Moon) or decrease (Die) by a certain percentage within a specified timeframe.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-dream-foreground">Bet Types:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-dream-foreground/5 p-2 rounded-md border border-green-500/20">
                    <div className="flex items-center text-green-400 mb-1">
                      <TrendingUp size={14} className="mr-1" />
                      <strong>Moon Bet</strong>
                    </div>
                    <p className="text-dream-foreground/70">
                      Wager that the token's market cap will increase by your specified percentage
                    </p>
                  </div>
                  <div className="bg-dream-foreground/5 p-2 rounded-md border border-red-500/20">
                    <div className="flex items-center text-red-400 mb-1">
                      <TrendingDown size={14} className="mr-1" />
                      <strong>Die Bet</strong>
                    </div>
                    <p className="text-dream-foreground/70">
                      Wager that the token's market cap will decrease by your specified percentage
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-dream-foreground">Rewards:</h4>
                <p className="text-dream-foreground/70 text-sm">
                  If your prediction comes true within the specified timeframe, you win 
                  2x your bet amount in PXB Points. If not, you lose your wagered points.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-dream-foreground">Requirements:</h4>
                <ul className="list-disc pl-5 text-sm text-dream-foreground/70 space-y-1">
                  <li>Moon bets: Token must have at least ${MIN_MARKET_CAP_MOON.toLocaleString()} market cap</li>
                  <li>Die bets: Token must have at least ${MIN_MARKET_CAP_DUST.toLocaleString()} market cap</li>
                  <li>Minimum bet: 10 PXB Points</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateBetForm;
