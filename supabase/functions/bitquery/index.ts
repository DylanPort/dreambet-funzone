
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get API key from environment variables
const BITQUERY_API_KEY = Deno.env.get("BITQUERY_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BITQUERY_API_KEY) {
      throw new Error("BITQUERY_API_KEY is not set in environment variables");
    }

    // Get query from request body
    const { query } = await req.json();
    
    if (!query) {
      throw new Error("No GraphQL query provided");
    }

    console.log("Calling Bitquery API with query");
    console.log("Using API key starting with:", BITQUERY_API_KEY.substring(0, 5) + "...");

    // Make request to Bitquery API using X-API-KEY header
    const response = await fetch("https://graphql.bitquery.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": BITQUERY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bitquery API error: ${response.status} ${errorText}`);
      throw new Error(`Bitquery API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Bitquery response received");

    // Return the Bitquery response
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in bitquery function:", error.message);
    
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
