
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { ChevronDown, ChevronUp, BarChart2, Trophy, TrendingUp, TrendingDown, Sparkles, CircleDollarSign } from 'lucide-react';
import { fetchPoolConfig, TradingPosition } from '@/services/tradingService';
import { toast } from 'sonner';

const TradeGamePanel = () => {
  const { userProfile, participateInTradingPool, executeTradeInPool, withdrawFromPool } = usePXBPoints();
  const [poolConfig, setPoolConfig] = useState<{ pool_size: number }>({ pool_size: 0 });
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<{ initialPXB: number; currentPXB: number } | null>(null);
  const [activePanel, setActivePanel] = useState<'deposit' | 'trade' | 'withdraw'>('deposit');

  // Fetch pool config on mount
  useEffect(() => {
    const getPoolConfig = async () => {
      try {
        const config = await fetchPoolConfig();
        setPoolConfig(config);
      } catch (error) {
        console.error('Error fetching pool config:', error);
      }
    };
    
    getPoolConfig();
  }, []);

  // Function to handle deposit
  const handleDeposit = async () => {
    if (!userProfile) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (userProfile.pxbPoints < depositAmount) {
      toast.error('Insufficient PXB points');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await participateInTradingPool(depositAmount);
      
      if (result.success) {
        toast.success(result.message);
        if (result.position) {
          setPosition({
            initialPXB: result.position.initialPXB,
            currentPXB: result.position.currentPXB
          });
          setActivePanel('trade');
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error depositing to trading pool:', error);
      toast.error('Failed to deposit to trading pool');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle trading (up or down)
  const handleTrade = async (tradeType: 'up' | 'down') => {
    if (!position) {
      toast.error('No active trading position');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await executeTradeInPool(tradeType, position);
      
      if (result.success) {
        toast.success(result.message);
        if (result.newPosition) {
          setPosition({
            initialPXB: position.initialPXB,
            currentPXB: result.newPosition.currentPXB
          });
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(`Error executing ${tradeType} trade:`, error);
      toast.error(`Failed to execute ${tradeType} trade`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle withdrawal
  const handleWithdraw = async () => {
    if (!position) {
      toast.error('No active trading position');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await withdrawFromPool(position);
      
      if (result.success) {
        toast.success(result.message);
        setPosition(null);
        setActivePanel('deposit');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error withdrawing from trading pool:', error);
      toast.error('Failed to withdraw from trading pool');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-display flex items-center">
          <BarChart2 className="h-5 w-5 text-dream-accent1 mr-2" />
          PXB Trading Pool
        </CardTitle>
        <div className="text-xs text-dream-foreground/60">
          Current pool size: {poolConfig.pool_size.toLocaleString()} PXB
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trading position stats */}
        {position && (
          <div className="p-3 rounded-md bg-dream-background/30 border border-dream-accent1/20">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-dream-foreground/60">Your position</div>
              <div className="text-xs font-semibold">
                {((position.currentPXB - position.initialPXB) / position.initialPXB * 100).toFixed(2)}% {position.currentPXB >= position.initialPXB ? (
                  <span className="text-green-400">↑</span>
                ) : (
                  <span className="text-red-400">↓</span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-xs text-dream-foreground/60">Initial</div>
                <div className="font-medium">{position.initialPXB.toLocaleString()} PXB</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-dream-foreground/60">Current</div>
                <div className="font-medium">{position.currentPXB.toLocaleString()} PXB</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Panel tabs */}
        <div className="flex border-b border-dream-accent1/20">
          <button
            className={`flex-1 p-2 text-sm border-b-2 ${activePanel === 'deposit' ? 'border-dream-accent1 text-dream-accent1' : 'border-transparent text-dream-foreground/60'}`}
            onClick={() => setActivePanel('deposit')}
          >
            Deposit
          </button>
          <button
            className={`flex-1 p-2 text-sm border-b-2 ${activePanel === 'trade' ? 'border-dream-accent1 text-dream-accent1' : 'border-transparent text-dream-foreground/60'}`}
            onClick={() => setActivePanel('trade')}
            disabled={!position}
          >
            Trade
          </button>
          <button
            className={`flex-1 p-2 text-sm border-b-2 ${activePanel === 'withdraw' ? 'border-dream-accent1 text-dream-accent1' : 'border-transparent text-dream-foreground/60'}`}
            onClick={() => setActivePanel('withdraw')}
            disabled={!position}
          >
            Withdraw
          </button>
        </div>
        
        {/* Deposit panel */}
        {activePanel === 'deposit' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="depositAmount">Deposit Amount (PXB)</Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                min={1}
                className="mt-1"
              />
            </div>
            
            <div className="text-xs text-dream-foreground/60">
              <p>Trading in the PXB pool allows you to multiply your PXB points through simulated trading.</p>
              <p className="mt-1">The pool implements market-based volatility with potential to gain or lose PXB based on your trades.</p>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleDeposit}
              disabled={isLoading || !userProfile || userProfile.pxbPoints < depositAmount}
            >
              <CircleDollarSign className="h-4 w-4 mr-2" />
              Deposit to Trading Pool
            </Button>
          </div>
        )}
        
        {/* Trade panel */}
        {activePanel === 'trade' && (
          <div className="space-y-4">
            <div className="text-xs text-dream-foreground/60">
              <p>Choose a trading direction and watch your position fluctuate based on market conditions.</p>
              <p className="mt-1">Each trade has a chance to increase or decrease your position.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={() => handleTrade('up')}
                disabled={isLoading}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trade Up
              </Button>
              
              <Button 
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleTrade('down')}
                disabled={isLoading}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Trade Down
              </Button>
            </div>
          </div>
        )}
        
        {/* Withdraw panel */}
        {activePanel === 'withdraw' && (
          <div className="space-y-4">
            <div className="text-xs text-dream-foreground/60">
              <p>Ready to cash out your trading gains?</p>
              <p className="mt-1">Withdraw your current position and collect your PXB points.</p>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Withdraw from Pool
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeGamePanel;
