
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
}

export type PumpPortalEvent = NewTokenEvent | TokenTradeEvent | RaydiumLiquidityEvent;

interface PumpPortalState {
  connected: boolean;
  connecting: boolean;
  recentTokens: NewTokenEvent['data'][];
  rawTokens: RawTokenCreationEvent[];
  recentTrades: Record<string, TokenTradeEvent['data'][]>;
  recentLiquidity: Record<string, RaydiumLiquidityEvent['data']>;
  connect: () => void;
  disconnect: () => void;
  subscribeToToken: (tokenId: string) => void;
  subscribeToNewTokens: () => void;
}

let websocket: WebSocket | null = null;

// Store to save console logs for debugging
if (typeof window !== 'undefined' && !console.__logs) {
  console.__logs = [];
  const oldConsoleLog = console.log;
  console.log = function(...args) {
    console.__logs.push({ 
      time: new Date().toISOString(),
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ') 
    });
    if (console.__logs.length > 100) console.__logs.shift();
    oldConsoleLog.apply(console, args);
  };
  
  const oldConsoleInfo = console.info;
  console.info = function(...args) {
    console.__logs.push({ 
      time: new Date().toISOString(),
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ') 
    });
    if (console.__logs.length > 100) console.__logs.shift();
    oldConsoleInfo.apply(console, args);
  };
}

// Create a Zustand store to manage WebSocket state
export const usePumpPortalWebSocket = create<PumpPortalState>((set, get) => ({
  connected: false,
  connecting: false,
  recentTokens: [],
  rawTokens: [],
  recentTrades: {},
  recentLiquidity: {},

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
    };

    websocket.onclose = () => {
      console.info('Disconnected from PumpPortal WebSocket');
      websocket = null;
      set({ connected: false, connecting: false });
      
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        get().connect();
      }, 5000);
    };

    websocket.onerror = (error) => {
      console.error('PumpPortal WebSocket error:', error);
      websocket?.close();
    };

    websocket.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        
        // Handle standard message format
        if (rawData.type) {
          const message = rawData as PumpPortalEvent;
          
          switch (message.type) {
            case 'newToken':
              set((state) => ({
                recentTokens: [message.data, ...state.recentTokens].slice(0, 50)
              }));
              break;
              
            case 'tokenTrade':
              set((state) => {
                const tokenId = message.data.token_mint;
                const currentTrades = state.recentTrades[tokenId] || [];
                
                return {
                  recentTrades: {
                    ...state.recentTrades,
                    [tokenId]: [message.data, ...currentTrades].slice(0, 100)
                  }
                };
              });
              break;
              
            case 'raydiumLiquidity':
              set((state) => ({
                recentLiquidity: {
                  ...state.recentLiquidity,
                  [message.data.token_mint]: message.data
                }
              }));
              break;
              
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
      const payload = {
        method: "subscribeTokenTrade",
        keys: [tokenId]
      };
      websocket.send(JSON.stringify(payload));
      console.log(`Subscribed to token trades for ${tokenId}`);
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
  }
}));

// Helper function to convert token data from WebSocket to our app format
export const formatWebSocketTokenData = (tokenData: NewTokenEvent['data']) => ({
  id: tokenData.token_mint,
  name: tokenData.token_name,
  symbol: tokenData.token_symbol || '',
  logo: '🪙', // Default logo
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

// Initialize websocket on import
setTimeout(() => {
  usePumpPortalWebSocket.getState().connect();
}, 1000);
