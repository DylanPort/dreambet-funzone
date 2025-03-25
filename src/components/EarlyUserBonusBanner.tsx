
import React, { useState, useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { PartyPopper, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CountdownTimer from '@/components/CountdownTimer';

const EarlyUserBonusBanner: React.FC = () => {
  const { isFeatureEnabled, getFeatureConfig, getTimeRemaining } = useFeatureFlags('early_user_bonus');
  const [dismissed, setDismissed] = useState(false);
  const [mintAmount, setMintAmount] = useState(2000);
  const [description, setDescription] = useState('');
  const { mintPoints, userProfile, mintingPoints } = usePXBPoints();
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    const storedDismissal = localStorage.getItem('earlyUserBonusDismissed');
    if (storedDismissal) {
      setDismissed(true);
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
          description: `You've claimed ${mintAmount.toLocaleString()} PXB as an early user bonus!`,
        });
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

  if (!isFeatureEnabled('early_user_bonus') || dismissed || !endTime) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="w-full bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 border-b border-indigo-700 overflow-hidden"
      >
        <div className="container px-4 py-3 mx-auto relative">
          <Button 
            variant="ghost" 
            className="absolute right-2 top-2 h-6 w-6 p-0 rounded-full text-white/70 hover:text-white hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <PartyPopper className="h-6 w-6 text-yellow-400 mr-2 animate-bounce" />
              <div>
                <h3 className="font-bold text-white">Early User Bonus!</h3>
                <p className="text-white/80 text-sm">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-black/30 px-3 py-1.5 rounded-lg flex items-center">
                <CountdownTimer 
                  endTime={endTime} 
                  onComplete={() => window.location.reload()} 
                />
              </div>
              
              <Button
                onClick={handleClaim}
                disabled={mintingPoints || !userProfile}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
              >
                {mintingPoints ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Claiming...
                  </>
                ) : (
                  <>Claim {mintAmount.toLocaleString()} PXB</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EarlyUserBonusBanner;
