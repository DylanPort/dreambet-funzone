
import React, { useState, useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { PartyPopper, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CountdownTimer from '@/components/CountdownTimer';

const EarlyUserBonusBanner: React.FC = () => {
  const {
    isFeatureEnabled,
    getFeatureConfig,
    getTimeRemaining
  } = useFeatureFlags('early_user_bonus');
  const [dismissed, setDismissed] = useState(false);
  const [mintAmount, setMintAmount] = useState(2000);
  const [description, setDescription] = useState('');
  const {
    mintPoints,
    userProfile,
    mintingPoints
  } = usePXBPoints();
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [hasMinted, setHasMinted] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);

  useEffect(() => {
    const storedDismissal = localStorage.getItem('earlyUserBonusDismissed');
    if (storedDismissal) {
      setDismissed(true);
    }

    // Check if user has already minted in the last 24 hours
    const lastMintTime = localStorage.getItem('earlyUserBonusLastMint');
    if (lastMintTime) {
      const lastMint = new Date(parseInt(lastMintTime, 10));
      const now = new Date();
      const timeSinceLastMint = now.getTime() - lastMint.getTime();
      
      if (timeSinceLastMint < 24 * 60 * 60 * 1000) { // Less than 24 hours
        setHasMinted(true);
        const cooldownEnd = new Date(lastMint.getTime() + 24 * 60 * 60 * 1000);
        setCooldownEndTime(cooldownEnd);
      }
    }

    if (isFeatureEnabled('early_user_bonus')) {
      const config = getFeatureConfig('early_user_bonus');
      if (config) {
        setMintAmount(config.mint_amount || 2000);
        setDescription(config.description || '');
      }
      
      const timeRemaining = getTimeRemaining('early_user_bonus');
      if (timeRemaining) {
        setEndTime(new Date(Date.now() + timeRemaining));
      }
    }
  }, [isFeatureEnabled, getFeatureConfig, getTimeRemaining]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('earlyUserBonusDismissed', 'true');
  };

  const handleClaim = async () => {
    try {
      if (mintPoints) {
        await mintPoints(mintAmount);
        toast({
          title: "Success!",
          description: `You've claimed ${mintAmount.toLocaleString()} PXB as an early user bonus!`
        });
        
        // Set last mint time and cooldown
        const now = new Date();
        localStorage.setItem('earlyUserBonusLastMint', now.getTime().toString());
        setHasMinted(true);
        
        // Calculate cooldown end time (24 hours from now)
        const cooldownEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setCooldownEndTime(cooldownEnd);
      }
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast({
        title: "Error",
        description: "Failed to claim your bonus. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCooldownComplete = () => {
    setHasMinted(false);
    setCooldownEndTime(null);
  };

  if (!isFeatureEnabled('early_user_bonus') || dismissed || !endTime) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg overflow-hidden relative"
      >
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between relative">
          <button 
            onClick={handleDismiss} 
            className="absolute top-2 right-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="bg-white/20 p-2 rounded-full mr-3">
              <PartyPopper className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Early User Bonus!</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:items-end space-y-2">
            {endTime && (
              <div className="text-white/90 text-sm flex items-center bg-black/20 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-1 text-yellow-300" />
                <span>Offer ends in: </span>
                <CountdownTimer endTime={endTime} />
              </div>
            )}
            
            {hasMinted && cooldownEndTime ? (
              <div className="bg-white/10 px-4 py-2 rounded-lg text-white text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2 text-yellow-300" />
                <span>Next claim in: </span>
                <CountdownTimer 
                  endTime={cooldownEndTime} 
                  onComplete={handleCooldownComplete} 
                />
              </div>
            ) : (
              <Button
                onClick={handleClaim}
                disabled={mintingPoints}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold"
              >
                {mintingPoints ? (
                  <>
                    <span className="h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></span>
                    Minting...
                  </>
                ) : (
                  <>Claim {mintAmount.toLocaleString()} PXB</>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EarlyUserBonusBanner;
