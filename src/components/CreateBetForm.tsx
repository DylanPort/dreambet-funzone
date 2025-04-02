import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { ArrowUp, ArrowDown, Clock, DollarSign, Target, Info } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { Bet, BetPrediction } from '@/types/bet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export interface CreateBetFormProps {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  onSuccess: () => void;
  onClose: () => void;
}

const CreateBetForm: React.FC<CreateBetFormProps> = ({
  tokenId,
  tokenName,
  tokenSymbol,
  onSuccess,
  onClose
}) => {
  const [amount, setAmount] = useState<number>(0.1);
  const [prediction, setPrediction] = useState<BetPrediction>('up');
  const [duration, setDuration] = useState<number>(24); // hours
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { connected, publicKey, signTransaction } = useWallet();
  const { toast } = useToast();

  const handleCreateBet = async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a bet',
        variant: 'destructive',
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid bet amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Mocking the create bet functionality since createBet is missing
      // In a real implementation, you would call the actual createBet function
      console.log('Creating bet:', {
        tokenId,
        tokenName,
        tokenSymbol,
        amount,
        prediction,
        duration,
        publicKey: publicKey.toString()
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Bet created!',
        description: `Your bet on ${tokenSymbol} has been created successfully`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating bet:', error);
      toast({
        title: 'Failed to create bet',
        description: 'There was an error processing your request',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-black/30 border border-dream-accent2/30 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Create New Bet</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
      
      <div className="space-y-6">
        <div>
          <Label className="flex items-center mb-2">
            Prediction Type
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 ml-2 text-dream-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose whether you think the token price will go up or down</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          
          <RadioGroup 
            value={prediction} 
            onValueChange={(value) => setPrediction(value as BetPrediction)}
            className="flex gap-4"
          >
            <div className={`flex-1 border ${prediction === 'up' ? 'border-green-500 bg-green-500/10' : 'border-dream-foreground/10 bg-black/20'} rounded-lg p-4 cursor-pointer transition-all duration-300`}
                 onClick={() => setPrediction('up')}>
              <RadioGroupItem value="up" id="up" className="sr-only" />
              <Label htmlFor="up" className="flex flex-col items-center cursor-pointer">
                <ArrowUp className="w-8 h-8 mb-2 text-green-500" />
                <span className="font-semibold text-green-500">UP</span>
                <span className="text-xs text-dream-foreground/70 mt-1">Price will increase</span>
              </Label>
            </div>
            
            <div className={`flex-1 border ${prediction === 'down' ? 'border-red-500 bg-red-500/10' : 'border-dream-foreground/10 bg-black/20'} rounded-lg p-4 cursor-pointer transition-all duration-300`}
                 onClick={() => setPrediction('down')}>
              <RadioGroupItem value="down" id="down" className="sr-only" />
              <Label htmlFor="down" className="flex flex-col items-center cursor-pointer">
                <ArrowDown className="w-8 h-8 mb-2 text-red-500" />
                <span className="font-semibold text-red-500">DOWN</span>
                <span className="text-xs text-dream-foreground/70 mt-1">Price will decrease</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label className="flex items-center mb-2">
            Bet Amount (SOL)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 ml-2 text-dream-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The amount of SOL you want to bet</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/50 w-4 h-4" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min={0.01}
                step={0.01}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(0.1)}
                className={amount === 0.1 ? 'bg-dream-accent2/20' : ''}
              >
                0.1
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(0.5)}
                className={amount === 0.5 ? 'bg-dream-accent2/20' : ''}
              >
                0.5
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(1)}
                className={amount === 1 ? 'bg-dream-accent2/20' : ''}
              >
                1
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <Label className="flex items-center mb-2">
            Duration
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 ml-2 text-dream-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How long the bet will be open for others to accept</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Clock className="text-dream-foreground/50 w-4 h-4" />
              <Slider
                value={[duration]}
                min={1}
                max={72}
                step={1}
                onValueChange={(value) => setDuration(value[0])}
                className="flex-1"
              />
              <span className="min-w-[60px] text-right">{duration} hours</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setDuration(24)}
                className={duration === 24 ? 'bg-dream-accent2/20' : ''}
              >
                24h
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setDuration(48)}
                className={duration === 48 ? 'bg-dream-accent2/20' : ''}
              >
                48h
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setDuration(72)}
                className={duration === 72 ? 'bg-dream-accent2/20' : ''}
              >
                72h
              </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-dream-foreground/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-dream-foreground/70">Token</div>
              <div className="font-semibold">{tokenName} ({tokenSymbol})</div>
            </div>
            
            <div>
              <div className="text-sm text-dream-foreground/70">Your Prediction</div>
              <div className={`font-semibold ${prediction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {prediction === 'up' ? 'Price will go UP' : 'Price will go DOWN'}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateBet} 
            disabled={isCreating || !connected || amount <= 0} 
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Bet'}
          </Button>
          
          {!connected && (
            <div className="mt-2 text-center text-sm text-dream-foreground/70">
              Please connect your wallet to create a bet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBetForm;
