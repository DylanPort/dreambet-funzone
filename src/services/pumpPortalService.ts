
import { supabase } from "@/integrations/supabase/client";

// PumpPortal WebSocket Connection
export class PumpPortalService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000; // 5 seconds
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    console.log('Connecting to PumpPortal WebSocket...');
    this.ws = new WebSocket('wss://pumpportal.fun/api/data');
    
    this.ws.onopen = () => {
      console.log('Connected to PumpPortal WebSocket');
      this.reconnectAttempts = 0;
      
      // Subscribe to events
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', event: 'token_created' }));
        this.ws.send(JSON.stringify({ type: 'subscribe', event: 'trade' }));
      }
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from PumpPortal WebSocket');
      this.handleReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      console.error('Max reconnect attempts reached. Please refresh the page.');
    }
  }

  private async handleWebSocketMessage(data: any) {
    if (!data.event) return;
    
    // Handle token_created event
    if (data.event === 'token_created' && data.data) {
      await this.handleTokenCreated(data.data);
    }
    
    // Handle trade event to update token prices
    if (data.event === 'trade' && data.data) {
      await this.handleTrade(data.data);
    }
    
    // Dispatch to any registered event handlers
    const handlers = this.eventHandlers.get(data.event) || [];
    handlers.forEach(handler => handler(data.data));
  }

  private async handleTokenCreated(tokenData: any) {
    if (!tokenData.mint || !tokenData.name) return;
    
    try {
      // Check if token already exists
      const { data: existingToken } = await supabase
        .from('tokens')
        .select('token_mint')
        .eq('token_mint', tokenData.mint)
        .single();
      
      if (existingToken) return; // Token already in our database
      
      // Calculate initial values
      const initialPrice = tokenData.price || 0;
      const totalSupply = tokenData.supply || 1000000000; // Default if not provided
      const marketCap = initialPrice * totalSupply;
      
      // Insert the new token
      await supabase
        .from('tokens')
        .insert({
          token_mint: tokenData.mint,
          token_name: tokenData.name,
          token_symbol: tokenData.symbol || '',
          current_market_cap: marketCap,
          initial_market_cap: marketCap,
          total_supply: totalSupply,
          last_trade_price: initialPrice,
          created_on: tokenData.created_on || 'pump.fun'
        });
      
      console.log(`New token added: ${tokenData.name}`);
    } catch (error) {
      console.error('Error adding new token:', error);
    }
  }

  private async handleTrade(tradeData: any) {
    if (!tradeData.mint || !tradeData.price) return;
    
    try {
      // Get current token data
      const { data: tokenData } = await supabase
        .from('tokens')
        .select('total_supply')
        .eq('token_mint', tradeData.mint)
        .single();
      
      if (!tokenData) return; // Token not in our database
      
      // Calculate new market cap
      const newMarketCap = tradeData.price * tokenData.total_supply;
      
      // Update token with new price and market cap
      await supabase
        .from('tokens')
        .update({
          current_market_cap: newMarketCap,
          last_trade_price: tradeData.price,
          last_updated_time: new Date().toISOString()
        })
        .eq('token_mint', tradeData.mint);
    } catch (error) {
      console.error('Error updating token price:', error);
    }
  }

  // Public methods to subscribe to specific events
  public subscribe(eventName: string, callback: (data: any) => void) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)?.push(callback);
  }

  public unsubscribe(eventName: string, callback: (data: any) => void) {
    if (!this.eventHandlers.has(eventName)) return;
    
    const handlers = this.eventHandlers.get(eventName) || [];
    this.eventHandlers.set(
      eventName,
      handlers.filter(handler => handler !== callback)
    );
  }

  // Close the connection
  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
const pumpPortalService = new PumpPortalService();

export default pumpPortalService;
