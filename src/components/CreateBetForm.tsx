import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { createBet } from '@/api/mockData';
import { useToast } from '@/hooks/use-toast';
import { BetPrediction } from '@/types/bet';

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
  const [amount, setAmount] = useState<string>('0.1');
  const [prediction, setPrediction] = useState<BetPrediction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleCreateBet = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a bet",
        variant: "destructive",
      });
      return;
    }

    if (!prediction) {
      toast({
        title: "Select a prediction",
        description: "Please choose whether the token will migrate or die",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createBet(
        tokenId,
        tokenName,
        tokenSymbol,
        publicKey.toString(),
        amountValue,
        prediction
      );
      
      toast({
        title: "Bet created successfully!",
        description: `Your ${amountValue} SOL bet that ${tokenSymbol} will ${prediction} is now live`,
      });
      
      // Reset form
      setAmount('0.1');
      setPrediction(null);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      } else {
        onBetCreated();
      }
    } catch (error) {
      console.error('Error creating bet:', error);
      toast({
        title: "Failed to create bet",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-xl font-display font-semibold">Create a New Bet</h3>
      
      <div>
        <label className="block text-sm text-dream-foreground/70 mb-1">
          Your Prediction
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPrediction('migrate')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
              prediction === 'migrate'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'border-dream-foreground/20 hover:bg-green-500/10'
            }`}
          >
            <ArrowUp size={18} />
            <span>MIGRATE 🚀</span>
          </button>
          
          <button
            type="button"
            onClick={() => setPrediction('die')}
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
          Bet Amount (SOL)
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-3 bg-dream-surface border border-dream-foreground/20 rounded-md focus:outline-none focus:border-dream-accent2"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50">
            SOL
          </span>
        </div>
        <p className="text-xs text-dream-foreground/50 mt-1">
          Min: 0.01 SOL | Max: 10 SOL
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={handleCreateBet}
          disabled={!connected || isSubmitting || !prediction || !amount}
          className="flex-1 bg-gradient-to-r from-dream-accent1 to-dream-accent3"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-dream-foreground border-t-transparent rounded-full animate-spin"></div>
              Creating Bet...
            </span>
          ) : (
            "Create Bet"
          )}
        </Button>
        
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
      
      {!connected && (
        <p className="text-center text-sm text-dream-foreground/70">
          Connect your wallet to create bets
        </p>
      )}
    </div>
  );
};

export default CreateBetForm;
