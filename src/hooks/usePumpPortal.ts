
import { useEffect, useState } from 'react';
import pumpPortalService from '@/services/pumpPortalService';
import { Token } from '@/types/bet';
import { supabase } from '@/integrations/supabase/client';

export function usePumpPortal() {
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize connection and set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Load initial tokens from Supabase
    const loadTokens = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('tokens')
          .select('*')
          .order('last_updated_time', { ascending: false });
        
        if (data) {
          setTokens(data);
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to token updates
    const handleTokenCreated = (data: any) => {
      loadTokens(); // Reload tokens when a new one is created
    };

    const handleTrade = (data: any) => {
      if (!data.mint || !data.price) return;
      
      // Update the token in our local state if it exists
      setTokens(currentTokens => 
        currentTokens.map(token => {
          if (token.token_mint === data.mint) {
            const newMarketCap = data.price * token.total_supply;
            return {
              ...token,
              current_market_cap: newMarketCap,
              last_trade_price: data.price,
              last_updated_time: new Date().toISOString()
            };
          }
          return token;
        })
      );
    };

    // Set up subscriptions
    pumpPortalService.subscribe('token_created', handleTokenCreated);
    pumpPortalService.subscribe('trade', handleTrade);

    // Load initial data
    loadTokens();

    // Clean up on unmount
    return () => {
      pumpPortalService.unsubscribe('token_created', handleTokenCreated);
      pumpPortalService.unsubscribe('trade', handleTrade);
    };
  }, []);

  return {
    isConnected,
    tokens,
    loading
  };
}
