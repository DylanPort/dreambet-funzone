
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_supabase_deno

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { userId, action, amount, referenceId } = await req.json();

    // Validate request
    if (!userId || !action || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Processing points action: ${action}, amount: ${amount}, for user: ${userId}`);

    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Error fetching user data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Calculate new points balance
    let currentPoints = userData.points || 0;
    let newPoints = currentPoints;
    
    switch (action) {
      case "bet":
        // Deduct points for placing a bet
        if (currentPoints < amount) {
          return new Response(
            JSON.stringify({ success: false, error: "Insufficient points" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        newPoints = currentPoints - amount;
        break;
      
      case "win":
        // Add points for winning a bet (double the bet amount)
        newPoints = currentPoints + (amount * 2);
        break;
        
      case "refund":
        // Refund points for expired or canceled bets
        newPoints = currentPoints + amount;
        break;
        
      case "initialize":
        // Initialize new user with default points
        newPoints = 50;
        break;
        
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action type" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    // Generate UUID for reference if not provided
    const refId = referenceId || crypto.randomUUID();

    // Use RPC function to update points and record transaction
    const { error: updateError } = await supabase.rpc(
      "update_user_points_transaction",
      {
        user_id_param: userId,
        points_param: newPoints,
        amount_param: amount,
        action_param: action,
        reference_id_param: refId
      }
    );

    if (updateError) {
      console.error("Error updating points:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Error updating points" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        points: newPoints,
        previous: currentPoints,
        change: newPoints - currentPoints
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
