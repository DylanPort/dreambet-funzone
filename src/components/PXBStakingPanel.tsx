import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CalendarClock, Coins, Timer, Gift, AlertCircle, TrendingUp, Lock, ArrowDownUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
const PXBStakingPanel = () => {
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [stakeDuration, setStakeDuration] = useState<number>(30); // Default 30 days
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const calculateEstimatedRewards = () => {
    const amount = parseFloat(stakeAmount) || 0;
    return (amount * 0.002 * stakeDuration).toFixed(2);
  };
  const handleStakeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setStakeAmount(value);
  };
  const handleStakeDurationChange = (value: number[]) => {
    setStakeDuration(value[0]);
  };
  const handleMaxClick = () => {
    setStakeAmount('1000');
    toast.info("Connected wallet balance: 1,000 $POINTS");
  };
  const handleStakeSubmit = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }
    toast.info("$POINTS Staking feature coming soon!", {
      description: "The staking feature will be available shortly after token launch."
    });
  };
  const copyToClipboard = () => {
    toast.info("$POINTS Contract address will be available at launch!");
  };
  return <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        
      </div>
      
      <Card className="bg-black/30 border-dream-foreground/10 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dream-accent1 via-dream-accent2 to-dream-accent3"></div>
        
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Lock className="mr-2 h-5 w-5 text-dream-accent1" />
            Stake $POINTS to Earn PXB
          </CardTitle>
          <CardDescription>
            Stake your $POINTS tokens to earn PXB rewards with dynamic APY
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Contract Address Section */}
          <div className="bg-dream-foreground/5 rounded-md p-3 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <Lock className="mr-1 h-4 w-4 text-dream-accent1" />
              <span>$POINTS Contract</span>
            </div>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-xs text-[#34bf1f]">FZLJm7M2vmHuuEqtRu96xLXP9NrHyhZYebbQBdqqpump</Button>
          </div>
          
          <div className="flex justify-between items-center mb-1 text-sm">
            <div className="flex items-center">
              
              <span>Stake Amount</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-dream-accent1 hover:text-dream-accent1/80" onClick={handleMaxClick}>
              MAX
            </Button>
          </div>
          
          <div className="relative">
            <Input type="text" value={stakeAmount} onChange={handleStakeAmountChange} placeholder="0.00" className="bg-black/20 border-dream-foreground/10 text-lg pr-20" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <img src="/lovable-uploads/c5a2b975-3b82-4cbf-94db-8cb2fe2be3a6.png" alt="Points" className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium text-dream-foreground/70">POINTS</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-1 mt-4 text-sm">
            <div className="flex items-center">
              
              <span>Stake Duration</span>
            </div>
            <span className="text-dream-foreground/70">{stakeDuration} days</span>
          </div>
          
          <Slider defaultValue={[30]} min={7} max={365} step={1} onValueChange={handleStakeDurationChange} className="mt-2" />
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button variant="outline" size="sm" className="border-dream-foreground/10 hover:bg-dream-foreground/5" onClick={() => setStakeDuration(30)}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" className="border-dream-foreground/10 hover:bg-dream-foreground/5" onClick={() => setStakeDuration(90)}>
              90 Days
            </Button>
            <Button variant="outline" size="sm" className="border-dream-foreground/10 hover:bg-dream-foreground/5" onClick={() => setStakeDuration(365)}>
              1 Year
            </Button>
          </div>
          
          <div className="bg-dream-foreground/5 rounded-md p-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center text-sm">
                <Gift className="mr-1 h-4 w-4 text-green-400" />
                <span>Estimated Rewards</span>
              </div>
              <span className="text-green-400 font-medium">
                {calculateEstimatedRewards()} PXB
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-dream-foreground/70">
              <div className="flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                <span>Current APY</span>
              </div>
              <span className="text-dream-accent1">73.0%</span>
            </div>
          </div>
          
          <div className="bg-dream-foreground/5 rounded-md p-3 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <AlertCircle className="mr-1 h-4 w-4 text-yellow-400" />
              <span>Staking Fee</span>
            </div>
            <span className="text-dream-foreground/80">1%</span>
          </div>
          
          <div className="bg-dream-foreground/5 rounded-md p-3 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <ArrowDownUp className="mr-1 h-4 w-4 text-yellow-400" />
              <span>Early Unstake Fee</span>
            </div>
            <span className="text-dream-foreground/80">5%</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
          <Button onClick={handleStakeSubmit} disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0} className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent2 hover:opacity-90 transition-opacity">
            {isStaking ? <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Staking...
              </> : 'Stake $POINTS'}
          </Button>
          
          <p className="text-xs text-center text-dream-foreground/60 mt-2">
            $POINTS Token launches today! Get ready to stake and earn PXB rewards.
          </p>
        </CardFooter>
      </Card>
    </div>;
};
export default PXBStakingPanel;