import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface KlientoLoginRequest {
  msisdn: string;
  password: string;
  product_id: string;
}

interface KlientoLoginResponse {
  success: boolean;
  user_id?: string;
  error?: string;
  message?: string;
}

interface KlientoApiResponse {
  code: number;
  error: number;
  data?: KlientoUserData[];
}

interface KlientoUserData {
  user_id: string;
  msisdn?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  country?: string;
  subscribed?: boolean;
  total_credit?: number;
  offer?: KlientoOffer[];
}

interface KlientoOffer {
  account_offer_id: number;
  bizoffer_id: string;
  status: string;
  expire_date?: string;
}

interface KlientoAccountInfo {
  user_id: string;
  email?: string;
  country?: string;
  subscribed?: boolean;
  total_credit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { msisdn, password, product_id }: KlientoLoginRequest = await req.json();

    if (!msisdn || !password || !product_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: msisdn, password, or product_id",
        } as KlientoLoginResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: klientoConfig, error: configError } = await supabase
      .from("platform_api_integrations")
      .select("api_url, api_key, is_active")
      .eq("api_name", "kliento")
      .maybeSingle();

    if (configError || !klientoConfig) {
      console.error("Failed to fetch Kliento config:", configError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kliento authentication service is not configured",
        } as KlientoLoginResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!klientoConfig.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kliento authentication service is currently disabled",
        } as KlientoLoginResponse),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const klientoBaseUrl = klientoConfig.api_url;
    const loginUrl = `${klientoBaseUrl}/login/dve`;

    console.log(`[kliento-auth] Attempting login for MSISDN: ${msisdn.substring(0, 4)}***`);

    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(klientoConfig.api_key ? { "Authorization": `Bearer ${klientoConfig.api_key}` } : {}),
      },
      body: JSON.stringify({
        msisdn,
        password,
        product_id,
      }),
    });

    const loginData: KlientoApiResponse = await loginResponse.json();

    if (!loginResponse.ok || loginData.code !== 200 || loginData.error !== 0) {
      console.error("[kliento-auth] Login failed:", loginData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Authentication failed (code: ${loginData.code}, error: ${loginData.error})`,
          message: "Invalid credentials or user not found",
        } as KlientoLoginResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!loginData.data || loginData.data.length === 0) {
      console.error("[kliento-auth] No user data in response:", loginData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "No user data returned from authentication service",
        } as KlientoLoginResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = loginData.data[0];
    const userId = userData.user_id;

    if (!userId) {
      console.error("[kliento-auth] No user_id in response:", loginData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid response from authentication service",
        } as KlientoLoginResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accountInfo: KlientoAccountInfo = {
      user_id: userId,
      email: userData.email,
      country: userData.country,
      subscribed: userData.subscribed,
      total_credit: userData.total_credit,
    };

    console.log(`[kliento-auth] Login successful for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        account_info: accountInfo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[kliento-auth] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred during authentication",
      } as KlientoLoginResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});