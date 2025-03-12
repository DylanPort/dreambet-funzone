
// Follow this setup guide to integrate the Deno runtime with your application:
// https://docs.deno.land/runtime-manual/manual/nodejs/integrations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { WebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory storage for trending tokens
let trendingTokens = new Map();
let wsClient: WebSocketClient | null = null;
let wsConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds

// Function to connect to the WebSocket
function connectToWebSocket() {
  try {
    console.log("Attempting to connect to PumpPortal WebSocket...");
    wsClient = new WebSocketClient("wss://pumpportal.fun/api/data");
    
    wsClient.on("open", () => {
      console.log("WebSocket connected to PumpPortal");
      wsConnected = true;
      reconnectAttempts = 0;
      
      // Subscribe to token trades
      wsClient?.send(JSON.stringify({ method: "subscribeTokenTrade" }));
    });
    
    wsClient.on("message", async (message: string) => {
      try {
        const trade = JSON.parse(message);
        if (!trade || !trade.mint_address) {
          console.log("Received invalid trade data:", message);
          return;
        }
        
        const { mint_address, name, symbol, price } = trade;
        
        // Calculate market cap (Pump.fun tokens have 1B supply)
        const SUPPLY = 1000000000;
        const marketCap = price * SUPPLY;
        
        console.log(`Received trade for ${name} (${mint_address}): price=${price}, marketCap=${marketCap}`);
        
        // Update in-memory store
        trendingTokens.set(mint_address, {
          mint_address,
          name,
          symbol,
          price,
          market_cap: marketCap,
          timestamp: new Date().toISOString()
        });
        
        // Update Supabase
        const { error } = await supabase
          .from("tokens")
          .upsert({
            token_mint: mint_address,
            token_name: name,
            token_symbol: symbol,
            current_market_cap: marketCap,
            last_trade_price: price,
            total_supply: SUPPLY,
            created_on: 'pump.fun',
            last_updated_time: new Date().toISOString()
          });
          
        if (error) {
          console.error("Supabase error updating token:", error);
        } else {
          console.log(`Successfully updated token ${name} in database`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    
    wsClient.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      wsConnected = false;
      
      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`WebSocket disconnected. Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectToWebSocket, RECONNECT_DELAY);
      } else {
        console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      }
    });
    
    wsClient.on("close", () => {
      console.log("WebSocket connection closed");
      wsConnected = false;
      
      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`WebSocket disconnected. Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectToWebSocket, RECONNECT_DELAY);
      } else {
        console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      }
    });
  } catch (error) {
    console.error("Error connecting to WebSocket:", error);
    
    // Attempt reconnection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Error connecting. Retrying (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectToWebSocket, RECONNECT_DELAY);
    }
  }
}

// Initialize connection (this will run when the edge function starts)
// Note: In a real-world scenario, you'd want a more persistent solution
// as edge functions are ephemeral, but this demonstrates the concept
connectToWebSocket();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse the request body
    const { action } = await req.json();

    if (action === "start_sync") {
      // If WebSocket isn't connected, try to connect
      if (!wsConnected) {
        connectToWebSocket();
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "PumpPortal sync process active",
          status: wsConnected ? "connected" : "connecting"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "get_trending_tokens") {
      // Convert the Map to an array
      const tokens = Array.from(trendingTokens.values());
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: tokens,
          count: tokens.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === "fetch_token_data") {
      const { tokenMint } = await req.json();
      
      if (!tokenMint) {
        return new Response(
          JSON.stringify({ error: "tokenMint is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check in-memory cache first
      const cachedToken = trendingTokens.get(tokenMint);
      
      if (cachedToken) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: cachedToken,
            source: "cache"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // If not in cache, check database
      const { data: tokenData, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("token_mint", tokenMint)
        .single();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: "Token not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: tokenData,
          source: "database"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in pump-portal-sync function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
