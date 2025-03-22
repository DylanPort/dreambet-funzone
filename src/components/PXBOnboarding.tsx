
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, CheckCircle2, InfoIcon, Clock, Lock, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { confetti } from '@/lib/utils';

interface PXBOnboardingProps {
  onClose?: () => void;
}

const PXBOnboarding: React.FC<PXBOnboardingProps> = ({ onClose }) => {
  const [mintAmount] = useState<number>(2000);
  const [minting, setMinting] = useState<boolean>(false);
  const [minted, setMinted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMintedBefore, setHasMintedBefore] = useState<boolean>(false);
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const { mintPoints } = usePXBPoints();
  const { publicKey } = useWallet();

  const MAX_MINT_AMOUNT = 2000;
  
  useEffect(() => {
    // Check if this wallet has ever minted before
    if (publicKey) {
      const walletAddress = publicKey.toString();
      const mintedWallets = JSON.parse(localStorage.getItem('pxbMintedWallets') || '{}');
      if (mintedWallets[walletAddress]) {
        setHasMintedBefore(true);
      }
    }
  }, [publicKey]);

  const handleMintPoints = async () => {
    if (!publicKey) return;
    
    setMinting(true);
    setError(null);
    try {
      await mintPoints(MAX_MINT_AMOUNT);
      setMinted(true);
      
      // Mark this wallet as having minted
      const walletAddress = publicKey.toString();
      const mintedWallets = JSON.parse(localStorage.getItem('pxbMintedWallets') || '{}');
      mintedWallets[walletAddress] = true;
      localStorage.setItem('pxbMintedWallets', JSON.stringify(mintedWallets));
      setHasMintedBefore(true);
      
      // Show success animation
      setShowSuccessCard(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success('Successfully minted 2000 PXB points!');
      
    } catch (err: any) {
      setError(err.message || 'Failed to mint points');
      toast.error(err.message || 'Failed to mint points');
    } finally {
      setMinting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <AnimatePresence mode="wait">
        {showSuccessCard ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="p-4"
          >
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.02, 1],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
              <div className="relative bg-card border border-purple-500/30 p-6 rounded-lg shadow-xl z-10">
                <div className="flex flex-col items-center text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.6,
                      delay: 0.2,
                      type: "spring"
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-4"
                  >
                    <Coins className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-2xl font-bold mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Tokens Minted!
                  </motion.h2>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 mb-4"
                  >
                    +2,000 PXB
                  </motion.div>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-muted-foreground mb-6"
                  >
                    Congratulations! You've successfully minted your PXB tokens.
                    These tokens are now in your wallet and ready to use.
                  </motion.p>
                  
                  <Button 
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    Continue to App
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mint-form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DialogHeader>
              <DialogTitle>Mint Free PXB Points</DialogTitle>
              <DialogDescription>
                Get started with free PXB points to explore the platform.
                You can only mint points once per wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="bg-card border border-border p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Amount to Mint</span>
                  <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">2,000 PXB</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  2000 PXB points per wallet. One-time only!
                </p>
              </div>
              
              {hasMintedBefore && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-950/30 p-3 rounded-md border border-amber-900/50"
                >
                  <div className="text-sm text-amber-300 mb-2 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>You've already minted your free PXB points.</span>
                  </div>
                  <div className="text-center text-amber-200/70 text-xs">
                    Each wallet can only mint free points once.
                  </div>
                </motion.div>
              )}
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center text-sm text-red-500 space-x-2 mb-3"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}
            {minted && !showSuccessCard && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center text-sm text-green-500 space-x-2 mb-3"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Successfully minted {mintAmount} PXB points!</span>
              </motion.div>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose} disabled={minting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleMintPoints} 
                disabled={minting || hasMintedBefore}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                {minting ? (
                  <>
                    Minting...
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : hasMintedBefore ? (
                  "Already Minted"
                ) : (
                  "Mint 2000 PXB Points"
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContent>
  );
};

export default PXBOnboarding;
