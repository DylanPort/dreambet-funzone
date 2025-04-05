import { create } from 'zustand';

// Types for WebSocket messages
export interface NewTokenEvent {
  type: 'newToken';
  data: {
    token_mint: string;
    token_name: string;
    token_symbol: string;
    created_time: string;
    token_decimals: number;
    token_supply: string;
    metaplex_metadata?: string;
  };
}

export interface TokenTradeEvent {
  type: 'tokenTrade';
  data: {
    token_mint: string;
    price: number;
    amount: number;
    timestamp: string;
    buyer: string;
    seller: string;
    side: 'buy' | 'sell';
    signature?: string; // Add optional signature property
  };
}

export interface RaydiumLiquidityEvent {
  type: 'raydiumLiquidity';
  data: {
    token_mint: string;
    timestamp: string;
    liquidity_amount: number;
  };
}

export interface TokenMetricsEvent {
  type: 'tokenMetrics';
  data: {
    token_mint: string;
    market_cap: number;
    volume_24h: number;
    liquidity: number;
    holders: number;
    timestamp: string;
  };
}

// Raw token creation format from PumpPortal
export interface RawTokenCreationEvent {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: 'create';
  name: string;
  symbol: string;
  marketCapSol: number;
  pool: string;
  uri?: string;
  holders?: number;
  volume24h?: number;
  liquidity?: number;
  supply?: number;  // Add the missing supply property with optional flag
  token_supply?: string; // Alternative supply property
}

// Raw token trade format from PumpPortal
export interface RawTokenTradeEvent {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: 'buy' | 'sell';
  tokenAmount: number;
  pricePerToken: number;
  solAmount: number;
  timestamp?: string;
}

export type PumpPortalEvent = NewTokenEvent | TokenTradeEvent | RaydiumLiquidityEvent | TokenMetricsEvent;

interface PumpPortalState {
  connected: boolean;
  connecting: boolean;
  recentTokens: NewTokenEvent['data'][];
  rawTokens: RawTokenCreationEvent[];
  recentRawTrades: RawTokenTradeEvent[];
  recentTrades: Record<string, TokenTradeEvent['data'][]>;
  recentLiquidity: Record<string, RaydiumLiquidityEvent['data']>;
  tokenMetrics: Record<string, TokenMetricsEvent['data']>;
  connect: () => void;
  disconnect: () => void;
  subscribeToToken: (tokenId: string) => void;
  subscribeToNewTokens: () => void;
  fetchTokenMetrics: (tokenId: string) => void;
}

let websocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

// Add debounce function for state updates
const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null;
  return (...args: any[]) => {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
};

// Store for previous data to avoid unnecessary updates
const previousData = {
  trades: new Map<string, string>(),
  metrics: new Map<string, string>()
};

// Store to save console logs for debugging
if (typeof window !== 'undefined') {
  if (!('__logs' in console)) {
    console.__logs = [];
    const oldConsoleLog = console.log;
    console.log = function(...args) {
      if (console.__logs) {
        console.__logs.push({ 
          time: new Date().toISOString(),
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') 
        });
        if (console.__logs.length > 100) console.__logs.shift();
      }
      oldConsoleLog.apply(console, args);
    };
    
    const oldConsoleInfo = console.info;
    console.info = function(...args) {
      if (console.__logs) {
        console.__logs.push({ 
          time: new Date().toISOString(),
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') 
        });
        if (console.__logs.length > 100) console.__logs.shift();
      }
      oldConsoleInfo.apply(console, args);
    };
  }
}

