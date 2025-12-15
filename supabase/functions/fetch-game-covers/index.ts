import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

interface TwitchGamesResponse {
  data: TwitchGame[];
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

const getTwitchAccessToken = async (clientId: string, clientSecret: string): Promise<string> => {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    console.log("[Twitch Games] Using cached access token");
    return cachedAccessToken;
  }

  console.log("[Twitch Games] Requesting new access token");
  const tokenUrl = "https://id.twitch.tv/oauth2/token";
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials"
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString()
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error(`[Twitch Games] Token request failed: ${tokenResponse.status} - ${errorText}`);
    throw new Error(`Failed to get Twitch access token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("No access token received from Twitch");
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + (tokenData.expires_in - 300) * 1000;
  console.log("[Twitch Games] New access token obtained and cached");
  return cachedAccessToken;
};

const fetchGameCovers = async (
  gameNames: string[],
  clientId: string,
  accessToken: string
): Promise<Map<string, { twitchId: string; coverUrl: string }>> => {
  const coverMap = new Map<string, { twitchId: string; coverUrl: string }>();

  const chunks: string[][] = [];
  for (let i = 0; i < gameNames.length; i += 100) {
    chunks.push(gameNames.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const queryParams = chunk.map(name => `name=${encodeURIComponent(name)}`).join("&");
    const gamesUrl = `https://api.twitch.tv/helix/games?${queryParams}`;

    console.log(`[Twitch Games] Fetching covers for ${chunk.length} games`);

    const response = await fetch(gamesUrl, {
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      console.error(`[Twitch Games] API error: ${response.status}`);
      continue;
    }

    const data: TwitchGamesResponse = await response.json();

    for (const game of data.data) {
      const coverUrl = game.box_art_url
        .replace("{width}", "600")
        .replace("{height}", "800");
      
      coverMap.set(game.name.toLowerCase(), {
        twitchId: game.id,
        coverUrl: coverUrl
      });
    }
  }

  return coverMap;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("[Twitch Games] Starting game cover sync");

    const { data: twitchApiConfig, error: configError } = await supabase
      .from("platform_api_integrations")
      .select("api_key, api_url")
      .eq("api_name", "Twitch API")
      .eq("is_active", true)
      .single();

    if (configError || !twitchApiConfig) {
      console.error("[Twitch Games] Twitch API configuration not found:", configError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Twitch API configuration not found" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let twitchCredentials;
    try {
      twitchCredentials = JSON.parse(twitchApiConfig.api_key);
    } catch (parseError) {
      console.error("[Twitch Games] Error parsing Twitch API credentials:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Twitch API credentials format" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { client_id, client_secret } = twitchCredentials;

    if (!client_id || !client_secret) {
      return new Response(
        JSON.stringify({ success: false, error: "Twitch client ID or secret not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const accessToken = await getTwitchAccessToken(client_id, client_secret);

    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, name, twitch_cover_url, twitch_game_id, cover_last_updated");

    if (gamesError) {
      console.error("[Twitch Games] Error fetching games:", gamesError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Error fetching games" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: "No games found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const gamesToUpdate = games.filter(game => {
      if (!game.twitch_cover_url) return true;
      if (!game.cover_last_updated) return true;
      return new Date(game.cover_last_updated) < sevenDaysAgo;
    });

    if (gamesToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: "All game covers are up to date" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[Twitch Games] Updating covers for ${gamesToUpdate.length} games`);

    const gameNames = gamesToUpdate.map(g => g.name);
    const coverMap = await fetchGameCovers(gameNames, client_id, accessToken);

    let updatedCount = 0;
    for (const game of gamesToUpdate) {
      const coverData = coverMap.get(game.name.toLowerCase());
      if (coverData) {
        const { error: updateError } = await supabase
          .from("games")
          .update({
            twitch_cover_url: coverData.coverUrl,
            twitch_game_id: coverData.twitchId,
            cover_last_updated: new Date().toISOString()
          })
          .eq("id", game.id);

        if (updateError) {
          console.error(`[Twitch Games] Error updating game ${game.name}:`, updateError);
        } else {
          updatedCount++;
          console.log(`[Twitch Games] Updated cover for ${game.name}`);
        }
      } else {
        console.log(`[Twitch Games] No Twitch match found for ${game.name}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: gamesToUpdate.length,
        message: `Updated ${updatedCount} of ${gamesToUpdate.length} game covers`
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("[Twitch Games] Error in fetch-game-covers function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});