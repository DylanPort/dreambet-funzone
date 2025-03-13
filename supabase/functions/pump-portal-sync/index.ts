// Follow this setup guide to integrate the Deno runtime with your application:
// https://docs.deno.land/runtime-manual/manual/nodejs/integrations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const RETRY_DELAY = 5000; // 5 seconds

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
      // This would ideally be a long-running process, but for edge functions we'll
      // just demonstrate the concept - in reality this needs to be a separate service
      
      // Log that we're starting
      console.log("Starting PumpPortal sync process");
      
      // In a real implementation, we'd:
      // 1. Connect to the PumpPortal WebSocket
      // 2. Listen for token events and trades
      // 3. Update the Supabase database
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Token sync process initiated. In a production environment, this would start a background process."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle fetching recent tokens from PumpPortal (simulated)
    if (action === "fetch_recent_tokens") {
      // In reality, this would make an API call to PumpPortal or process cached data
      const mockTokens = [
        {
          mint: "tokenMint123",
          name: "DemoToken",
          symbol: "DEMO",
          price: 0.001,
          supply: 1000000
        }
      ];
      
      // Process and insert these tokens into our database
      for (const token of mockTokens) {
        const marketCap = token.price * token.supply;
        
        // Check if token already exists
        const { data: existingToken } = await supabase
          .from('tokens')
          .select('token_mint')
          .eq('token_mint', token.mint)
          .maybeSingle();
        
        if (!existingToken) {
          // Insert new token
          await supabase
            .from('tokens')
            .insert({
              token_mint: token.mint,
              token_name: token.name,
              token_symbol: token.symbol,
              current_market_cap: marketCap,
              initial_market_cap: marketCap,
              total_supply: token.supply,
              last_trade_price: token.price,
              created_on: 'pump.fun'
            });
          
          console.log(`Added token: ${token.name}`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Processed recent tokens", 
          count: mockTokens.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle processing expired bets
    if (action === "process_expired_bets") {
      const now = new Date();
      
      // Find open bets that have expired (created more than 24 hours ago)
      const expiryTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: expiredBets, error } = await supabase
        .from('bets')
        .select('bet_id, bettor1_id')
        .eq('status', 'open')
        .lt('created_at', expiryTime);
      
      if (error) throw error;
      
      // Update each expired bet
      for (const bet of expiredBets || []) {
        await supabase.rpc('update_bet_status', {
          p_bet_id: bet.bet_id,
          p_status: 'expired',
          p_user_id: bet.bettor1_id,
          p_action: 'expired',
          p_details: { reason: 'No counter-bet within 24 hours' }
        });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Processed expired bets", 
          count: expiredBets?.length || 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle resolving completed bets
    if (action === "resolve_completed_bets") {
      const now = new Date();
      
      // Find matched bets that have reached their end time
      const { data: completedBets, error } = await supabase
        .from('bets')
        .select(`
          bet_id, 
          token_mint, 
          bettor1_id, 
          bettor2_id, 
          prediction_bettor1, 
          initial_market_cap,
          sol_amount
        `)
        .eq('status', 'matched')
        .lt('end_time', now.toISOString());
      
      if (error) throw error;
      
      // Process each completed bet
      for (const bet of completedBets || []) {
        // Get current market cap
        const { data: token } = await supabase
          .from('tokens')
          .select('current_market_cap')
          .eq('token_mint', bet.token_mint)
          .single();
        
        if (!token) continue;
        
        // Determine winner
        const finalMarketCap = token.current_market_cap;
        const initialMarketCap = bet.initial_market_cap;
        const didMigrate = finalMarketCap > initialMarketCap;
        
        // If predicted migrate and it did migrate, bettor1 wins
        // If predicted migrate and it didn't migrate, bettor2 wins
        const winner = (bet.prediction_bettor1 === 'migrate' && didMigrate) || 
                      (bet.prediction_bettor1 === 'die' && !didMigrate)
                      ? bet.bettor1_id : bet.bettor2_id;
        
        // Update bet status
        await supabase
          .from('bets')
          .update({
            status: 'completed'
          })
          .eq('bet_id', bet.bet_id);
        
        // Create history record
        await supabase
          .from('bet_history')
          .insert({
            bet_id: bet.bet_id,
            action: 'completed',
            user_id: winner,
            details: { 
              winner, 
              initial_market_cap: initialMarketCap,
              final_market_cap: finalMarketCap,
              did_migrate: didMigrate
            },
            market_cap_at_action: finalMarketCap
          });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Resolved completed bets", 
          count: completedBets?.length || 0 
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
