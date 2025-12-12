import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransactionVerifyRequest {
  billing_transaction_id: string;
  bizoffer_id: string;
}

interface TransactionVerifyResponse {
  success: boolean;
  user_id?: string;
  msisdn?: string;
  account_info?: {
    user_id: string;
    msisdn?: string;
    email?: string;
    country?: string;
    subscribed?: boolean;
  };
  error?: string;
  status?: string;
}

interface KlientoTransactionResponse {
  code: number;
  error: number;
  data?: {
    user_id: string;
    msisdn?: string;
    email?: string;
    country?: string;
    subscribed?: boolean;
  };
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

    const { billing_transaction_id, bizoffer_id }: TransactionVerifyRequest = await req.json();

    if (!billing_transaction_id || !bizoffer_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: billing_transaction_id or bizoffer_id",
        } as TransactionVerifyResponse),
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
          error: "Kliento service is not configured",
        } as TransactionVerifyResponse),
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
        } as TransactionVerifyResponse),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const klientoBaseUrl = klientoConfig.api_url;
    const transactionUrl = `${klientoBaseUrl}/accountinfo/getuserbytransaction`;

    console.log(`[kliento-verify-transaction] Verifying transaction: ${billing_transaction_id}`);

    const formData = new URLSearchParams();
    formData.append("billing_transaction_id", billing_transaction_id);
    formData.append("bizoffer_id", bizoffer_id);

    const response = await fetch(transactionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(klientoConfig.api_key ? { "Authorization": `Bearer ${klientoConfig.api_key}` } : {}),
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("[kliento-verify-transaction] Transaction not found (pending)");
        return new Response(
          JSON.stringify({
            success: false,
            status: "pending",
            error: "pending",
          } as TransactionVerifyResponse),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error(`[kliento-verify-transaction] API error: ${response.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `API error: ${response.status}`,
        } as TransactionVerifyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data: KlientoTransactionResponse = await response.json();

    if (data.code !== 200 || data.error !== 0 || !data.data?.user_id) {
      console.log("[kliento-verify-transaction] Invalid response or transaction pending:", data);
      return new Response(
        JSON.stringify({
          success: false,
          status: "pending",
          error: "pending",
        } as TransactionVerifyResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = String(data.data.user_id);
    const msisdn = data.data.msisdn || "";

    console.log(`[kliento-verify-transaction] Transaction verified for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        msisdn,
        account_info: {
          user_id: userId,
          msisdn: data.data.msisdn,
          email: data.data.email,
          country: data.data.country,
          subscribed: data.data.subscribed,
        },
      } as TransactionVerifyResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[kliento-verify-transaction] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      } as TransactionVerifyResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
