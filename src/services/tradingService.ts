
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/pxb';
import { invalidateTradingPoolData, handleTradingError } from './queryClient';
import { toast } from 'sonner';

// Trading pool configuration
const TRADING_CONFIG = {
  // Constants from the design document
  CAP_MULTIPLIER: 5, // Maximum 5x payout
  MINIMUM_GUARANTEE: 0.5, // 50% minimum payout
  VAULT_RATE: 0.03, // 3% vault fee
  FEATURE_NAME: 'trading_pool'
};

// Interface for trading positions
export interface TradingPosition {
  id: string;
  userId: string;
  username: string;
  initialPXB: number;
  currentPXB: number;
  percentChange: number;
  timestamp: string;
}

// Interface for pool configuration
export interface PoolConfig {
  pool_size: number;
  vault_balance?: number;
  cap_multiplier?: number;
  minimum_guarantee?: number;
  vault_rate?: number;
}

/**
 * Fetches the current trading pool configuration
 */
export const fetchPoolConfig = async (): Promise<PoolConfig> => {
  try {
    const { data, error } = await supabase
      .from('app_features')
      .select('config')
      .eq('feature_name', TRADING_CONFIG.FEATURE_NAME)
      .single();
      
    if (error) {
      throw error;
    }
    
    // Default configuration
    const defaultConfig: PoolConfig = {
      pool_size: 10000,
      vault_balance: 0,
      cap_multiplier: TRADING_CONFIG.CAP_MULTIPLIER,
      minimum_guarantee: TRADING_CONFIG.MINIMUM_GUARANTEE,
      vault_rate: TRADING_CONFIG.VAULT_RATE
    };
    
    // Merge with stored configuration
    if (data?.config) {
      // Handle JSON data coming from Supabase
      if (typeof data.config === 'string') {
        try {
          // If it's a string, parse it
          const parsedConfig = JSON.parse(data.config);
          return { ...defaultConfig, ...parsedConfig };
        } catch (e) {
          console.error("Error parsing config:", e);
          return defaultConfig;
        }
      } else if (typeof data.config === 'object') {
        // If it's already an object, cast and merge
        const configObj = data.config as Record<string, any>;
        
        return { 
          ...defaultConfig, 
          pool_size: configObj.pool_size || defaultConfig.pool_size,
          vault_balance: configObj.vault_balance || defaultConfig.vault_balance,
          cap_multiplier: configObj.cap_multiplier || defaultConfig.cap_multiplier,
          minimum_guarantee: configObj.minimum_guarantee || defaultConfig.minimum_guarantee,
          vault_rate: configObj.vault_rate || defaultConfig.vault_rate
        };
      }
    }
    
    return defaultConfig;
  } catch (error) {
    console.error("Error fetching pool config:", error);
    return { pool_size: 10000 }; // Fallback
  }
};

/**
 * Updates the trading pool configuration
 */
export const updatePoolConfig = async (config: Partial<PoolConfig>): Promise<boolean> => {
  try {
    // Get current config first
    const currentConfig = await fetchPoolConfig();
    
    // Merge with updates
    const updatedConfig = { ...currentConfig, ...config };
    
    // Convert to a JSON object for storage
    const configForStorage = {
      pool_size: updatedConfig.pool_size,
      vault_balance: updatedConfig.vault_balance,
      cap_multiplier: updatedConfig.cap_multiplier,
      minimum_guarantee: updatedConfig.minimum_guarantee,
      vault_rate: updatedConfig.vault_rate
    };
    
    const { error } = await supabase
      .from('app_features')
      .update({ 
        config: configForStorage
      })
      .eq('feature_name', TRADING_CONFIG.FEATURE_NAME);
      
    if (error) {
      throw error;
    }
    
    invalidateTradingPoolData();
    return true;
  } catch (error) {
    console.error("Error updating pool config:", error);
    return false;
  }
};

/**
 * Deposits PXB into the trading pool
 */