// Create a Zustand store to manage WebSocket state with optimized updates
export const usePumpPortalWebSocket = create<PumpPortalState>((set, get) => ({
  connected: false,
  connecting: false,
  recentTokens: [],
  rawTokens: [],
  recentRawTrades: [],
  recentTrades: {},
  recentLiquidity: {},
  tokenMetrics: {},

  connect: () => {
    if (websocket !== null || get().connecting) {
      return;
    }

    set({ connecting: true });

    // Create WebSocket connection
    websocket = new WebSocket('wss://pumpportal.fun/api/data');

    websocket.onopen = () => {
      console.info('Connected to PumpPortal WebSocket');
      set({ connected: true, connecting: false });
      reconnectAttempts = 0;
    };

    websocket.onclose = () => {
      console.info('Disconnected from PumpPortal WebSocket');
      websocket = null;
      set({ connected: false, connecting: false });
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
        
        setTimeout(() => {
          get().connect();
        }, delay);
      }
    };

    websocket.onerror = (error) => {
      console.error('PumpPortal WebSocket error:', error);
      websocket?.close();
    };

    // Debounced state updaters to batch updates
    const debouncedTokenUpdate = debounce((newTokens: NewTokenEvent['data'][]) => {
      set((state) => ({
        recentTokens: [...newTokens, ...state.recentTokens].slice(0, 50)
      }));
    }, 1000);

    const debouncedTradeUpdate = debounce((tokenId: string, trades: TokenTradeEvent['data'][]) => {
      set((state) => {
        const currentTrades = state.recentTrades[tokenId] || [];
        return {
          recentTrades: {
            ...state.recentTrades,
            [tokenId]: [...trades, ...currentTrades].slice(0, 100)
          }
        };
      });
    }, 500);

    const debouncedRawTradeUpdate = debounce((newTrades: RawTokenTradeEvent[]) => {
      set((state) => ({
        recentRawTrades: [...newTrades, ...state.recentRawTrades].slice(0, 50)
      }));
    }, 500);

    websocket.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        
        // Handle standard message format
        if (rawData.type) {
          const message = rawData as PumpPortalEvent;
          
          switch (message.type) {
            case 'newToken':
              debouncedTokenUpdate([message.data]);
              break;
              
            case 'tokenTrade': {
              const tokenId = message.data.token_mint;
              const tradeKey = `${tokenId}-${message.data.timestamp}-${message.data.price}`;
              
              // Skip if we've already processed this exact trade
              if (previousData.trades.has(tradeKey)) {
                break;
              }
              
              previousData.trades.set(tradeKey, Date.now().toString());
              // Limit cache size
              if (previousData.trades.size > 1000) {
                const oldestKey = Array.from(previousData.trades.keys())[0];
                previousData.trades.delete(oldestKey);
              }
              
              debouncedTradeUpdate(tokenId, [message.data]);
              break;
            }
              
            case 'raydiumLiquidity':
              // Only update if changed to avoid re-renders
              const currentLiquidity = get().recentLiquidity[message.data.token_mint];
              if (!currentLiquidity || 
                  currentLiquidity.liquidity_amount !== message.data.liquidity_amount) {
                set((state) => ({
                  recentLiquidity: {
                    ...state.recentLiquidity,
                    [message.data.token_mint]: message.data
                  }
                }));
              }
              break;
              
            case 'tokenMetrics': {
              const tokenId = message.data.token_mint;
              const metricKey = `${tokenId}-${message.data.timestamp}`;
              
              // Skip if we've already processed this update
              if (previousData.metrics.has(metricKey)) {
                break;
              }
              
              previousData.metrics.set(metricKey, Date.now().toString());
              // Limit cache size
              if (previousData.metrics.size > 500) {
                const oldestKey = Array.from(previousData.metrics.keys())[0];
                previousData.metrics.delete(oldestKey);
              }
              
              set((state) => ({
                tokenMetrics: {
                  ...state.tokenMetrics,
                  [tokenId]: message.data
                }
              }));
              break;
            }
              
            default:
              console.info('Unknown message type:', message);
          }
        } 
        // Handle raw token creation format
        else if (rawData.txType === 'create' && rawData.mint) {
          const tokenEvent = rawData as RawTokenCreationEvent;
          
          // Add to raw tokens store
          set((state) => ({
            rawTokens: [tokenEvent, ...state.rawTokens].slice(0, 50)
          }));
          
          // Also convert to standard format for compatibility
          const standardFormat: NewTokenEvent['data'] = {
            token_mint: tokenEvent.mint,
            token_name: tokenEvent.name || 'Unknown Token',
            token_symbol: tokenEvent.symbol || '',
            created_time: new Date().toISOString(),
            token_decimals: 9, // Default for Solana
            token_supply: '1000000000', // Placeholder
            metaplex_metadata: tokenEvent.uri
          };
          
          set((state) => ({
            recentTokens: [standardFormat, ...state.recentTokens].slice(0, 50)
          }));
          
          // If metrics are available in the token creation event
          if (tokenEvent.marketCapSol || tokenEvent.holders || tokenEvent.volume24h || tokenEvent.liquidity) {
            const metricsData: TokenMetricsEvent['data'] = {
              token_mint: tokenEvent.mint,
              market_cap: tokenEvent.marketCapSol || 0,
              volume_24h: tokenEvent.volume24h || 0,
              liquidity: tokenEvent.liquidity || 0,
              holders: tokenEvent.holders || 0,
              timestamp: new Date().toISOString()
            };
            
            set((state) => ({
              tokenMetrics: {
                ...state.tokenMetrics,
                [tokenEvent.mint]: metricsData
              }
            }));
          }
        }
        // Handle raw token trade format (buy/sell transactions)
        else if ((rawData.txType === 'buy' || rawData.txType === 'sell') && rawData.mint) {
          const tradeEvent = rawData as RawTokenTradeEvent;
          
          // Add to raw trades store
          set((state) => ({
            recentRawTrades: [tradeEvent, ...state.recentRawTrades].slice(0, 50)
          }));
          
          // Also convert to standard format for compatibility
          const standardFormat: TokenTradeEvent['data'] = {
            token_mint: tradeEvent.mint,
            price: tradeEvent.pricePerToken || 0,
            amount: tradeEvent.tokenAmount || 0,
            timestamp: tradeEvent.timestamp || new Date().toISOString(),
            buyer: tradeEvent.txType === 'buy' ? tradeEvent.traderPublicKey : '',
            seller: tradeEvent.txType === 'sell' ? tradeEvent.traderPublicKey : '',
            side: tradeEvent.txType as 'buy' | 'sell',
            signature: tradeEvent.signature // Add signature from raw event
          };
          
          // Add to token-specific trades
          debouncedTradeUpdate(tradeEvent.mint, [standardFormat]);
        }
        // Log unknown formats for debugging
        else {
          console.info('Unknown message type:', rawData);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  },

  disconnect: () => {
    if (websocket !== null) {
      websocket.close();
      websocket = null;
      set({ connected: false });
    }
  },

  subscribeToToken: (tokenId: string) => {
    if (websocket && get().connected) {
      // Check if we're already subscribed to avoid duplicate subscriptions
      const hasTrades = get().recentTrades[tokenId] !== undefined;
      if (!hasTrades) {
        const payload = {
          method: "subscribeTokenTrade",
          keys: [tokenId]
        };
        websocket.send(JSON.stringify(payload));
        console.log(`Subscribed to token trades for ${tokenId}`);
      }
      
      // Also fetch metrics for this token
      get().fetchTokenMetrics(tokenId);
    }
  },

  subscribeToNewTokens: () => {
    if (websocket && get().connected) {
      const payload = {
        method: "subscribeNewToken"
      };
      websocket.send(JSON.stringify(payload));
      console.log('Subscribed to new token events');
    }
  },
  
  fetchTokenMetrics: (tokenId: string) => {
    if (websocket && get().connected) {
      const payload = {
        method: "getTokenMetrics",
        keys: [tokenId]
      };
      try {
        websocket.send(JSON.stringify(payload));
        console.log(`Requested metrics for token ${tokenId}`);
      } catch (error) {
        console.error('Error requesting token metrics:', error);
      }
    }
  }
}));

