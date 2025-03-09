
import { useEffect, useState } from 'react';
import { usePumpPortalWebSocket } from '@/services/pumpPortalWebSocketService';

// Hook for component to use PumpPortal data
export const usePumpPortal = (tokenId?: string) => {
  const pumpPortal = usePumpPortalWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Subscribe to specific token trades when needed
  useEffect(() => {
    if (pumpPortal.connected && tokenId && !isSubscribed) {
      pumpPortal.subscribeToToken(tokenId);
      setIsSubscribed(true);
    }
  }, [pumpPortal.connected, tokenId, isSubscribed]);
  
  // Check if already subscribed to new tokens in the first render
  useEffect(() => {
    // If no specific token is provided, make sure we're subscribed to new tokens
    if (pumpPortal.connected && !tokenId && !isSubscribed) {
      pumpPortal.subscribeToNewTokens();
      setIsSubscribed(true);
    }
  }, [pumpPortal.connected, tokenId, isSubscribed]);
  
  // Get token creation events from console logs
  const getRawTokensFromLogs = () => {
    if (typeof console === 'undefined' || !console.__logs) return [];
    
    return console.__logs
      .filter((log: any) => 
        log.message && 
        typeof log.message === 'string' && 
        log.message.includes('Unknown message type:')
      )
      .map((log: any) => {
        try {
          const match = log.message.match(/Unknown message type: (.+)/);
          if (!match || !match[1]) return null;
          
          const data = JSON.parse(match[1]);
          if (!data.txType || data.txType !== 'create' || !data.mint) return null;
          
          return {
            token_mint: data.mint,
            token_name: data.name || 'Unknown Token',
            token_symbol: data.symbol || '',
            created_time: new Date().toISOString()
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  };
  
  return {
    isConnected: pumpPortal.connected,
    recentTokens: pumpPortal.recentTokens,
    rawTokens: getRawTokensFromLogs(), 
    recentTrades: tokenId ? pumpPortal.recentTrades[tokenId] || [] : {},
    recentLiquidity: tokenId ? pumpPortal.recentLiquidity[tokenId] : null,
    subscribeToToken: pumpPortal.subscribeToToken,
    subscribeToNewTokens: pumpPortal.subscribeToNewTokens
  };
};

export default usePumpPortal;
