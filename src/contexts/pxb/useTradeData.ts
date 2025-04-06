
import { useState, useCallback } from 'react';
import { PXBTrade } from '@/types/pxb';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';

export const useTradeData = (userProfile: any) => {
  const [trades, setTrades] = useState<PXBTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { connected, publicKey } = useWallet();

  const fetchUserTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!connected || !publicKey || !userProfile) {
        console.log('Skipping fetch: Not connected or no user profile');
        setTrades([]);
        return;
      }
      
      console.log('Fetching trades for user:', userProfile.id, 'wallet:', publicKey.toString());
      
      // Get trades where the user is the trader
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*, tokens:tokenid(token_name, token_symbol)')
        .eq('userid', userProfile.id)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching user trades:', error);
        return;
      }
      
      console.log('Raw trades data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('No trades found for user in database');
        setTrades([]);
        return;
      }
      
      const formattedTrades: PXBTrade[] = (data as any[]).map((trade: any) => {
        const tokenName = trade.tokenname || trade.tokens?.token_name || 'Unknown Token';
        const tokenSymbol = trade.tokensymbol || trade.tokens?.token_symbol || 'UNKNOWN';
        
        return {
          id: trade.id,
          userId: trade.userid,
          tokenMint: trade.tokenid,
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          amount: trade.pxbamount,
          price: trade.price,
          quantity: trade.quantity,
          type: trade.type,
          timestamp: new Date(trade.timestamp).getTime(),
          createdAt: trade.timestamp
        };
      });
      
      console.log('Formatted trades:', formattedTrades);
      setTrades(formattedTrades);
    } catch (error) {
      console.error('Error in fetchUserTrades:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, userProfile]);

  return {
    trades,
    setTrades,
    fetchUserTrades,
    isLoading
  };
};
