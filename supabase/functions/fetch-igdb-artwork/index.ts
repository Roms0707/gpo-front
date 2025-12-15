import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IGDBArtwork {
  id: number;
  game: number;
  image_id: string;
  width: number;
  height: number;
}

interface IGDBScreenshot {
  id: number;
  game: number;
  image_id: string;
  width: number;
  height: number;
}

interface IGDBGame {
  id: number;
  name: string;
  artworks?: number[];
  screenshots?: number[];
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

const getTwitchAccessToken = async (clientId: string, clientSecret: string): Promise<string> => {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    console.log("[IGDB] Using cached access token");
    return cachedAccessToken;
  }

  console.log("[IGDB] Requesting new access token from Twitch");
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
    console.error(`[IGDB] Token request failed: ${tokenResponse.status} - ${errorText}`);
    throw new Error(`Failed to get Twitch access token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("No access token received from Twitch");
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + (tokenData.expires_in - 300) * 1000;
  console.log("[IGDB] New access token obtained and cached");
  return cachedAccessToken;
};

const searchIGDBGame = async (
  gameName: string,
  clientId: string,
  accessToken: string
): Promise<IGDBGame | null> => {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `search "${gameName}"; fields id, name, artworks, screenshots; limit 1;`
  });

  if (!response.ok) {
    console.error(`[IGDB] Game search failed for ${gameName}: ${response.status}`);
    return null;
  }

  const games: IGDBGame[] = await response.json();
  return games.length > 0 ? games[0] : null;
};

const fetchArtworkForGame = async (
  artworkIds: number[],
  clientId: string,
  accessToken: string
): Promise<string | null> => {
  if (!artworkIds || artworkIds.length === 0) {
    return null;
  }

  const idsString = artworkIds.join(",");
  const response = await fetch("https://api.igdb.com/v4/artworks", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `where id = (${idsString}); fields id, image_id, width, height; sort width desc; limit 10;`
  });

  if (!response.ok) {
    console.error(`[IGDB] Artwork fetch failed: ${response.status}`);
    return null;
  }

  const artworks: IGDBArtwork[] = await response.json();

  const landscapeArtwork = artworks.find(a => a.width > a.height);
  const selectedArtwork = landscapeArtwork || artworks[0];

  if (selectedArtwork?.image_id) {
    return `https://images.igdb.com/igdb/image/upload/t_1080p/${selectedArtwork.image_id}.jpg`;
  }

  return null;
};

