
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
  
  return {
    isConnected: pumpPortal.connected,
    recentTokens: pumpPortal.recentTokens,
    recentTrades: tokenId ? pumpPortal.recentTrades[tokenId] || [] : {},
    recentLiquidity: tokenId ? pumpPortal.recentLiquidity[tokenId] : null,
    subscribeToToken: pumpPortal.subscribeToToken,
    subscribeToNewTokens: pumpPortal.subscribeToNewTokens
  };
};

export default usePumpPortal;
