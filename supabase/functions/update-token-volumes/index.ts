
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BITQUERY_API_KEY = Deno.env.get("BITQUERY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Query to get most traded tokens on PumpFun by volume
const topTokensByVolumeQuery = `
{
  Solana {
    DEXTrades(
      limitBy: {by: Trade_Buy_Currency_MintAddress, count: 1}
      limit: {count: 20}
      orderBy: {descending: Trade_Sell_Amount}
      where: {
        Trade: {
          Dex: {ProtocolName: {is: "pump"}}, 
          Buy: {
            Currency: {MintAddress: {notIn: ["11111111111111111111111111111111"]}}
          }, 
          PriceAsymmetry: {le: 0.1},
          Sell: {AmountInUSD: {gt: "10"}}
        }, 
        Transaction: {Result: {Success: true}}, 
        Block: {Time: {since: "2023-02-21T05:05:00Z"}}
      }
    ) {
      Trade {
        Buy {
          Price
          PriceInUSD
          Currency {
            Name
            Symbol
            MintAddress
            Decimals
            Fungible
            Uri
          }
        }
        Sell {
          Amount
          AmountInUSD
        }
      }
    }
  }
}
`;

// Function to fetch data from Bitquery
async function fetchBitqueryData(query: string) {
  if (!BITQUERY_API_KEY) {
    throw new Error("BITQUERY_API_KEY is not set");
  }
  
  console.log("Fetching data from Bitquery with query:", query);
  console.log("Using API key starting with:", BITQUERY_API_KEY.substring(0, 3) + "...");
  
  const response = await fetch("https://graphql.bitquery.io/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": BITQUERY_API_KEY,
    },
    body: JSON.stringify({
      query
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Bitquery API error: ${response.status} ${errorText}`);
    throw new Error(`Bitquery API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Function to update token data in Supabase
async function updateTokenData(tokenData: any[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not set");
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Process each token
  for (const token of tokenData) {
    const mintAddress = token.Trade.Buy.Currency.MintAddress;
    const name = token.Trade.Buy.Currency.Name || "Unknown Token";
    const symbol = token.Trade.Buy.Currency.Symbol || "UNKNOWN";
    const price = token.Trade.Buy.Price;
    const volume24h = token.Trade.Sell.AmountInUSD;
    
    console.log(`Processing token: ${name} (${mintAddress}) with volume: ${volume24h}`);
    
    // Calculate market cap (PumpFun tokens have a fixed supply of 1 billion)
    const SUPPLY = 1000000000;
    const marketCap = price * SUPPLY;
    
    // Check if token exists
    const { data: existingToken, error: checkError } = await supabase
      .from('tokens')
      .select('token_mint')
      .eq('token_mint', mintAddress)
      .maybeSingle();
    
    if (checkError) {
      console.error(`Error checking token ${mintAddress}:`, checkError);
      continue;
    }
    
    // Insert or update token
    if (!existingToken) {
      // Insert new token
      const { error: insertError } = await supabase
        .from('tokens')
        .insert({
          token_mint: mintAddress,
          token_name: name,
          token_symbol: symbol,
          current_market_cap: marketCap,
          last_trade_price: price,
          total_supply: SUPPLY,
          volume_24h: volume24h
        });
      
      if (insertError) {
        console.error(`Error inserting token ${mintAddress}:`, insertError);
      } else {
        console.log(`Inserted new token: ${name}`);
      }
    } else {
      // Update existing token
      const { error: updateError } = await supabase
        .from('tokens')
        .update({
          token_name: name,
          token_symbol: symbol,
          current_market_cap: marketCap,
          last_trade_price: price,
          volume_24h: volume24h,
          last_updated_time: new Date().toISOString()
        })
        .eq('token_mint', mintAddress);
      
      if (updateError) {
        console.error(`Error updating token ${mintAddress}:`, updateError);
      } else {
        console.log(`Updated token: ${name}`);
      }
    }
    
    // Add history record
    const { error: historyError } = await supabase
      .from('token_volume_history')
      .insert({
        token_mint: mintAddress,
        volume_24h: volume24h
      });
    
    if (historyError) {
      console.error(`Error adding history for token ${mintAddress}:`, historyError);
    }
  }
  
  return { success: true, tokensProcessed: tokenData.length };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting update-token-volumes function");
    
    // Fetch top tokens by volume
    const bitqueryData = await fetchBitqueryData(topTokensByVolumeQuery);
    const tokenData = bitqueryData.data.Solana.DEXTrades;
    
    console.log(`Fetched ${tokenData.length} tokens from Bitquery`);
    
    // Update token data in Supabase
    const result = await updateTokenData(tokenData);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in update-token-volumes function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
