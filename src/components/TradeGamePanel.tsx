
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, ArrowDownRight, BarChart3, TrendingUp, TrendingDown, DollarSign, Wallet, Trophy, Shield, Coins } from 'lucide-react';
import { usePXBPoints } from '@/contexts/pxb/PXBPointsContext';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface TraderPosition {
  id: string;
  username: string;
  initialPXB: number;
  currentPXB: number;
  percentChange: number;
  timestamp: string;
}

interface PoolConfig {
  pool_size?: number;
}

const TradeGamePanel = () => {
  const { userProfile, mintPoints, placeBet, addPointsToUser } = usePXBPoints();
  const [poolSize, setPoolSize] = useState<number>(10000);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [userPosition, setUserPosition] = useState<{
    initialPXB: number;
    currentPXB: number;
    timestamp: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<TraderPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTradingUp, setIsTradingUp] = useState(false);
  const [isTradingDown, setIsTradingDown] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load pool data
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const { data: poolData, error } = await supabase
          .from('app_features')
          .select('config')
          .eq('feature_name', 'trading_pool')
          .single();
        
        if (error) {
          console.error("Error fetching pool data:", error);
          return;
        }

        // Type check before accessing pool_size
        if (poolData?.config && typeof poolData.config === 'object') {
          const config = poolData.config as PoolConfig;
          if (config.pool_size !== undefined) {
            setPoolSize(config.pool_size);
          }
        }
      } catch (error) {
        console.error("Error in fetchPoolData:", error);
      }
    };

    fetchPoolData();
    fetchLeaderboard();
  }, []);

  // Load user position
  useEffect(() => {
    if (userProfile) {
      const fetchUserPosition = async () => {
        try {
          const { data, error } = await supabase
            .from('token_transactions')
            .select('*')
            .eq('userid', userProfile.id)
            .eq('type', 'pool_deposit')
            .order('timestamp', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error("Error fetching user position:", error);
            return;
          }

          if (data && data.length > 0) {
            // Get the most recent deposit
            const deposit = data[0];
            
            // Also fetch any trading activities
            const { data: tradingData, error: tradingError } = await supabase
              .from('token_transactions')
              .select('*')
              .eq('userid', userProfile.id)
              .in('type', ['pool_trade_up', 'pool_trade_down'])
              .order('timestamp', { ascending: false });
              
            if (tradingError) {
              console.error("Error fetching trading data:", tradingError);
              return;
            }
            
            // Calculate current PXB
            let currentPXB = deposit.quantity;
            if (tradingData && tradingData.length > 0) {
              // Apply each trade's effect
              tradingData.forEach(trade => {
                if (trade.type === 'pool_trade_up') {
                  // Random gain between 5% and 20%
                  const percentGain = 5 + Math.random() * 15;
                  currentPXB += (currentPXB * (percentGain / 100));
                } else if (trade.type === 'pool_trade_down') {
                  // Random loss between 2% and 15%
                  const percentLoss = 2 + Math.random() * 13;
                  currentPXB -= (currentPXB * (percentLoss / 100));
                }
              });
            }
            
            setUserPosition({
              initialPXB: deposit.quantity,
              currentPXB: parseFloat(currentPXB.toFixed(2)),
              timestamp: deposit.timestamp
            });
          }
        } catch (error) {
          console.error("Error in fetchUserPosition:", error);
        }
      };

      fetchUserPosition();
    }
  }, [userProfile]);

  const fetchLeaderboard = async () => {
    try {
      // First get all users with pool deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('token_transactions')
        .select('userid, quantity, timestamp')
        .eq('type', 'pool_deposit');
      
      if (depositsError) {
        console.error("Error fetching deposits:", depositsError);
        return;
      }

      // Get user details
      const userIds = depositsData?.map(d => d.userid) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        return;
      }

      // Get trading activities
      const { data: tradingData, error: tradingError } = await supabase
        .from('token_transactions')
        .select('userid, type, timestamp')
        .in('type', ['pool_trade_up', 'pool_trade_down'])
        .in('userid', userIds);
      
      if (tradingError) {
        console.error("Error fetching trading data:", tradingError);
        return;
      }

      // Calculate positions
      const positions = depositsData?.map(deposit => {
        const user = usersData?.find(u => u.id === deposit.userid);
        const userTrades = tradingData?.filter(t => t.userid === deposit.userid) || [];
        
        // Calculate current PXB with trades
        let currentPXB = deposit.quantity;
        userTrades.forEach(trade => {
          if (trade.type === 'pool_trade_up') {
            // Random gain between 5% and 20%
            const percentGain = 5 + Math.random() * 15;
            currentPXB += (currentPXB * (percentGain / 100));
          } else if (trade.type === 'pool_trade_down') {
            // Random loss between 2% and 15%
            const percentLoss = 2 + Math.random() * 13;
            currentPXB -= (currentPXB * (percentLoss / 100));
          }
        });
        
        const percentChange = ((currentPXB - deposit.quantity) / deposit.quantity) * 100;
        
        return {
          id: deposit.userid,
          username: user?.username || 'Unknown',
          initialPXB: deposit.quantity,
          currentPXB: parseFloat(currentPXB.toFixed(2)),
          percentChange: parseFloat(percentChange.toFixed(2)),
          timestamp: deposit.timestamp
        };
      }) || [];
      
      // Sort by percent change
      const sortedPositions = positions.sort((a, b) => b.percentChange - a.percentChange);
      setLeaderboard(sortedPositions.slice(0, 10));
    } catch (error) {
      console.error("Error in fetchLeaderboard:", error);
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
      
      // Record the deposit in token_transactions
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          tokenid: 'pxb_pool',
          tokenname: 'PXB Trading Pool',
          tokensymbol: 'PXBPOOL',
          quantity: depositAmount,
          pxbamount: depositAmount,
          price: 1,
          type: 'pool_deposit',
          userid: userProfile.id
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Deduct PXB points from user
      await placeBet(
        'pxb_pool',
        'PXB Trading Pool',
        'PXBPOOL',
        depositAmount,
        'up',
        0,
        0
      );
      
      // Update pool size
      const { error: poolError } = await supabase
        .from('app_features')
        .update({ 
          config: { pool_size: poolSize + depositAmount } 
        })
        .eq('feature_name', 'trading_pool');
        
      if (poolError) {
        console.error("Error updating pool size:", poolError);
      }
      
      // Update local state
      setPoolSize(prevSize => prevSize + depositAmount);
      setUserPosition({
        initialPXB: depositAmount,
        currentPXB: depositAmount,
        timestamp: new Date().toISOString()
      });
      
      toast.success(`Successfully deposited ${depositAmount} PXB into the trading pool`);
      fetchLeaderboard();
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
      
      // Random gain between 5% and 20%
      const percentGain = 5 + Math.random() * 15;
      const gainAmount = userPosition.currentPXB * (percentGain / 100);
      const newTotal = userPosition.currentPXB + gainAmount;
      
      // Record the trade in token_transactions
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          tokenid: 'pxb_pool',
          tokenname: 'PXB Trading Pool',
          tokensymbol: 'PXBPOOL',
          quantity: gainAmount,
          pxbamount: gainAmount,
          price: 1,
          type: 'pool_trade_up',
          userid: userProfile.id
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update user position
      setUserPosition({
        ...userPosition,
        currentPXB: parseFloat(newTotal.toFixed(2))
      });
      
      toast.success(`Trade successful! Gained ${gainAmount.toFixed(2)} PXB (+${percentGain.toFixed(2)}%)`);
      fetchLeaderboard();
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
      
      // Random loss between 2% and 15%
      const percentLoss = 2 + Math.random() * 13;
      const lossAmount = userPosition.currentPXB * (percentLoss / 100);
      const newTotal = userPosition.currentPXB - lossAmount;
      
      // Record the trade in token_transactions
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          tokenid: 'pxb_pool',
          tokenname: 'PXB Trading Pool',
          tokensymbol: 'PXBPOOL',
          quantity: lossAmount,
          pxbamount: lossAmount,
          price: 1,
          type: 'pool_trade_down',
          userid: userProfile.id
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update user position
      setUserPosition({
        ...userPosition,
        currentPXB: parseFloat(newTotal.toFixed(2))
      });
      
      toast.error(`Trade resulted in a loss of ${lossAmount.toFixed(2)} PXB (-${percentLoss.toFixed(2)}%)`);
      fetchLeaderboard();
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
      
      // Calculate payout based on PnL with minimum guarantee
      const pnlPercent = (userPosition.currentPXB - userPosition.initialPXB) / userPosition.initialPXB;
      
      // Base payout formula: B_i = D_i × (1 + PnL_i %)
      let basePayout = userPosition.initialPXB * (1 + pnlPercent);
      
      // Apply minimum guarantee (50% of initial deposit)
      const minimumGuarantee = userPosition.initialPXB * 0.5;
      basePayout = Math.max(basePayout, minimumGuarantee);
      
      // Apply cap (maximum 5x initial deposit)
      const cappedPayout = Math.min(basePayout, userPosition.initialPXB * 5);
      
      // Apply vault deduction (3%)
      const vaultDeduction = cappedPayout * 0.03;
      const finalPayout = cappedPayout * 0.97;
      
      // Create a withdrawal record
      const { data, error } = await supabase
        .from('token_transactions')
        .insert({
          tokenid: 'pxb_pool',
          tokenname: 'PXB Trading Pool',
          tokensymbol: 'PXBPOOL',
          quantity: userPosition.currentPXB,
          pxbamount: finalPayout,
          price: 1,
          type: 'pool_withdraw',
          userid: userProfile.id
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update pool size
      const newPoolSize = poolSize - cappedPayout;
      const { error: poolError } = await supabase
        .from('app_features')
        .update({ 
          config: { pool_size: newPoolSize } 
        })
        .eq('feature_name', 'trading_pool');
        
      if (poolError) {
        console.error("Error updating pool size:", poolError);
      }
      
      // Add PXB points to user
      await addPointsToUser(Math.round(finalPayout));
      
      // Update local state
      setPoolSize(newPoolSize);
      setUserPosition(null);
      
      toast.success(`Successfully withdrawn ${finalPayout.toFixed(2)} PXB from the trading pool`);
      fetchLeaderboard();
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
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dream-foreground/70">Base Payout (Initial × PnL):</span>
                      <span className="font-medium">
                        {(userPosition.initialPXB * (1 + calculatePnL()/100)).toFixed(2)} PXB
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-dream-foreground/70">Minimum Guarantee (50%):</span>
                      <span className="font-medium">
                        {(userPosition.initialPXB * 0.5).toFixed(2)} PXB
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
                        -{(Math.min(Math.max(userPosition.initialPXB * (1 + calculatePnL()/100), userPosition.initialPXB * 0.5), userPosition.initialPXB * 5) * 0.03).toFixed(2)} PXB
                      </span>
                    </div>
                    
                    <div className="border-t border-dream-accent1/20 pt-2 flex justify-between">
                      <span className="font-semibold">Estimated Payout:</span>
                      <span className="font-bold text-purple-400">
                        {(Math.min(Math.max(userPosition.initialPXB * (1 + calculatePnL()/100), userPosition.initialPXB * 0.5), userPosition.initialPXB * 5) * 0.97).toFixed(2)} PXB
                      </span>
                    </div>
                  </div>
                  
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
                            ${position.id === userProfile?.id ? 'bg-purple-900/20' : ''}
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
                            {position.id === userProfile?.id && (
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
            onClick={() => fetchLeaderboard()}
          >
            Refresh data
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TradeGamePanel;
