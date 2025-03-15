
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to fetch data from DexScreener API
async function fetchTopPumpFunTokensByVolume() {
  try {
    console.log("Fetching top PumpFun tokens from DexScreener");
    
    // Use the API to fetch tokens on Solana, specifically looking for "pump" as the dexId
    const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana?rankBy=volume&order=desc');
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
      throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.log("No pairs found from DexScreener");
      return [];
    }
    
    // Filter for PumpFun (dexId = "pump") tokens and take top ones
    const pumpFunPairs = data.pairs
      .filter(pair => pair.dexId === "pump")
      .slice(0, 10); // Get top 10
    
    console.log(`Found ${pumpFunPairs.length} PumpFun pairs`);
    
    // Format the tokens
    const topTokens = pumpFunPairs.map((pair, index) => ({
      token_mint: pair.baseToken?.address || '',
      token_name: pair.baseToken?.name || 'Unknown',
      token_symbol: pair.baseToken?.symbol || '',
      volume_24h: pair.volume?.h24 || 0,
      current_market_cap: pair.fdv || 0,
      last_trade_price: parseFloat(pair.priceUsd || '0'),
      total_supply: 1000000000, // Assuming a default supply
      volume_rank: index + 1 // Ranking based on order
    }));
    
    return topTokens;
  } catch (error) {
    console.error("Error fetching top PumpFun tokens:", error);
    throw error;
  }
}

// Function to update token data in database
async function updateTopTokensInDatabase(tokens) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase credentials");
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log(`Updating ${tokens.length} tokens in database`);
  
  for (const token of tokens) {
    // Check if token exists
    const { data: existingToken, error: checkError } = await supabase
      .from('tokens')
      .select('token_mint')
      .eq('token_mint', token.token_mint)
      .maybeSingle();
    
    if (checkError) {
      console.error(`Error checking token ${token.token_mint}:`, checkError);
      continue;
    }
    
    if (!existingToken) {
      // Insert new token
      const { error: insertError } = await supabase
        .from('tokens')
        .insert({
          ...token,
          created_on: new Date().toISOString()
        });
      
      if (insertError) {
        console.error(`Error inserting token ${token.token_mint}:`, insertError);
      } else {
        console.log(`Inserted new token: ${token.token_name} with volume rank ${token.volume_rank}`);
      }
    } else {
      // Update existing token
      const { error: updateError } = await supabase
        .from('tokens')
        .update({
          ...token,
          last_updated_time: new Date().toISOString()
        })
        .eq('token_mint', token.token_mint);
      
      if (updateError) {
        console.error(`Error updating token ${token.token_mint}:`, updateError);
      } else {
        console.log(`Updated token: ${token.token_name} with volume rank ${token.volume_rank}`);
      }
    }
  }
  
  return tokens.length;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting fetch-top-pumpfun-tokens function");
    
    // Fetch top tokens from DexScreener
    const topTokens = await fetchTopPumpFunTokensByVolume();
    
    // Update tokens in database
    const updatedCount = await updateTopTokensInDatabase(topTokens);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully fetched and updated ${updatedCount} top PumpFun tokens by volume`,
        tokensUpdated: updatedCount
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in fetch-top-pumpfun-tokens function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
