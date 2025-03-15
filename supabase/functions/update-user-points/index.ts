
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables')
    }
    
    // Client for authenticated user operations
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    
    // Admin client for backend operations that bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get user ID from authenticated session
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession()
    
    if (authError || !session) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const userId = session.user.id
    
    // Parse request body
    const { action, amount, betId } = await req.json()
    
    if (!action || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processing points transaction: ${action} ${amount} points for user ${userId}`)
    
    // Get current user points
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
    
    if (userError) {
      console.error('Error fetching user points:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const currentPoints = userData.points || 0
    let newPoints = currentPoints
    
    // Process different actions
    switch (action) {
      case 'bet':
        // Deduct points for placing a bet
        if (currentPoints < amount) {
          return new Response(
            JSON.stringify({ success: false, error: 'Insufficient points' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        newPoints = currentPoints - amount
        break
        
      case 'win':
        // Add points for winning a bet (original bet + winnings)
        newPoints = currentPoints + (amount * 2)
        break
        
      case 'init':
        // Initialize user with starting points if needed
        if (currentPoints === 0) {
          newPoints = 50 // Default starting points
        } else {
          // User already has points, no change needed
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'User already has points', 
              currentPoints 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
        
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
    
    // Update user points in transaction
    const { error: txError } = await supabaseAdmin.rpc('update_user_points_transaction', {
      user_id_param: userId,
      points_param: newPoints,
      amount_param: action === 'bet' ? -amount : amount,
      action_param: action,
      reference_id_param: betId || null
    })
    
    if (txError) {
      console.error('Transaction error:', txError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        previousPoints: currentPoints,
        currentPoints: newPoints,
        action,
        amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});
