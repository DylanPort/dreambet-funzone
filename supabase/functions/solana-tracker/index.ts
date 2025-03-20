
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SOLANA_TRACKER_API_KEY = Deno.env.get("SOLANA_TRACKER_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
    // Get the query from the request body
    const { query } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Searching for token on Solana Tracker: ${query}`);
    
    if (!SOLANA_TRACKER_API_KEY) {
      console.error("SOLANA_TRACKER_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "API key configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Make request to Solana Tracker API
    const response = await fetch(`https://data.solanatracker.io/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': SOLANA_TRACKER_API_KEY
      },
    });
    
    // Handle different response status codes
    if (response.status === 404) {
      return new Response(
        JSON.stringify({ error: "Token not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (response.status === 401 || response.status === 403) {
      console.error("API key unauthorized or invalid");
      return new Response(
        JSON.stringify({ error: "API authorization error" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!response.ok) {
      console.error(`Solana Tracker API error: ${response.status} - ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return the response from Solana Tracker API
    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in solana-tracker function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
