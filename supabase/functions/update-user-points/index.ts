
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.37.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  
  // Validate request
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
  
  // Get request data
  let requestData
  try {
    requestData = await req.json()
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid JSON' 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
  
  const { userId, action, amount, referenceId } = requestData
  
  // Basic validation
  if (!userId || !action || amount === undefined) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required fields: userId, action, amount' 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
  
  // Create Supabase client with service role (to bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Get current user points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()
    
    if (userError) {
      console.error('Error fetching user points:', userError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }
    
    const currentPoints = userData.points || 0
    let newPoints = currentPoints
    
    // Process the transaction based on action
    switch (action) {
      case 'bet':
        // Check if user has enough points
        if (currentPoints < amount) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Insufficient points',
            points: currentPoints,
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          })
        }
        newPoints = currentPoints - amount
        break
        
      case 'win':
        // User wins a bet, add points (typically double the bet amount)
        newPoints = currentPoints + amount
        break
        
      case 'refund':
        // Refund points from a cancelled/expired bet
        newPoints = currentPoints + amount
        break
        
      case 'initialize':
        // Initialize user with starting points if they don't have any
        if (currentPoints === 0) {
          newPoints = amount
        }
        break
        
      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        })
    }
    
    // Update user's points and create transaction history
    const { error: updateError } = await supabase.rpc(
      'update_user_points_transaction',
      {
        user_id_param: userId,
        points_param: newPoints,
        amount_param: action === 'bet' ? -amount : amount,
        action_param: action,
        reference_id_param: referenceId || null
      }
    )
    
    if (updateError) {
      console.error('Error updating points:', updateError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to update points' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }
    
    // Return success response with updated points
    return new Response(JSON.stringify({
      success: true,
      points: newPoints,
      previous: currentPoints,
      change: newPoints - currentPoints
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
})
