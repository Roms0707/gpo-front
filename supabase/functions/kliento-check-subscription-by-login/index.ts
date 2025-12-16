import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const TEST_MODE = true;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckSubscriptionRequest {
  login: string;
  project_config_id: string;
}

interface KlientoOfferClientInfo {
  atom_pack?: string;
  offer_price?: string;
  lastCycleDate?: string;
  nextCycleDate?: string;
  billingchannel?: string;
  expirationDate?: string;
  suspensionDate?: string;
  lastInvoiceDate?: string;
  nextInvoiceDate?: string;
  subscription_id?: string;
  cancellationDate?: string;
  premiumStartDate?: string;
  subscription_date?: string;
  offer_billingchannel?: string;
  evt_subscription_status?: string;
  offer_mccmnc?: string;
}

interface KlientoOffer {
  type?: string;
  account_offer_id: string | number;
  bizoffer_id: string;
  billing_type?: string;
  status?: string;
  ins_date?: string;
  upd_date?: string;
  expire_date?: string;
  client_offer_infos?: KlientoOfferClientInfo;
  product_id?: string;
  atom_product_id?: string;
  billingchannel?: string;
  billingchannel_label?: string;
}

interface BillingInfo {
  bizoffer_id: string;
  billing_type: string;
  billingchannel: string;
  billingchannel_label: string;
  product_id: string;
  atom_product_id: string;
  subscription_id: string;
  offer_price: string;
  offer_mccmnc: string;
  evt_subscription_status: string;
}

interface CheckSubscriptionResponse {
  success: boolean;
  isSubscribed?: boolean;
  phoneNumber?: string;
  userId?: string;
  redirectUrl?: string;
  billingInfo?: BillingInfo;
  error?: string;
}

interface KlientoMsisdnExistsResponse {
  code: number;
  error: number;
  data?: {
    success?: string;
  };
}

