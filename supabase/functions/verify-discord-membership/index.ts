import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Get request body
    const { user_id, tournament_id } = await req.json();
    console.log('[verify-discord-membership] Request received:', {
      user_id,
      tournament_id
    });
    // Validate input
    if (!user_id || !tournament_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'user_id and tournament_id are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 1. Get user's discord_user_id
    const { data: userData, error: userError } = await supabaseClient.from('users').select('discord_user_id').eq('id', user_id).single();
    if (userError || !userData) {
      console.error('[verify-discord-membership] User not found:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const discord_user_id = userData.discord_user_id;
    if (!discord_user_id) {
      console.error('[verify-discord-membership] User has no Discord ID');
      return new Response(JSON.stringify({
        success: false,
        error: 'User has not connected their Discord account',
        status: 'failed',
        is_verified: false
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 2. Get tournament's discord_server_id
    const { data: tournamentData, error: tournamentError } = await supabaseClient.from('tournaments').select('discord_server_id').eq('id', tournament_id).single();
    if (tournamentError || !tournamentData) {
      console.error('[verify-discord-membership] Tournament not found:', tournamentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Tournament not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const discord_server_id = tournamentData.discord_server_id;
    if (!discord_server_id) {
      console.error('[verify-discord-membership] Tournament has no Discord server configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Tournament does not require Discord verification'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 3. Get Discord bot token from platform_api_integration
    const { data: apiIntegrationData, error: apiError } = await supabaseClient.from('platform_api_integration').select('api_credentials').eq('platform_name', 'discord').single();
    if (apiError || !apiIntegrationData) {
      console.error('[verify-discord-membership] Discord API integration not configured:', apiError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Discord API integration not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const api_credentials = apiIntegrationData.api_credentials;
    const bot_token = api_credentials?.bot_token;
    if (!bot_token) {
      console.error('[verify-discord-membership] Discord bot token not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Discord bot token not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 4. Call Discord API to check membership
    console.log(`[verify-discord-membership] Checking if user ${discord_user_id} is in server ${discord_server_id}`);
    const discordApiUrl = `https://discord.com/api/v10/guilds/${discord_server_id}/members/${discord_user_id}`;
    const discordResponse = await fetch(discordApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${bot_token}`,
        'Content-Type': 'application/json'
      }
    });
    let is_verified = false;
    let status = 'failed';
    let error_message = null;
    if (discordResponse.ok) {
      const memberData = await discordResponse.json();
      console.log('[verify-discord-membership] User found in server:', memberData);
      is_verified = true;
      status = 'verified';
    } else if (discordResponse.status === 404) {
      console.log('[verify-discord-membership] User not found in server');
      is_verified = false;
      status = 'left_server';
      error_message = 'User is not a member of the Discord server';
    } else {
      const errorData = await discordResponse.json().catch(()=>({}));
      console.error('[verify-discord-membership] Discord API error:', discordResponse.status, errorData);
      is_verified = false;
      status = 'failed';
      error_message = `Discord API error: ${discordResponse.status}`;
    }
    // 5. Update or insert verification record
    const now = new Date().toISOString();
    const verificationData = {
      user_id,
      tournament_id,
      discord_user_id,
      discord_server_id,
      is_verified,
      status,
      verified_at: is_verified ? now : null,
      last_checked_at: now,
      updated_at: now
    };
    const { data: existingVerification } = await supabaseClient.from('tournament_discord_verification').select('id').eq('user_id', user_id).eq('tournament_id', tournament_id).single();
    if (existingVerification) {
      // Update existing record
      const { error: updateError } = await supabaseClient.from('tournament_discord_verification').update(verificationData).eq('user_id', user_id).eq('tournament_id', tournament_id);
      if (updateError) {
        console.error('[verify-discord-membership] Error updating verification:', updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseClient.from('tournament_discord_verification').insert([
        {
          ...verificationData,
          created_at: now
        }
      ]);
      if (insertError) {
        console.error('[verify-discord-membership] Error inserting verification:', insertError);
      }
    }
    // 6. Return result
    return new Response(JSON.stringify({
      success: true,
      status,
      is_verified,
      discord_user_id,
      discord_server_id,
      verified_at: is_verified ? now : null,
      last_checked_at: now,
      error_message
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[verify-discord-membership] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
