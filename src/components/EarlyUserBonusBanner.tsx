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
          description: `You've claimed ${mintAmount.toLocaleString()} PXB as an early user bonus!`
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
  return <AnimatePresence>
      
    </AnimatePresence>;
};
export default EarlyUserBonusBanner;