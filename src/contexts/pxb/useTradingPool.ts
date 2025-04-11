
import { useState } from 'react';
import { UserProfile } from '@/types/pxb';
import { 
  depositToTradingPool, 
  executeTrade, 
  withdrawFromTradingPool 
} from '@/services/tradingService';

export const useTradingPool = (
  userProfile: UserProfile | null,
  fetchUserProfile: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Participate in the trading pool by depositing PXB points
   */
  const participateInTradingPool = async (amount: number) => {
    try {
      if (!userProfile) {
        return { success: false, message: "Please connect your wallet first" };
      }

      setIsProcessing(true);
      
      // Implementation of deposit to trading pool
      const reducePXBPoints = async (amount: number) => {
        // Fetch the latest profile to ensure we have the most up-to-date point balance
        await fetchUserProfile();
        
        // Update the user's PXB points (this will be handled by the trading service)
        return;
      };
      
      const result = await depositToTradingPool(userProfile, amount, reducePXBPoints);
      
      // Refresh user profile to reflect updated point balance
      await fetchUserProfile();
      
      return result;
    } catch (error) {
      console.error("Error participating in trading pool:", error);
      return { success: false, message: "Failed to join trading pool. Please try again." };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Execute a trade in the trading pool (up or down)
   */
  const executeTradeInPool = async (
    tradeType: 'up' | 'down',
    position: { initialPXB: number; currentPXB: number }
  ) => {
    try {
      if (!userProfile) {
        return { success: false, message: "Please connect your wallet first" };
      }

      setIsProcessing(true);
      
      const result = await executeTrade(userProfile, tradeType, position);
      
      return result;
    } catch (error) {
      console.error("Error executing trade:", error);
      return { success: false, message: "Failed to execute trade. Please try again." };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Withdraw from the trading pool
   */
  const withdrawFromPool = async (position: { initialPXB: number; currentPXB: number }) => {
    try {
      if (!userProfile) {
        return { success: false, message: "Please connect your wallet first" };
      }

      setIsProcessing(true);
      
      // Implementation of withdrawal from trading pool
      const addPXBPoints = async (amount: number) => {
        // Fetch the latest profile to ensure we have the most up-to-date point balance
        await fetchUserProfile();
        
        // Update the user's PXB points (this will be handled by the trading service)
        return;
      };
      
      const result = await withdrawFromTradingPool(userProfile, position, addPXBPoints);
      
      // Refresh user profile to reflect updated point balance
      await fetchUserProfile();
      
      return result;
    } catch (error) {
      console.error("Error withdrawing from trading pool:", error);
      return { success: false, message: "Failed to withdraw from trading pool. Please try again." };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    participateInTradingPool,
    executeTradeInPool,
    withdrawFromPool,
    isProcessing
  };
};
