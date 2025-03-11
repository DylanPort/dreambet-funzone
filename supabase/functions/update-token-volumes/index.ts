
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the API key from environment variable
const BITQUERY_API_KEY = Deno.env.get("BITQUERY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Updated query to match the user's requirements for top tokens by trading volume on PumpFun
const topTokensByVolumeQuery = `
{
  Solana {
    DEXTrades(
      limitBy: { by: Trade_Buy_Currency_MintAddress, count: 1 }
      limit: { count: 50 }
      orderBy: { descending: Trade_Buy_Price }
      where: {
        Trade: {
          Dex: { ProtocolName: { is: "pump" } }
          Buy: {
            Currency: {
              MintAddress: { notIn: ["11111111111111111111111111111111"] }
            }
          }
          Sell: { AmountInUSD: { gt: "10" } }
        }
        Transaction: { Result: { Success: true } }
        Block: { Time: { since: "2024-03-01T00:00:00Z" } }
      }
    ) {
      Trade {
        Buy {
          Currency {
            MintAddress
            Name
            Symbol
          }
          Price
          PriceInUSD
        }
        volume: sum(of: Trade_Sell_Amount)
        volumeUSD: sum(of: Trade_Sell_AmountInUSD)
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
    console.error("BITQUERY_API_KEY is not set");
    throw new Error("BITQUERY_API_KEY is not set in environment variables");
  }
  
  console.log("Fetching data from Bitquery");
  console.log("Using API key starting with:", BITQUERY_API_KEY.substring(0, 5) + "...");
  
  try {
    const response = await fetch("https://graphql.bitquery.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": BITQUERY_API_KEY, // Using X-API-KEY header as per Bitquery docs
      },
      body: JSON.stringify({
        query
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bitquery API error (${response.status}): ${errorText}`);
      throw new Error(`Bitquery API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Bitquery response received successfully");
    return data;
  } catch (error) {
    console.error("Error in fetchBitqueryData:", error.message);
    throw error;
  }
}

// Updated function to update token data in Supabase with volume categories
async function updateTokenData(tokenData: any[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials not set");
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // If no tokens were returned from the API, don't add mock data anymore
  if (!tokenData || tokenData.length === 0) {
    console.log("No tokens returned from Bitquery API");
    return { success: false, message: "No tokens found in API response" };
  }
  
  console.log(`Processing ${tokenData.length} tokens from Bitquery`);
  const tokensProcessed = { total: 0, above15k: 0, above30k: 0 };
  
  // Process each token
  for (const token of tokenData) {
    if (!token.Trade || !token.Trade.Buy || !token.Trade.Buy.Currency) {
      console.log("Skipping invalid token data:", token);
      continue;
    }
    
    const mintAddress = token.Trade.Buy.Currency.MintAddress;
    const name = token.Trade.Buy.Currency.Name || "Unknown Token";
    const symbol = token.Trade.Buy.Currency.Symbol || "UNKNOWN";
    
    // Get volume, defaulting to a calculated value if not available
    // Try to get volume in USD first, then fallback to SOL volume
    const volumeUSD = token.Trade.volumeUSD || 0;
    const volume24h = token.Trade.volume || 0;
    
    // Get price, calculating market cap based on fixed supply
    const price = token.Trade.Buy.Price || 0;
    
    console.log(`Processing token: ${name} (${mintAddress}) with price: ${price} and volume: ${volumeUSD} USD`);
    
    // Calculate market cap (PumpFun tokens have a fixed supply of 1 billion)
    const SUPPLY = 1000000000;
    const marketCap = price * SUPPLY;
    
    // Determine volume category
    let volumeCategory = 'below_15k';
    if (volumeUSD >= 30000) {
      volumeCategory = 'above_30k';
      tokensProcessed.above30k++;
    } else if (volumeUSD >= 15000) {
      volumeCategory = 'above_15k';
      tokensProcessed.above15k++;
    }
    
    console.log(`Token ${name} has market cap: ${marketCap}, volume: ${volumeUSD} USD, category: ${volumeCategory}`);
    
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
          volume_24h: volumeUSD, // Using USD volume for filtering
          volume_category: volumeCategory
        });
      
      if (insertError) {
        console.error(`Error inserting token ${mintAddress}:`, insertError);
      } else {
        console.log(`Inserted new token: ${name} in category ${volumeCategory}`);
        tokensProcessed.total++;
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
          volume_24h: volumeUSD, // Using USD volume for filtering
          volume_category: volumeCategory,
          last_updated_time: new Date().toISOString()
        })
        .eq('token_mint', mintAddress);
      
      if (updateError) {
        console.error(`Error updating token ${mintAddress}:`, updateError);
      } else {
        console.log(`Updated token: ${name} to category ${volumeCategory}`);
        tokensProcessed.total++;
      }
    }
    
    // Add history record
    const { error: historyError } = await supabase
      .from('token_volume_history')
      .insert({
        token_mint: mintAddress,
        volume_24h: volumeUSD // Using USD volume for history
      });
    
    if (historyError) {
      console.error(`Error adding history for token ${mintAddress}:`, historyError);
    }
  }
  
  return { 
    success: true, 
    tokensProcessed: tokensProcessed.total,
    tokensAbove15k: tokensProcessed.above15k,
    tokensAbove30k: tokensProcessed.above30k
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting update-token-volumes function");
    let result;
    
    try {
      // Fetch top tokens by volume
      const bitqueryData = await fetchBitqueryData(topTokensByVolumeQuery);
      
      if (!bitqueryData.data || !bitqueryData.data.Solana || !bitqueryData.data.Solana.DEXTrades) {
        console.error("Invalid response from Bitquery:", bitqueryData);
        throw new Error("Invalid Bitquery response structure");
      }
      
      const tokenData = bitqueryData.data.Solana.DEXTrades;
      
      console.log(`Fetched ${tokenData.length} tokens from Bitquery`);
      
      // Update token data in Supabase
      result = await updateTokenData(tokenData);
    } catch (apiError) {
      console.error("Error fetching from Bitquery:", apiError);
      
      // Return error instead of falling back to mock data
      result = { 
        success: false, 
        apiError: apiError.message
      };
    }
    
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