// Helper function to convert token data from WebSocket to our app format
export const formatWebSocketTokenData = (tokenData: NewTokenEvent['data']) => ({
  id: tokenData.token_mint,
  name: tokenData.token_name,
  symbol: tokenData.token_symbol || '',
  logo: '🪙', // Default logo
  imageUrl: tokenData.metaplex_metadata || '', // Include the metadata URL for image
  currentPrice: 0, // Initial price unknown from creation event
  change24h: 0,
  migrationTime: new Date(tokenData.created_time).getTime(),
});

// Helper function to get latest price from trades
export const getLatestPriceFromTrades = (trades: TokenTradeEvent['data'][]) => {
  if (!trades || trades.length === 0) {
    return 0;
  }
  return trades[0].price;
};

// Format a raw trade event for display
export const formatRawTrade = (trade: RawTokenTradeEvent) => {
  return {
    mint: trade.mint,
    type: trade.txType,
    amount: trade.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    price: trade.pricePerToken.toFixed(9),
    solAmount: trade.solAmount.toFixed(3),
    trader: `${trade.traderPublicKey.substring(0, 4)}...${trade.traderPublicKey.substring(trade.traderPublicKey.length - 4)}`,
    timestamp: trade.timestamp || new Date().toISOString()
  };
};

// Initialize websocket on import
setTimeout(() => {
  usePumpPortalWebSocket.getState().connect();
}, 1000);
