import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import PXBBetsList from './PXBBetsList';

const CreateBetForm = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();

  const [betType, setBetType] = useState<'up' | 'down'>('up');
  const [percentageChange, setPercentageChange] = useState(5);
  const [betAmount, setBetAmount] = useState('');

  useEffect(() => {
    if (!connected) {
      toast.error('Connect your wallet to place a bet.');
      navigate('/pxb-space');
    }
  }, [connected, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!publicKey) {
      toast.error('Wallet not connected.');
      return;
    }

    if (!tokenId) {
      toast.error('Token ID is missing.');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bet amount.');
      return;
    }

    // Here you would call your function to create the bet
    toast.success(`Bet placed: ${betType} by ${percentageChange}% with ${amount} PXB`);
    // Example: await createBet(tokenId, betType, percentageChange, amount, publicKey.toString());

    // Redirect or update UI as needed
    navigate('/pxb-space');
  };
  
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-6">Create a New Bet</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="bet-type">Bet Type</Label>
            <RadioGroup defaultValue={betType} className="mt-2" onValueChange={(value) => setBetType(value as 'up' | 'down')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="up" id="r1" />
                <Label htmlFor="r1">MOON (+{percentageChange}%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="down" id="r2" />
                <Label htmlFor="r2">DIE (-{percentageChange}%)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="percentage-change">Percentage Change</Label>
            <Slider
              id="percentage-change"
              defaultValue={[percentageChange]}
              max={20}
              min={1}
              step={1}
              onValueChange={(value) => setPercentageChange(value[0])}
              className="mt-2"
            />
            <p className="text-sm text-dream-foreground/60 mt-1">
              Target change: {betType === 'up' ? '+' : '-'}{percentageChange}%
            </p>
          </div>
          
          <div>
            <Label htmlFor="bet-amount">Bet Amount (PXB)</Label>
            <Input
              type="number"
              id="bet-amount"
              placeholder="Enter amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full">Place Bet</Button>
        </form>
      </div>
      
      {/* Display user's current bets in a compact view */}
      <PXBBetsList 
        showHeader={true}
        maxItems={3}
        compact={true}
        className="mt-6" 
      />
    </div>
  );
};

export default CreateBetForm;
