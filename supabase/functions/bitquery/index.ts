
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, variables } = await req.json();
    
    const BITQUERY_API_KEY = Deno.env.get("BITQUERY_API_KEY");
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
        query,
        variables
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bitquery API error:", errorText);
      throw new Error(`Bitquery API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Received data from Bitquery:", JSON.stringify(data).substring(0, 200) + "...");

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
    console.error("Error in bitquery function:", error);
    
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