const fetchScreenshotForGame = async (
  screenshotIds: number[],
  clientId: string,
  accessToken: string
): Promise<string | null> => {
  if (!screenshotIds || screenshotIds.length === 0) {
    return null;
  }

  const idsString = screenshotIds.join(",");
  const response = await fetch("https://api.igdb.com/v4/screenshots", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `where id = (${idsString}); fields id, image_id, width, height; sort width desc; limit 10;`
  });

  if (!response.ok) {
    console.error(`[IGDB] Screenshot fetch failed: ${response.status}`);
    return null;
  }

  const screenshots: IGDBScreenshot[] = await response.json();

  const landscapeScreenshot = screenshots.find(s => s.width > s.height);
  const selectedScreenshot = landscapeScreenshot || screenshots[0];

  if (selectedScreenshot?.image_id) {
    return `https://images.igdb.com/igdb/image/upload/t_1080p/${selectedScreenshot.image_id}.jpg`;
  }

  return null;
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

    console.log("[IGDB] Starting IGDB artwork sync");

    const { data: twitchApiConfig, error: configError } = await supabase
      .from("platform_api_integrations")
      .select("api_key, api_url")
      .eq("api_name", "Twitch API")
      .eq("is_active", true)
      .single();

    if (configError || !twitchApiConfig) {
      console.error("[IGDB] Twitch API configuration not found:", configError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Twitch API configuration not found" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let twitchCredentials;
    try {
      twitchCredentials = JSON.parse(twitchApiConfig.api_key);
    } catch (parseError) {
      console.error("[IGDB] Error parsing Twitch API credentials:", parseError);
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
      .select("id, name, igdb_game_id, igdb_artwork_url, igdb_last_updated");

    if (gamesError) {
      console.error("[IGDB] Error fetching games:", gamesError.message);
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
      if (!game.igdb_artwork_url) return true;
      if (!game.igdb_last_updated) return true;
      return new Date(game.igdb_last_updated) < sevenDaysAgo;
    });

    if (gamesToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: "All IGDB artwork is up to date" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[IGDB] Updating artwork for ${gamesToUpdate.length} games`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const game of gamesToUpdate) {
      try {
        let igdbGameId = game.igdb_game_id;

        if (!igdbGameId) {
          const igdbGame = await searchIGDBGame(game.name, client_id, accessToken);
          if (igdbGame) {
            igdbGameId = igdbGame.id.toString();

            let imageUrl: string | null = null;
            let imageSource = "";

            if (igdbGame.artworks && igdbGame.artworks.length > 0) {
              imageUrl = await fetchArtworkForGame(igdbGame.artworks, client_id, accessToken);
              if (imageUrl) imageSource = "artwork";
            }

            if (!imageUrl && igdbGame.screenshots && igdbGame.screenshots.length > 0) {
              imageUrl = await fetchScreenshotForGame(igdbGame.screenshots, client_id, accessToken);
              if (imageUrl) imageSource = "screenshot";
            }

            if (imageUrl) {
              const { error: updateError } = await supabase
                .from("games")
                .update({
                  igdb_game_id: igdbGameId,
                  igdb_artwork_url: imageUrl,
                  igdb_last_updated: new Date().toISOString()
                })
                .eq("id", game.id);

              if (updateError) {
                console.error(`[IGDB] Error updating game ${game.name}:`, updateError);
                failedCount++;
              } else {
                updatedCount++;
                console.log(`[IGDB] Updated ${game.name} with ${imageSource}`);
              }
            } else {
              const { error: updateError } = await supabase
                .from("games")
                .update({
                  igdb_game_id: igdbGameId,
                  igdb_last_updated: new Date().toISOString()
                })
                .eq("id", game.id);

              if (updateError) {
                console.error(`[IGDB] Error updating game ID for ${game.name}:`, updateError);
              }
              console.log(`[IGDB] No artwork or screenshots for ${game.name}, saved IGDB ID`);
            }
          } else {
            console.log(`[IGDB] No IGDB match found for ${game.name}`);
            failedCount++;
          }
        } else {
          const igdbGame = await searchIGDBGame(game.name, client_id, accessToken);
          if (igdbGame) {
            let imageUrl: string | null = null;
            let imageSource = "";

            if (igdbGame.artworks && igdbGame.artworks.length > 0) {
              imageUrl = await fetchArtworkForGame(igdbGame.artworks, client_id, accessToken);
              if (imageUrl) imageSource = "artwork";
            }

            if (!imageUrl && igdbGame.screenshots && igdbGame.screenshots.length > 0) {
              imageUrl = await fetchScreenshotForGame(igdbGame.screenshots, client_id, accessToken);
              if (imageUrl) imageSource = "screenshot";
            }

            if (imageUrl) {
              const { error: updateError } = await supabase
                .from("games")
                .update({
                  igdb_artwork_url: imageUrl,
                  igdb_last_updated: new Date().toISOString()
                })
                .eq("id", game.id);

              if (updateError) {
                console.error(`[IGDB] Error updating ${game.name}:`, updateError);
                failedCount++;
              } else {
                updatedCount++;
                console.log(`[IGDB] Refreshed ${game.name} with ${imageSource}`);
              }
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (gameError) {
        console.error(`[IGDB] Error processing game ${game.name}:`, gameError);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        failed: failedCount,
        total: gamesToUpdate.length,
        message: `Updated ${updatedCount} of ${gamesToUpdate.length} games (${failedCount} failed)`
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
    console.error("[IGDB] Error in fetch-igdb-artwork function:", error);
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