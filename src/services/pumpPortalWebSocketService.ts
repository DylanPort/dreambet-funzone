
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

export type PumpPortalEvent = NewTokenEvent | TokenTradeEvent | RaydiumLiquidityEvent;

interface PumpPortalState {
  connected: boolean;
  connecting: boolean;
  recentTokens: NewTokenEvent['data'][];
  recentTrades: Record<string, TokenTradeEvent['data'][]>;
  recentLiquidity: Record<string, RaydiumLiquidityEvent['data']>;
  connect: () => void;
  disconnect: () => void;
  subscribeToToken: (tokenId: string) => void;
  subscribeToNewTokens: () => void;
}

let websocket: WebSocket | null = null;

// Create a Zustand store to manage WebSocket state
export const usePumpPortalWebSocket = create<PumpPortalState>((set, get) => ({
  connected: false,
  connecting: false,
  recentTokens: [],
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
      console.log('Connected to PumpPortal WebSocket');
      set({ connected: true, connecting: false });
    };

    websocket.onclose = () => {
      console.log('Disconnected from PumpPortal WebSocket');
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
        const message = JSON.parse(event.data) as PumpPortalEvent;
        
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
            console.log('Unknown message type:', message);
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
