
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { BetPrediction } from '@/types/bet';
import { UserProfile } from '@/types/pxb';
import { toast } from 'sonner';

interface BettingPanelProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  userProfile: UserProfile | null;
  placeBet: (
    tokenMint: string,
    tokenName: string,
    tokenSymbol: string,
    amount: number,
    prediction: 'up' | 'down',
    percentageChange: number,
    duration: number
  ) => Promise<any>;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  userProfile,
  placeBet
}) => {
  const [prediction, setPrediction] = useState<BetPrediction>('migrate');
  const [duration, setDuration] = useState(30);
  const [amount, setAmount] = useState(1);
  const [placingBet, setPlacingBet] = useState(false);

  const handlePredictionChange = (newPrediction: BetPrediction) => {
    setPrediction(newPrediction);
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(Number(event.target.value));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Number(event.target.value);
    if (newAmount >= 0) {
      setAmount(newAmount);
    }
  };

  const handlePlaceBet = async () => {
    if (!tokenId) {
      toast.error("Token information is missing");
      return;
    }
    
    if (!userProfile) {
      toast.error("You need to be logged in with a wallet to place a bet");
      return;
    }

    if (amount <= 0) {
      toast.error("Bet amount must be greater than 0");
      return;
    }

    if (!userProfile.pxbPoints || userProfile.pxbPoints < amount) {
      toast.error(`Not enough PXB points. You have ${userProfile.pxbPoints || 0}, but tried to bet ${amount}.`);
      return;
    }

    setPlacingBet(true);
    try {
      const betResult = await placeBet(
        tokenId,
        tokenName || "Unknown Token",
        tokenSymbol || "UNKNOWN",
        amount,
        prediction === 'migrate' ? 'up' : 'down',
        10, // Default percentage change (increased from 5 to 10)
        duration
      );

      if (betResult) {
        toast.success(`Bet placed successfully for ${amount} PXB!`);
      } else {
        toast.error("Failed to place bet");
      }
    } catch (error: any) {
      console.error("Error placing bet:", error);
      toast.error(error.message || "Error placing bet");
    } finally {
      setPlacingBet(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Betting Details</h3>
      <div className="mb-4">
        <Label htmlFor="prediction">Prediction</Label>
        <div className="flex mt-2">
          <Button
            variant={prediction === 'migrate' ? 'default' : 'outline'}
            onClick={() => handlePredictionChange('migrate')}
            className="mr-2"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Migrate
          </Button>
          <Button
            variant={prediction === 'die' ? 'default' : 'outline'}
            onClick={() => handlePredictionChange('die')}
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            Die
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <select
          id="duration"
          className="w-full p-2 border rounded mt-1"
          value={duration}
          onChange={handleDurationChange}
        >
          <option value="5">5 minutes</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
        </select>
      </div>

      <div className="mb-4">
        <Label htmlFor="amount">Amount (PXB)</Label>
        <Input
          type="number"
          id="amount"
          className="w-full mt-1"
          value={amount}
          onChange={handleAmountChange}
          min="1"
        />
        {userProfile && (
          <p className="text-xs text-muted-foreground mt-1">
            Available: {userProfile.pxbPoints || 0} PXB
          </p>
        )}
      </div>

      <Button 
        onClick={handlePlaceBet} 
        disabled={placingBet || !userProfile || amount <= 0} 
        className="w-full"
      >
        {placingBet ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Placing Bet...
          </>
        ) : (
          `Place Bet (${amount} PXB)`
        )}
      </Button>
      
      {!userProfile && (
        <p className="text-sm text-amber-600 mt-2 text-center">
          You need to connect your wallet to place bets.
        </p>
      )}
    </div>
  );
};

export default BettingPanel;
