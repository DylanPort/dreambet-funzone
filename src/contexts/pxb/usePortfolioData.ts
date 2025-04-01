
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getUserTokenPortfolio, 
  getUserTokenTransactions,
  TokenPortfolio,
  TokenTransaction
} from '@/services/tokenTradingService';

export const usePortfolioData = (userProfile: any) => {
  const [portfolio, setPortfolio] = useState<TokenPortfolio[]>([]);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const fetchUserPortfolio = useCallback(async () => {
    if (!userProfile) return;
    
    setIsLoadingPortfolio(true);
    try {
      const portfolioData = await getUserTokenPortfolio(userProfile.id);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [userProfile]);

  const fetchUserTransactions = useCallback(async (tokenId?: string) => {
    if (!userProfile) return;
    
    setIsLoadingTransactions(true);
    try {
      const transactionData = await getUserTokenTransactions(userProfile.id, tokenId);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [userProfile]);

  return {
    portfolio,
    transactions,
    isLoadingPortfolio,
    isLoadingTransactions,
    fetchUserPortfolio,
    fetchUserTransactions
  };
};