export const depositToTradingPool = async (
  userProfile: UserProfile,
  amount: number,
  reducePXBPoints: (amount: number) => Promise<void>
): Promise<{ success: boolean; message: string; position?: TradingPosition }> => {
  try {
    if (!userProfile) {
      return { success: false, message: "Please connect your wallet first" };
    }

    if (userProfile.pxbPoints < amount) {
      return { success: false, message: "Insufficient PXB points" };
    }

    // Get current pool configuration
    const poolConfig = await fetchPoolConfig();
    
    // Record the deposit transaction
    const { data, error } = await supabase
      .from('token_transactions')
      .insert({
        tokenid: 'pxb_pool',
        tokenname: 'PXB Trading Pool',
        tokensymbol: 'PXBPOOL',
        quantity: amount,
        pxbamount: amount,
        price: 1,
        type: 'pool_deposit',
        userid: userProfile.id
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Deduct PXB points from user using the provided function
    await reducePXBPoints(amount);
    
    // Update pool size
    const newPoolSize = (poolConfig.pool_size || 10000) + amount;
    await updatePoolConfig({ pool_size: newPoolSize });
    
    // Create user position
    const position: TradingPosition = {
      id: data?.id || '',
      userId: userProfile.id,
      username: userProfile.username || 'Unknown',
      initialPXB: amount,
      currentPXB: amount,
      percentChange: 0,
      timestamp: new Date().toISOString()
    };
    
    invalidateTradingPoolData();
    return { 
      success: true, 
      message: `Successfully deposited ${amount} PXB into the trading pool`,
      position
    };
  } catch (error) {
    return handleTradingError(error, 'Deposit to trading pool');
  }
};

/**
 * Executes a trade in the trading pool (up or down)
 */
export const executeTrade = async (
  userProfile: UserProfile,
  tradeType: 'up' | 'down',
  currentPosition: { initialPXB: number; currentPXB: number }
): Promise<{ success: boolean; message: string; newPosition?: { currentPXB: number, percentChange: number } }> => {
  try {
    if (!userProfile || !currentPosition) {
      return { success: false, message: "No active trading position found" };
    }

    // Calculate trade outcome based on trade type
    let percentChange: number;
    let changeAmount: number;
    
    if (tradeType === 'up') {
      // Random gain between 5% and 20%
      percentChange = 5 + Math.random() * 15;
      changeAmount = currentPosition.currentPXB * (percentChange / 100);
    } else {
      // Random loss between 2% and 15%
      percentChange = 2 + Math.random() * 13;
      changeAmount = -currentPosition.currentPXB * (percentChange / 100);
    }
    
    const newAmount = currentPosition.currentPXB + changeAmount;
    
    // Record the trade in token_transactions
    await supabase
      .from('token_transactions')
      .insert({
        tokenid: 'pxb_pool',
        tokenname: 'PXB Trading Pool',
        tokensymbol: 'PXBPOOL',
        quantity: Math.abs(changeAmount),
        pxbamount: Math.abs(changeAmount),
        price: 1,
        type: tradeType === 'up' ? 'pool_trade_up' : 'pool_trade_down',
        userid: userProfile.id
      });
    
    const totalPercentChange = ((newAmount - currentPosition.initialPXB) / currentPosition.initialPXB) * 100;
    
    invalidateTradingPoolData();
    return { 
      success: true, 
      message: tradeType === 'up' 
        ? `Trade successful! Gained ${changeAmount.toFixed(2)} PXB (+${percentChange.toFixed(2)}%)`
        : `Trade resulted in a loss of ${Math.abs(changeAmount).toFixed(2)} PXB (-${percentChange.toFixed(2)}%)`,
      newPosition: {
        currentPXB: parseFloat(newAmount.toFixed(2)),
        percentChange: parseFloat(totalPercentChange.toFixed(2))
      }
    };
  } catch (error) {
    return handleTradingError(error, `Execute ${tradeType} trade`);
  }
};

/**
 * Calculates withdrawal amounts based on trading performance
 */
export const calculateWithdrawalAmount = (
  initialPXB: number,
  currentPXB: number,
  config: PoolConfig = {
    pool_size: 10000,
    cap_multiplier: TRADING_CONFIG.CAP_MULTIPLIER,
    minimum_guarantee: TRADING_CONFIG.MINIMUM_GUARANTEE,
    vault_rate: TRADING_CONFIG.VAULT_RATE
  }
): {
  basePayout: number;
  minimumGuarantee: number;
  cappedPayout: number;
  vaultDeduction: number;
  finalPayout: number;
} => {
  // Calculate PnL percentage
  const pnlPercent = (currentPXB - initialPXB) / initialPXB;
  
  // Base payout formula: B_i = D_i × (1 + PnL_i %)
  const basePayout = initialPXB * (1 + pnlPercent);
  
  // Apply minimum guarantee (default 50% of initial deposit)
  const minimumGuarantee = initialPXB * (config.minimum_guarantee || TRADING_CONFIG.MINIMUM_GUARANTEE);
  const guaranteedPayout = Math.max(basePayout, minimumGuarantee);
  
  // Apply cap (default maximum 5x initial deposit)
  const capMultiplier = config.cap_multiplier || TRADING_CONFIG.CAP_MULTIPLIER;
  const cappedPayout = Math.min(guaranteedPayout, initialPXB * capMultiplier);
  
  // Apply vault deduction (default 3%)
  const vaultRate = config.vault_rate || TRADING_CONFIG.VAULT_RATE;
  const vaultDeduction = cappedPayout * vaultRate;
  const finalPayout = cappedPayout * (1 - vaultRate);
  
  return {
    basePayout: parseFloat(basePayout.toFixed(2)),
    minimumGuarantee: parseFloat(minimumGuarantee.toFixed(2)),
    cappedPayout: parseFloat(cappedPayout.toFixed(2)),
    vaultDeduction: parseFloat(vaultDeduction.toFixed(2)),
    finalPayout: parseFloat(finalPayout.toFixed(2))
  };
};

/**
 * Withdraws funds from the trading pool based on performance
 */
export const withdrawFromTradingPool = async (
  userProfile: UserProfile,
  position: { initialPXB: number; currentPXB: number },
  addPXBPoints: (amount: number) => Promise<void>
): Promise<{ success: boolean; message: string; amount?: number }> => {
  try {
    if (!userProfile || !position) {
      return { success: false, message: "No active trading position found" };
    }

    // Get current pool configuration
    const poolConfig = await fetchPoolConfig();
    
    // Calculate withdrawal amounts
    const withdrawal = calculateWithdrawalAmount(position.initialPXB, position.currentPXB, poolConfig);
    
    // Ensure pool has enough funds for the withdrawal
    if (withdrawal.cappedPayout > poolConfig.pool_size) {
      // Apply solvency adjustment if needed
      const adjustmentFactor = poolConfig.pool_size / withdrawal.cappedPayout;
      withdrawal.cappedPayout = withdrawal.cappedPayout * adjustmentFactor;
      withdrawal.vaultDeduction = withdrawal.cappedPayout * (poolConfig.vault_rate || TRADING_CONFIG.VAULT_RATE);
      withdrawal.finalPayout = withdrawal.cappedPayout * (1 - (poolConfig.vault_rate || TRADING_CONFIG.VAULT_RATE));
    }
    
    // Create a withdrawal record
    await supabase
      .from('token_transactions')
      .insert({
        tokenid: 'pxb_pool',
        tokenname: 'PXB Trading Pool',
        tokensymbol: 'PXBPOOL',
        quantity: position.currentPXB,
        pxbamount: withdrawal.finalPayout,
        price: 1,
        type: 'pool_withdraw',
        userid: userProfile.id
      });
    
    // Update pool configuration
    const newPoolSize = poolConfig.pool_size - withdrawal.cappedPayout;
    const newVaultBalance = (poolConfig.vault_balance || 0) + withdrawal.vaultDeduction;
    await updatePoolConfig({ 
      pool_size: Math.max(0, newPoolSize),
      vault_balance: newVaultBalance
    });
    
    // Add PXB points to user using the provided function
    await addPXBPoints(Math.round(withdrawal.finalPayout));
    
    invalidateTradingPoolData();
    return { 
      success: true, 
      message: `Successfully withdrawn ${withdrawal.finalPayout.toFixed(2)} PXB from the trading pool`,
      amount: withdrawal.finalPayout
    };
  } catch (error) {
    return handleTradingError(error, 'Withdraw from trading pool');
  }
};

/**
 * Fetches the trading leaderboard
 */
export const fetchTradingLeaderboard = async (): Promise<TradingPosition[]> => {
  try {
    // First get all users with pool deposits
    const { data: depositsData, error: depositsError } = await supabase
      .from('token_transactions')
      .select('userid, quantity, timestamp')
      .eq('type', 'pool_deposit');
    
    if (depositsError) {
      throw depositsError;
    }

    if (!depositsData || depositsData.length === 0) {
      return [];
    }

    // Get user details
    const userIds = depositsData.map(d => d.userid);
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);
    
    if (usersError) {
      throw usersError;
    }

    // Get trading activities
    const { data: tradingData, error: tradingError } = await supabase
      .from('token_transactions')
      .select('userid, type, timestamp')
      .in('type', ['pool_trade_up', 'pool_trade_down'])
      .in('userid', userIds);
    
    if (tradingError) {
      throw tradingError;
    }

    // Get withdrawals to filter out users who've already withdrawn
    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('token_transactions')
      .select('userid')
      .eq('type', 'pool_withdraw')
      .in('userid', userIds);
    
    if (withdrawalsError) {
      throw withdrawalsError;
    }
    
    // Filter out users who have already withdrawn
    const withdrawnUserIds = withdrawalsData?.map(w => w.userid) || [];
    const activeUserIds = userIds.filter(id => !withdrawnUserIds.includes(id));
    
    // Calculate positions for active users
    const positions = depositsData
      .filter(deposit => activeUserIds.includes(deposit.userid))
      .map(deposit => {
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
          userId: deposit.userid,
          username: user?.username || 'Unknown',
          initialPXB: deposit.quantity,
          currentPXB: parseFloat(currentPXB.toFixed(2)),
          percentChange: parseFloat(percentChange.toFixed(2)),
          timestamp: deposit.timestamp
        };
      });
    
    // Sort by percent change
    return positions.sort((a, b) => b.percentChange - a.percentChange);
  } catch (error) {
    console.error("Error fetching trading leaderboard:", error);
    return [];
  }
};

