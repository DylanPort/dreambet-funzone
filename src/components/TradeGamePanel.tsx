
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, ArrowDownRight, BarChart3, TrendingUp, TrendingDown, DollarSign, Wallet, Trophy, Shield, Coins } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { toast } from "sonner";
import { fetchPoolConfig, fetchTradingLeaderboard, fetchUserTradingPosition, TradingPosition, calculateWithdrawalAmount } from '@/services/tradingService';

interface PoolConfig {
  pool_size?: number;
}

const TradeGamePanel = () => {
  const { userProfile, participateInTradingPool, executeTradeInPool, withdrawFromPool } = usePXBPoints();
  const [poolSize, setPoolSize] = useState<number>(10000);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [userPosition, setUserPosition] = useState<{
    initialPXB: number;
    currentPXB: number;
    timestamp: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<TradingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTradingUp, setIsTradingUp] = useState(false);
  const [isTradingDown, setIsTradingDown] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load pool data
  useEffect(() => {
    const loadPoolData = async () => {
      try {
        const poolConfig = await fetchPoolConfig();
        if (poolConfig.pool_size) {
          setPoolSize(poolConfig.pool_size);
        }
        
        await loadLeaderboard();
      } catch (error) {
        console.error("Error loading pool data:", error);
      }
    };

    loadPoolData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadPoolData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load user position
  useEffect(() => {
    const loadUserPosition = async () => {
      if (!userProfile) return;
      
      try {
        const position = await fetchUserTradingPosition(userProfile.id);
        setUserPosition(position);
      } catch (error) {
        console.error("Error loading user position:", error);
      }
    };
    
    loadUserPosition();
  }, [userProfile]);

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await fetchTradingLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const handleDeposit = async () => {
    if (!userProfile) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (userProfile.pxbPoints < depositAmount) {
      toast.error("Insufficient PXB points");
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await participateInTradingPool(depositAmount);
      
      if (result.success) {
        toast.success(result.message);
        
        // Update local state
        setPoolSize(prevSize => prevSize + depositAmount);
        if (result.position) {
          setUserPosition({
            initialPXB: result.position.initialPXB,
            currentPXB: result.position.currentPXB,
            timestamp: result.position.timestamp
          });
        }
        
        // Refresh leaderboard
        await loadLeaderboard();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error depositing:", error);
      toast.error("Error depositing to pool");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeUp = async () => {
    if (!userProfile || !userPosition) {
      toast.error("Please deposit to the pool first");
      return;
    }

    try {
      setIsTradingUp(true);
      
      const result = await executeTradeInPool('up', userPosition);
      
      if (result.success) {
        toast.success(result.message);
        
        // Update user position
        if (result.newPosition) {
          setUserPosition({
            ...userPosition,
            currentPXB: result.newPosition.currentPXB
          });
        }
        
        // Refresh leaderboard
        await loadLeaderboard();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error trading up:", error);
      toast.error("Error executing trade");
    } finally {
      setIsTradingUp(false);
    }
  };

  const handleTradeDown = async () => {
    if (!userProfile || !userPosition) {
      toast.error("Please deposit to the pool first");
      return;
    }

    try {
      setIsTradingDown(true);
      
      const result = await executeTradeInPool('down', userPosition);
      
      if (result.success) {
        toast.error(result.message); // Using error toast because it's a loss
        
        // Update user position
        if (result.newPosition) {
          setUserPosition({
            ...userPosition,
            currentPXB: result.newPosition.currentPXB
          });
        }
        
        // Refresh leaderboard
        await loadLeaderboard();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error trading down:", error);
      toast.error("Error executing trade");
    } finally {
      setIsTradingDown(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userProfile || !userPosition) {
      toast.error("Please deposit to the pool first");
      return;
    }

    try {
      setIsWithdrawing(true);
      
      const result = await withdrawFromPool(userPosition);
      
      if (result.success) {
        toast.success(result.message);
        
        // Update local state
        setPoolSize(prevSize => prevSize - (result.amount || 0));
        setUserPosition(null);
        
        // Refresh leaderboard
        await loadLeaderboard();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error("Error withdrawing from pool");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const calculatePnL = (): number => {
    if (!userPosition) return 0;
    return ((userPosition.currentPXB - userPosition.initialPXB) / userPosition.initialPXB) * 100;
  };

  const formatPnL = (pnl: number): string => {
    return pnl >= 0 ? `+${pnl.toFixed(2)}%` : `${pnl.toFixed(2)}%`;
  };

  const getWithdrawalEstimate = () => {
    if (!userPosition) return null;
    
    return calculateWithdrawalAmount(userPosition.initialPXB, userPosition.currentPXB);
  };

  return (
    <Card className="w-full shadow-xl border border-dream-accent1/20 glass-panel bg-gradient-to-br from-black/80 to-slate-900/80">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-400" />
              PXB Trading Pool
            </CardTitle>
            <CardDescription className="text-dream-foreground/70">
              Trade PXB points in a trustless, decentralized pool
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-dream-accent1/20">
            <Wallet className="h-5 w-5 text-green-400" />
            <div>
              <div className="text-xs text-dream-foreground/70">Pool Size</div>
              <div className="font-bold text-green-400">{poolSize.toLocaleString()} PXB</div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={userPosition ? "trade" : "deposit"} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="deposit" disabled={isLoading}>
              <DollarSign className="h-4 w-4 mr-2" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="trade" disabled={!userPosition}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Trade
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            {!userPosition ? (
              <>
                <div className="bg-black/40 p-4 rounded-lg border border-dream-accent1/20 mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    How It Works
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-dream-foreground/70">
                    <li>Deposit PXB points to join the trading pool</li>
                    <li>Trade your position and grow your PXB balance</li>
                    <li>Withdraw anytime with dynamic payouts based on performance</li>
                    <li>Minimum 50% payout guaranteed, even on major losses</li>
                    <li>3% of withdrawals go to the PXB Liquidity Vault</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Deposit Amount</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        min={10}
                        className="bg-black/30"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setDepositAmount(100)}
                        className="bg-black/30 border-dream-accent1/20"
                      >
                        100
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDepositAmount(500)}
                        className="bg-black/30 border-dream-accent1/20"
                      >
                        500
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDepositAmount(1000)}
                        className="bg-black/30 border-dream-accent1/20"
                      >
                        1000
                      </Button>
                    </div>
                    <p className="text-xs text-dream-foreground/70 mt-1">
                      You'll receive {depositAmount} PXB trading points to start
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleDeposit}
                    disabled={isLoading || !userProfile || depositAmount < 10}
                  >
                    {isLoading ? "Processing..." : "Deposit and Start Trading"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-4">You already have an active position in the trading pool.</p>
                <Button onClick={() => document.getElementById('trade-tab')?.click()}>
                  Go to Trading
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trade" className="space-y-4">
            {userPosition ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20">
                    <div className="text-sm text-dream-foreground/70 mb-1">Initial Position</div>
                    <div className="text-xl font-bold text-purple-400">{userPosition.initialPXB} PXB</div>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20">
                    <div className="text-sm text-dream-foreground/70 mb-1">Current Position</div>
                    <div className="text-xl font-bold text-white">{userPosition.currentPXB} PXB</div>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20">
                    <div className="text-sm text-dream-foreground/70 mb-1">Profit/Loss</div>
                    <div className={`text-xl font-bold ${calculatePnL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPnL(calculatePnL())}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20 mb-4">
                  <h3 className="text-lg font-semibold mb-2">Trading Actions</h3>
                  <p className="text-sm text-dream-foreground/70 mb-4">
                    Choose a trading direction to simulate a trade. Each trade will randomly adjust your position.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleTradeUp}
                      disabled={isTradingUp || isTradingDown}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trade Up
                    </Button>
                    
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleTradeDown}
                      disabled={isTradingUp || isTradingDown}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Trade Down
                    </Button>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg border border-dream-accent1/20">
                  <h3 className="text-lg font-semibold mb-2">Withdrawal Estimate</h3>
                  
                  {userPosition && (
                    <div className="space-y-2 mb-4">
                      {getWithdrawalEstimate() && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-dream-foreground/70">Base Payout (Initial × PnL):</span>
                            <span className="font-medium">
                              {getWithdrawalEstimate()?.basePayout} PXB
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-dream-foreground/70">Minimum Guarantee (50%):</span>
                            <span className="font-medium">
                              {getWithdrawalEstimate()?.minimumGuarantee} PXB
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-dream-foreground/70">Maximum Cap (5x):</span>
                            <span className="font-medium">
                              {(userPosition.initialPXB * 5).toFixed(2)} PXB
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-dream-foreground/70">Vault Deduction (3%):</span>
                            <span className="font-medium text-dream-foreground/70">
                              -{getWithdrawalEstimate()?.vaultDeduction} PXB
                            </span>
                          </div>
                          
                          <div className="border-t border-dream-accent1/20 pt-2 flex justify-between">
                            <span className="font-semibold">Estimated Payout:</span>
                            <span className="font-bold text-purple-400">
                              {getWithdrawalEstimate()?.finalPayout} PXB
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? "Processing..." : "Withdraw From Pool"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="mb-4">You need to deposit PXB points first to start trading.</p>
                <Button onClick={() => document.getElementById('deposit-tab')?.click()}>
                  Go to Deposit
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="bg-black/40 p-4 rounded-lg border border-dream-accent1/20 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Trading Leaderboard
              </h3>
              <p className="text-sm text-dream-foreground/70 mb-2">
                Top performers in the PXB Trading Pool
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-dream-foreground/70 uppercase">
                    <tr>
                      <th className="px-2 py-3 text-left">Rank</th>
                      <th className="px-2 py-3 text-left">Trader</th>
                      <th className="px-2 py-3 text-right">Initial</th>
                      <th className="px-2 py-3 text-right">Current</th>
                      <th className="px-2 py-3 text-right">PnL %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? (
                      leaderboard.map((position, index) => (
                        <tr 
                          key={position.id} 
                          className={`
                            border-t border-dream-accent1/10 
                            ${position.userId === userProfile?.id ? 'bg-purple-900/20' : ''}
                          `}
                        >
                          <td className="px-2 py-3 font-medium">
                            {index === 0 ? (
                              <div className="flex items-center">
                                <Trophy className="h-4 w-4 text-yellow-400 mr-1" />
                                {index + 1}
                              </div>
                            ) : (
                              index + 1
                            )}
                          </td>
                          <td className="px-2 py-3 font-medium">
                            {position.username}
                            {position.userId === userProfile?.id && (
                              <span className="text-xs ml-1 text-purple-400">(You)</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right">{position.initialPXB}</td>
                          <td className="px-2 py-3 text-right">{position.currentPXB}</td>
                          <td className={`px-2 py-3 text-right font-medium ${position.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.percentChange >= 0 ? `+${position.percentChange}%` : `${position.percentChange}%`}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-2 py-3 text-center text-dream-foreground/70">
                          No traders in the pool yet. Be the first!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t border-dream-accent1/20 pt-4">
        <div className="text-xs text-dream-foreground/70 w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-dream-foreground/70" />
            <span>Trade simulated market movements with PXB points</span>
          </div>
          <Button 
            variant="link" 
            className="text-dream-foreground/70 p-0 h-auto text-xs"
            onClick={() => loadLeaderboard()}
          >
            Refresh data
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TradeGamePanel;
