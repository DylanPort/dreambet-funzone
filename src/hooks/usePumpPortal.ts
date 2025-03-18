
import { useEffect, useState } from 'react';
import { usePumpPortalWebSocket, RawTokenTradeEvent } from '@/services/pumpPortalWebSocketService';

// Hook for component to use PumpPortal data
export const usePumpPortal = (tokenId?: string) => {
  const pumpPortal = usePumpPortalWebSocketService();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [tokenMetrics, setTokenMetrics] = useState<Record<string, any>>({});
  
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
  
  // Ensure token metrics are updated when we have data
  useEffect(() => {
    if (tokenId && pumpPortal.tokenMetrics && pumpPortal.tokenMetrics[tokenId]) {
      setTokenMetrics(prevMetrics => ({
        ...prevMetrics,
        [tokenId]: pumpPortal.tokenMetrics[tokenId]
      }));
    }
  }, [tokenId, pumpPortal.tokenMetrics]);
  
  // Get token creation events from console logs
  const getRawTokensFromLogs = () => {
    if (typeof console === 'undefined') return [];
    
    const logs = console.__logs || [];
    
    return logs
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
            created_time: new Date().toISOString(),
            supply: data.supply || 1000000000 // Add default supply
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  };
  
  return {
    isConnected: pumpPortal.connected,
    recentTokens: pumpPortal.recentTokens || [],
    rawTokens: pumpPortal.rawTokens || [],
    recentTrades: tokenId ? pumpPortal.recentTrades[tokenId] || [] : {},
    recentRawTrades: pumpPortal.recentRawTrades || [],
    recentLiquidity: tokenId ? pumpPortal.recentLiquidity[tokenId] : null,
    tokenMetrics: tokenId ? pumpPortal.tokenMetrics?.[tokenId] || {} : pumpPortal.tokenMetrics || {},
    getTokenContractAddress: (mint: string) => mint || 'Unknown Contract',
    getTokenHolders: (mint: string) => 
      pumpPortal.tokenMetrics?.[mint]?.holders || 'Unknown',
    subscribeToToken: pumpPortal.subscribeToToken,
    subscribeToNewTokens: pumpPortal.subscribeToNewTokens
  };
};

export default usePumpPortal;
