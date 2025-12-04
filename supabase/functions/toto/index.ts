import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
serve(async (req)=>{
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  // Initialize Supabase client
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  try {
    console.log("[Toto Function] Starting to fetch users with email addresses");
    // Get all users with email addresses
    const { data: users, error: usersError, count } = await supabase.from('users').select(`
        id,
        username,
        email,
        type,
        country,
        created_at,
        avatar_url
      `, {
      count: 'exact'
    }).not('email', 'is', null).neq('email', '').order('created_at', {
      ascending: false
    });
    if (usersError) {
      console.error("[Toto Function] Error fetching users:", usersError.message);
      return new Response(JSON.stringify({
        success: false,
        error: `Error fetching users: ${usersError.message}`
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    console.log(`[Toto Function] Successfully fetched ${users?.length || 0} users with email addresses`);
    // Format the response
    const formattedUsers = (users || []).map((user)=>({
        id: user.id,
        username: user.username || 'Unknown',
        email: user.email,
        type: user.type || 'gamer',
        country: user.country || undefined,
        created_at: user.created_at,
        avatar_url: user.avatar_url || undefined
      }));
    const response = {
      success: true,
      data: formattedUsers,
      count: count || 0
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("[Toto Function] Unexpected error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