/**
 * Fetches a user's current trading position
 */
export const fetchUserTradingPosition = async (userId: string): Promise<{
  initialPXB: number;
  currentPXB: number;
  timestamp: string;
} | null> => {
  try {
    if (!userId) return null;
    
    // Check if user has already withdrawn
    const { data: withdrawalData } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('userid', userId)
      .eq('type', 'pool_withdraw')
      .order('timestamp', { ascending: false })
      .limit(1);
      
    if (withdrawalData && withdrawalData.length > 0) {
      // User has already withdrawn
      return null;
    }
    
    // Get user's deposit
    const { data: depositData, error: depositError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('userid', userId)
      .eq('type', 'pool_deposit')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (depositError || !depositData || depositData.length === 0) {
      return null;
    }

    // Get user's trading activities
    const { data: tradingData, error: tradingError } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('userid', userId)
      .in('type', ['pool_trade_up', 'pool_trade_down'])
      .order('timestamp', { ascending: true });
      
    if (tradingError) {
      throw tradingError;
    }
    
    // Calculate current PXB
    let currentPXB = depositData[0].quantity;
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
    
    return {
      initialPXB: depositData[0].quantity,
      currentPXB: parseFloat(currentPXB.toFixed(2)),
      timestamp: depositData[0].timestamp
    };
  } catch (error) {
    console.error("Error fetching user trading position:", error);
    return null;
  }
};

/**
 * Distributes vault rewards to eligible PXB holders
 */
export const distributeVaultRewards = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Get pool configuration with vault balance
    const poolConfig = await fetchPoolConfig();
    
    // If vault balance is less than 100, don't distribute yet
    if (!poolConfig.vault_balance || poolConfig.vault_balance < 100) {
      return { success: false, message: "Vault balance is too low for distribution" };
    }
    
    // Get all PXB holders (users with points > 0)
    const { data: holders, error: holdersError } = await supabase
      .from('users')
      .select('id, username, points')
      .gt('points', 0);
      
    if (holdersError) {
      throw holdersError;
    }
    
    if (!holders || holders.length === 0) {
      return { success: false, message: "No eligible PXB holders found" };
    }
    
    // Calculate total PXB points in circulation
    const totalPoints = holders.reduce((sum, holder) => sum + holder.points, 0);
    
    // Distribute vault rewards proportionally
    for (const holder of holders) {
      // Calculate holder's share
      const share = holder.points / totalPoints;
      const rewardAmount = Math.floor(poolConfig.vault_balance * share);
      
      if (rewardAmount > 0) {
        // Add points to user
        await supabase
          .from('users')
          .update({ points: holder.points + rewardAmount })
          .eq('id', holder.id);
          
        // Record in points history
        await supabase.from('points_history').insert({
          user_id: holder.id,
          amount: rewardAmount,
          action: 'vault_reward',
          reference_id: 'vault_distribution'
        });
      }
    }
    
    // Reset vault balance
    await updatePoolConfig({ vault_balance: 0 });
    
    return { 
      success: true, 
      message: `Successfully distributed ${poolConfig.vault_balance} PXB from the vault to ${holders.length} holders`
    };
  } catch (error) {
    return handleTradingError(error, 'Distribute vault rewards');
  }
};

/**
 * Initializes the trading pool feature if it doesn't exist
 */
export const initializeTradingPool = async (): Promise<void> => {
  try {
    // Check if trading pool feature exists
    const { data, error } = await supabase
      .from('app_features')
      .select('id')
      .eq('feature_name', TRADING_CONFIG.FEATURE_NAME)
      .maybeSingle();
      
    if (error) {
      throw error;
    }
    
    // If it doesn't exist, create it
    if (!data) {
      const initialConfig = {
        pool_size: 10000,
        vault_balance: 0,
        cap_multiplier: TRADING_CONFIG.CAP_MULTIPLIER,
        minimum_guarantee: TRADING_CONFIG.MINIMUM_GUARANTEE,
        vault_rate: TRADING_CONFIG.VAULT_RATE
      };
      
      await supabase
        .from('app_features')
        .insert({
          feature_name: TRADING_CONFIG.FEATURE_NAME,
          config: initialConfig,
          is_active: true,
          end_date: '2099-12-31' // Set a far future end date
        });
        
      console.log("Trading pool feature initialized with default configuration");
    }
  } catch (error) {
    console.error("Error initializing trading pool:", error);
  }
};

// Initialize the trading pool feature when this module is imported
initializeTradingPool();
