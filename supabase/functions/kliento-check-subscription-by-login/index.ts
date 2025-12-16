import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckSubscriptionRequest {
  login: string;
  project_config_id: string;
}

interface CheckSubscriptionResponse {
  success: boolean;
  isSubscribed?: boolean;
  phoneNumber?: string;
  userId?: string;
  redirectUrl?: string;
  error?: string;
}

interface KlientoOffer {
  account_offer_id: string;
  bizoffer_id: string;
  status?: string;
  expire_date?: string;
}

interface KlientoAccountInfoResponse {
  code: number;
  error: number;
  data?: Array<{
    user_id: string;
    msisdn?: string;
    subscribed: boolean;
    suspended?: boolean;
    status?: string;
    offer?: KlientoOffer[];
  }>;
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

    const { login, project_config_id }: CheckSubscriptionRequest = await req.json();

    if (!login || !project_config_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: login or project_config_id",
        } as CheckSubscriptionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: projectConfig, error: projectConfigError } = await supabase
      .from("project_configurations")
      .select("id, product_id, subscription_redirect_url, kliento_auth_type")
      .eq("id", project_config_id)
      .eq("is_active", true)
      .maybeSingle();

    if (projectConfigError || !projectConfig) {
      console.error("[kliento-check-subscription-by-login] Project config not found:", projectConfigError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid project configuration",
        } as CheckSubscriptionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (projectConfig.kliento_auth_type !== "otp") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OTP authentication is not enabled for this project",
        } as CheckSubscriptionResponse),
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
      console.error("[kliento-check-subscription-by-login] Kliento config not found:", configError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kliento service is not configured",
        } as CheckSubscriptionResponse),
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
          error: "Kliento service is currently disabled",
        } as CheckSubscriptionResponse),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const klientoBaseUrl = klientoConfig.api_url;
    const accountInfoUrl = `${klientoBaseUrl}/accountinfo/all`;

    console.log(`[kliento-check-subscription-by-login] Checking subscription for login: ${login.substring(0, 4)}***`);

    const formData = new URLSearchParams();
    formData.append("login", login);
    formData.append("product_id", projectConfig.product_id || "");
    formData.append("service_id", projectConfig.product_id || "");

    const response = await fetch(accountInfoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(klientoConfig.api_key ? { "Authorization": `Bearer ${klientoConfig.api_key}` } : {}),
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log(`[kliento-check-subscription-by-login] Response status: ${response.status}`);
    console.log(`[kliento-check-subscription-by-login] Raw response: ${responseText}`);

    if (!response.ok) {
      console.error(`[kliento-check-subscription-by-login] API error: ${response.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: "User not found or not subscribed",
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let data: KlientoAccountInfoResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("[kliento-check-subscription-by-login] Failed to parse response as JSON");
      return new Response(
        JSON.stringify({
          success: false,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: "Invalid response from authentication service",
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (data.code !== 200 || data.error !== 0 || !data.data || data.data.length === 0) {
      console.log("[kliento-check-subscription-by-login] User not found in Kliento:", data);
      return new Response(
        JSON.stringify({
          success: false,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: "User not found",
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accountInfo = data.data[0];
    const isSubscribed = accountInfo.subscribed === true;
    const isSuspended = accountInfo.suspended === true;
    const hasValidOffer = Array.isArray(accountInfo.offer) && accountInfo.offer.length > 0;
    const firstOffer = hasValidOffer ? accountInfo.offer![0] : null;

    console.log(`[kliento-check-subscription-by-login] User ${accountInfo.user_id}: subscribed=${isSubscribed}, suspended=${isSuspended}, hasValidOffer=${hasValidOffer}`);
    if (firstOffer) {
      console.log(`[kliento-check-subscription-by-login] First offer - bizoffer_id: ${firstOffer.bizoffer_id}, status: ${firstOffer.status || 'N/A'}`);
    }

    if (!isSubscribed || isSuspended || !hasValidOffer) {
      let errorMessage = "Subscription required";
      if (isSuspended) {
        errorMessage = "Account is suspended";
      } else if (isSubscribed && !hasValidOffer) {
        errorMessage = "No active offer found";
      }

      return new Response(
        JSON.stringify({
          success: true,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: errorMessage,
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        isSubscribed: true,
        phoneNumber: accountInfo.msisdn || login,
        userId: accountInfo.user_id,
      } as CheckSubscriptionResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[kliento-check-subscription-by-login] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      } as CheckSubscriptionResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});