interface KlientoLoginExistsResponse {
  code: number;
  error: number;
  data?: {
    success?: string;
  };
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

const KLIENTO_BASE_URL = "https://userv1.dv-content.io";

function extractBillingInfo(offer: KlientoOffer): BillingInfo {
  return {
    bizoffer_id: offer.bizoffer_id || "",
    billing_type: offer.billing_type || "",
    billingchannel: offer.billingchannel || "",
    billingchannel_label: offer.billingchannel_label || "",
    product_id: offer.product_id || "",
    atom_product_id: offer.atom_product_id || "",
    subscription_id: offer.client_offer_infos?.subscription_id || "",
    offer_price: offer.client_offer_infos?.offer_price || "",
    offer_mccmnc: offer.client_offer_infos?.offer_mccmnc || "",
    evt_subscription_status: offer.client_offer_infos?.evt_subscription_status || "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (TEST_MODE) {
    const { login }: CheckSubscriptionRequest = await req.json();
    const testPhoneNumber = login?.startsWith("+") ? login : `+${login}`;
    console.log("[kliento-check-subscription-by-login] TEST MODE ENABLED - Bypassing subscription check");
    console.log(`[kliento-check-subscription-by-login] TEST MODE - Using phone: ${testPhoneNumber.substring(0, 4)}***`);
    return new Response(
      JSON.stringify({
        success: true,
        isSubscribed: true,
        phoneNumber: testPhoneNumber,
        userId: "test-user-12345",
        billingInfo: {
          bizoffer_id: "4691",
          billing_type: "bod",
          billingchannel: "3",
          billingchannel_label: "MNO",
          product_id: "1894",
          atom_product_id: "1894",
          subscription_id: "test-subscription-id",
          offer_price: "10",
          offer_mccmnc: "60400",
          evt_subscription_status: "ACTIVE",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

    const productId = projectConfig.product_id || "";
    const encodedLogin = encodeURIComponent(login.startsWith("+") ? login : `+${login}`);

    console.log(`[kliento-check-subscription-by-login] Checking subscription for login: ${login.substring(0, 4)}***`);
    console.log(`[kliento-check-subscription-by-login] Product ID: ${productId}`);

    let klientoUserId: string | null = null;

    console.log("[kliento-check-subscription-by-login] Step 1: Calling ismsisdnexists...");
    const msisdnExistsUrl = `${KLIENTO_BASE_URL}/accountinfo/ismsisdnexists?msisdn=${encodedLogin}`;
    console.log(`[kliento-check-subscription-by-login] URL: ${msisdnExistsUrl}`);

    try {
      const msisdnResponse = await fetch(msisdnExistsUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const msisdnText = await msisdnResponse.text();
      console.log(`[kliento-check-subscription-by-login] ismsisdnexists response: ${msisdnText}`);

      if (msisdnResponse.ok) {
        try {
          const msisdnData: KlientoMsisdnExistsResponse = JSON.parse(msisdnText);
          if (msisdnData.code === 200 && msisdnData.error === 0 && msisdnData.data?.success) {
            klientoUserId = msisdnData.data.success;
            console.log(`[kliento-check-subscription-by-login] Found user_id from ismsisdnexists: ${klientoUserId}`);
          }
        } catch {
          console.log("[kliento-check-subscription-by-login] Failed to parse ismsisdnexists response");
        }
      }
    } catch (err) {
      console.log("[kliento-check-subscription-by-login] ismsisdnexists request failed:", err);
    }

    if (!klientoUserId) {
      console.log("[kliento-check-subscription-by-login] Step 2: Calling isloginexists (fallback)...");
      const loginExistsUrl = `${KLIENTO_BASE_URL}/accountinfo/isloginexists?msisdn=${encodedLogin}&product_id=${productId}&service_id=${productId}`;
      console.log(`[kliento-check-subscription-by-login] URL: ${loginExistsUrl}`);

      try {
        const loginResponse = await fetch(loginExistsUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const loginText = await loginResponse.text();
        console.log(`[kliento-check-subscription-by-login] isloginexists response: ${loginText}`);

        if (loginResponse.ok) {
          try {
            const loginData: KlientoLoginExistsResponse = JSON.parse(loginText);
            if (loginData.code === 200 && loginData.error === 0 && loginData.data?.success) {
              klientoUserId = loginData.data.success;
              console.log(`[kliento-check-subscription-by-login] Found user_id from isloginexists: ${klientoUserId}`);
            }
          } catch {
            console.log("[kliento-check-subscription-by-login] Failed to parse isloginexists response");
          }
        }
      } catch (err) {
        console.log("[kliento-check-subscription-by-login] isloginexists request failed:", err);
      }
    }

    if (!klientoUserId) {
      console.log("[kliento-check-subscription-by-login] User not found in Kliento");
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

    console.log("[kliento-check-subscription-by-login] Step 3: Calling accountinfo/all...");
    const accountInfoUrl = `${KLIENTO_BASE_URL}/accountinfo/all?user_id=${klientoUserId}&service_id=${productId}&product_id=${productId}`;
    console.log(`[kliento-check-subscription-by-login] URL: ${accountInfoUrl}`);

    const accountResponse = await fetch(accountInfoUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const accountText = await accountResponse.text();
    console.log(`[kliento-check-subscription-by-login] accountinfo/all response status: ${accountResponse.status}`);
    console.log(`[kliento-check-subscription-by-login] accountinfo/all raw response: ${accountText}`);

    if (!accountResponse.ok) {
      console.error(`[kliento-check-subscription-by-login] accountinfo/all API error: ${accountResponse.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: "Failed to retrieve account information",
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let accountData: KlientoAccountInfoResponse;
    try {
      accountData = JSON.parse(accountText);
    } catch {
      console.error("[kliento-check-subscription-by-login] Failed to parse accountinfo/all response");
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

    if (accountData.code !== 200 || accountData.error !== 0 || !accountData.data || accountData.data.length === 0) {
      console.log("[kliento-check-subscription-by-login] No account data found:", accountData);
      return new Response(
        JSON.stringify({
          success: false,
          isSubscribed: false,
          redirectUrl: projectConfig.subscription_redirect_url || undefined,
          error: "Account information not found",
        } as CheckSubscriptionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accountInfo = accountData.data[0];
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

    const billingInfo = firstOffer ? extractBillingInfo(firstOffer) : undefined;

    return new Response(
      JSON.stringify({
        success: true,
        isSubscribed: true,
        phoneNumber: accountInfo.msisdn || login,
        userId: accountInfo.user_id,
        billingInfo,
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