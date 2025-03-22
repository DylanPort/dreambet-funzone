import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePXBPoints } from '@/contexts/PXBPointsContext';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PXBOnboardingProps {
  onClose?: () => void;
}

const PXBOnboarding: React.FC<PXBOnboardingProps> = ({ onClose }) => {
  const [mintAmount, setMintAmount] = useState<number>(100);
  const [minting, setMinting] = useState<boolean>(false);
  const [minted, setMinted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { mintPoints } = usePXBPoints();

  const handleMintPoints = async () => {
    setMinting(true);
    setError(null);
    try {
      await mintPoints(mintAmount);
      setMinted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to mint points');
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
      <DialogHeader>
        <DialogTitle>Mint Free PXB Points</DialogTitle>
        <DialogDescription>
          Get started with free PXB points to explore the platform.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="amount" className="text-right text-sm font-medium">
            Amount
          </label>
          <Input
            type="number"
            id="amount"
            value={mintAmount}
            onChange={(e) => setMintAmount(Number(e.target.value))}
            className="col-span-3"
            min="1"
            disabled={minting}
          />
        </div>
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
      {minted && (
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
        <Button type="submit" onClick={handleMintPoints} disabled={minting}>
          {minting ? (
            <>
              Minting...
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Mint Points"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default PXBOnboarding;
