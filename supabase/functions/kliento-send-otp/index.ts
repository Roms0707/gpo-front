import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendOtpRequest {
  phone_number: string;
  project_config_id: string;
  country_code?: string;
}

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  expires_in_seconds?: number;
}

interface SenditoApiResponse {
  code: number;
  error: number;
  message?: string;
}

function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 10000).toString().padStart(4, "0");
  return otp;
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
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

    const { phone_number, project_config_id, country_code }: SendOtpRequest = await req.json();

    if (!phone_number || !project_config_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: phone_number or project_config_id",
        } as SendOtpResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: projectConfig, error: configError } = await supabase
      .from("project_configurations")
      .select("id, kliento_auth_type, product_id")
      .eq("id", project_config_id)
      .eq("is_active", true)
      .maybeSingle();

    if (configError || !projectConfig) {
      console.error("[kliento-send-otp] Project config not found:", configError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid project configuration",
        } as SendOtpResponse),
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
        } as SendOtpResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: senditoConfig, error: senditoError } = await supabase
      .from("platform_api_integrations")
      .select("api_url, api_key, is_active, extra_config")
      .eq("api_name", "sendito")
      .maybeSingle();

    if (senditoError || !senditoConfig) {
      console.error("[kliento-send-otp] Sendito config not found:", senditoError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMS service is not configured",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!senditoConfig.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SMS service is currently disabled",
        } as SendOtpResponse),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: klientoConfig, error: klientoError } = await supabase
      .from("platform_api_integrations")
      .select("extra_config")
      .eq("api_name", "kliento")
      .maybeSingle();

    if (klientoError || !klientoConfig) {
      console.error("[kliento-send-otp] Kliento config not found:", klientoError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication service is not configured",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const operationId = klientoConfig.extra_config?.operation_id;
    if (!operationId) {
      console.error("[kliento-send-otp] operation_id not found in Kliento config");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication service configuration incomplete",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: invalidateError } = await supabase
      .from("kliento_otp_codes")
      .update({ status: "invalidated" })
      .eq("phone_number", phone_number)
      .eq("project_config_id", project_config_id)
      .eq("status", "valid");

    if (invalidateError) {
      console.warn("[kliento-send-otp] Failed to invalidate previous OTPs:", invalidateError);
    }

    const otpCode = generateOtp();
    const otpHash = await hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 60 * 1000);

    console.log(`[kliento-send-otp] Generated OTP for ${phone_number.substring(0, 4)}***: ${otpCode}`);

    const { error: insertError } = await supabase
      .from("kliento_otp_codes")
      .insert({
        phone_number,
        otp_code_hash: otpHash,
        status: "valid",
        expires_at: expiresAt.toISOString(),
        attempt_count: 0,
        project_config_id,
      });

    if (insertError) {
      console.error("[kliento-send-otp] Failed to insert OTP:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to generate OTP",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const messageTemplate = senditoConfig.extra_config?.message_template || "Your verification code is: {otp}";
    const message = messageTemplate.replace("{otp}", otpCode);

    const offerId = projectConfig.product_id;
    const sesameLogin = senditoConfig.api_key;
    const sesamePassword = senditoConfig.extra_config?.api_secret_key;

    if (!offerId) {
      console.error("[kliento-send-otp] product_id not found in project configuration");
      await supabase
        .from("kliento_otp_codes")
        .update({ status: "invalidated" })
        .eq("phone_number", phone_number)
        .eq("otp_code_hash", otpHash);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Project configuration incomplete",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!sesamePassword) {
      console.error("[kliento-send-otp] api_secret_key not found in Sendito config");
      await supabase
        .from("kliento_otp_codes")
        .update({ status: "invalidated" })
        .eq("phone_number", phone_number)
        .eq("otp_code_hash", otpHash);

      return new Response(
        JSON.stringify({
          success: false,
          error: "SMS service configuration incomplete",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resolvedCountryCode = country_code || "ET";

    const formData = new URLSearchParams();
    formData.append("type", "push");
    formData.append("message", message);
    formData.append("destination", phone_number);
    formData.append("country", resolvedCountryCode);
    formData.append("offer_id", offerId);
    formData.append("operation_id", operationId);
    formData.append("sesame_login", sesameLogin);
    formData.append("sesame_password", sesamePassword);

    console.log(`[kliento-send-otp] Sending SMS to ${phone_number.substring(0, 4)}*** via Sendito`);
    console.log(`[kliento-send-otp] Request params: type=push, country=${resolvedCountryCode}, offer_id=${offerId}, operation_id=${operationId}`);

    const smsResponse = await fetch(senditoConfig.api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const smsResultText = await smsResponse.text();
    console.log(`[kliento-send-otp] Sendito response status: ${smsResponse.status}`);
    console.log(`[kliento-send-otp] Sendito raw response: ${smsResultText}`);

    let smsResult: SenditoApiResponse;
    try {
      smsResult = JSON.parse(smsResultText);
    } catch {
      console.error("[kliento-send-otp] Failed to parse Sendito response as JSON");
      await supabase
        .from("kliento_otp_codes")
        .update({ status: "invalidated" })
        .eq("phone_number", phone_number)
        .eq("otp_code_hash", otpHash);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid response from SMS service",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (smsResult.code !== 202 || smsResult.error !== 0) {
      console.error("[kliento-send-otp] SMS send failed:", smsResult);

      await supabase
        .from("kliento_otp_codes")
        .update({ status: "invalidated" })
        .eq("phone_number", phone_number)
        .eq("otp_code_hash", otpHash);

      return new Response(
        JSON.stringify({
          success: false,
          error: smsResult.message || "Failed to send SMS. Please try again.",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[kliento-send-otp] SMS sent successfully to ${phone_number.substring(0, 4)}***`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        expires_in_seconds: 60,
      } as SendOtpResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[kliento-send-otp] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      } as SendOtpResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
