
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

interface CreateBetFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  onBetCreated?: () => void;
  token: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateBetForm: React.FC<CreateBetFormProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onBetCreated,
  token,
  onSuccess,
  onCancel
}) => {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('up');
  const [duration, setDuration] = useState('1h');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log({
      tokenId,
      amount,
      direction,
      duration
    });
    
    onSuccess && onSuccess();
  };

  return (
    <div className="p-6 animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dream-foreground">Create Bet</h2>
        <div className="px-3 py-1 bg-dream-accent1/10 rounded-full text-sm text-dream-accent1">
          {tokenSymbol || 'Token'}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium text-dream-foreground">
          {tokenName || 'Token'}
        </h3>
        {token?.price && (
          <p className="text-dream-foreground/70">
            Current price: ${token.price.toFixed(2)}
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Bet Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Amount to bet"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-dream-background/50 border-dream-foreground/20"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="direction">Price Direction</Label>
          <Select
            value={direction}
            onValueChange={(value) => setDirection(value)}
          >
            <SelectTrigger className="bg-dream-background/50 border-dream-foreground/20">
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Going Up ↑</SelectItem>
              <SelectItem value="down">Going Down ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Bet Duration</Label>
          <Select
            value={duration}
            onValueChange={(value) => setDuration(value)}
          >
            <SelectTrigger className="bg-dream-background/50 border-dream-foreground/20">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="12h">12 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-dream-foreground/20"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white hover:opacity-90 transition-opacity"
          >
            Place Bet
          </Button>
        </div>
      </form>
    </div>
  );
};
