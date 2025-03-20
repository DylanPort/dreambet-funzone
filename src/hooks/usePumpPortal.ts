
import { useEffect, useState } from 'react';
import { usePumpPortalWebSocket, RawTokenCreationEvent } from '@/services/pumpPortalWebSocketService';

// Hook for component to use PumpPortal data
export const usePumpPortal = (tokenId?: string) => {
  const pumpPortal = usePumpPortalWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Subscribe to specific token trades when needed
  useEffect(() => {
    if (pumpPortal.connected && tokenId && !isSubscribed) {
      console.log("Subscribing to token:", tokenId);
      pumpPortal.subscribeToToken(tokenId);
      setIsSubscribed(true);
    }
    
    // Add retry mechanism if connection fails
    if (!pumpPortal.connected && tokenId && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retry ${retryCount + 1} for token subscription:`, tokenId);
        setRetryCount(prev => prev + 1);
        setIsSubscribed(false); // Reset to try again
      }, 2000 * (retryCount + 1));
      
      return () => clearTimeout(timer);
    }
  }, [pumpPortal.connected, tokenId, isSubscribed, retryCount]);
  
  // Check if already subscribed to new tokens in the first render
  useEffect(() => {
    // If no specific token is provided, make sure we're subscribed to new tokens
    if (pumpPortal.connected && !tokenId && !isSubscribed) {
      console.log("Subscribing to new tokens");
      pumpPortal.subscribeToNewTokens();
      setIsSubscribed(true);
    }
  }, [pumpPortal.connected, tokenId, isSubscribed]);
  
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
            created_time: new Date().toISOString(), // Add creation time
            supply: data.supply || 1000000000, // Add default supply
            mint: data.mint,
            name: data.name || 'Unknown Token',
            symbol: data.symbol || '',
            traderPublicKey: data.traderPublicKey || 'Unknown',
            marketCapSol: data.marketCapSol || null,
            // Add timestamp property for compatibility
            timestamp: new Date().toISOString()
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  };
  
  // Combine all available token data
  const getAllTokenData = () => {
    if (!tokenId) return null;
    
    // Check if token exists in recent trades
    if (pumpPortal.recentTrades[tokenId] && pumpPortal.recentTrades[tokenId].length > 0) {
      return {
        trades: pumpPortal.recentTrades[tokenId],
        metrics: pumpPortal.tokenMetrics[tokenId]
      };
    }
    
    // Check raw tokens
    const rawToken = pumpPortal.rawTokens?.find(t => t.token_mint === tokenId);
    if (rawToken) {
      return {
        token: rawToken,
        metrics: null
      };
    }
    
    return null;
  };
  
  return {
    isConnected: pumpPortal.connected,
    recentTokens: pumpPortal.recentTokens,
    rawTokens: pumpPortal.rawTokens || [],
    recentTrades: tokenId ? pumpPortal.recentTrades[tokenId] || [] : {},
    recentRawTrades: pumpPortal.recentRawTrades || [],
    recentLiquidity: tokenId ? pumpPortal.recentLiquidity[tokenId] : null,
    subscribeToToken: pumpPortal.subscribeToToken,
    subscribeToNewTokens: pumpPortal.subscribeToNewTokens,
    tokenMetrics: tokenId ? (pumpPortal.tokenMetrics && pumpPortal.tokenMetrics[tokenId]) : null,
    fetchTokenMetrics: pumpPortal.fetchTokenMetrics,
    getAllTokenData: getAllTokenData,
    isSubscribed: isSubscribed
  };
};

export default usePumpPortal;
