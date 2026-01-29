import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cybersource configuration
const CYBERSOURCE_HOST = "apitest.cybersource.com"; // Use api.cybersource.com for production
const CYBERSOURCE_MERCHANT_ID = Deno.env.get("CYBERSOURCE_MERCHANT_ID") || "";
const CYBERSOURCE_KEY_ID = Deno.env.get("CYBERSOURCE_KEY_ID") || "";
const CYBERSOURCE_SECRET_KEY = Deno.env.get("CYBERSOURCE_SECRET_KEY") || "";

interface CaptureContextRequest {
  targetOrigins: string[];
}

// Generate SHA-256 digest of the payload
async function generateDigest(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return `SHA-256=${toBase64(new Uint8Array(hashBuffer))}`;
}

// Decode secret key with multiple format support
function decodeSecretKey(secretKey: string): Uint8Array {
  const trimmed = secretKey.trim();

  // Hex
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    const out = new Uint8Array(trimmed.length / 2);
    for (let i = 0; i < trimmed.length; i += 2) {
      out[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
    }
    return out;
  }

  // Base64
  try {
    const padded = trimmed + "===".slice((trimmed.length + 3) % 4);
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    // Raw string
    return new TextEncoder().encode(trimmed);
  }
}

// Generate HMAC-SHA256 signature
async function generateSignature(
  secretKey: string,
  signatureString: string
): Promise<string> {
  const keyData = decodeSecretKey(secretKey);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signatureString)
  );
  return toBase64(new Uint8Array(signature));
}

// Generate HTTP Signature headers for POST requests
async function generatePostAuthHeaders(
  resource: string,
  payload: string
): Promise<Record<string, string>> {
  const date = new Date().toUTCString();
  const digest = await generateDigest(payload);

  // Order: host date (request-target) digest v-c-merchant-id
  const headersToSign = "host date (request-target) digest v-c-merchant-id";

  const signatureString = [
    `host: ${CYBERSOURCE_HOST}`,
    `date: ${date}`,
    `(request-target): post ${resource}`,
    `digest: ${digest}`,
    `v-c-merchant-id: ${CYBERSOURCE_MERCHANT_ID}`,
  ].join("\n");

  const signature = await generateSignature(CYBERSOURCE_SECRET_KEY, signatureString);

  const signatureHeader = `keyid="${CYBERSOURCE_KEY_ID}", algorithm="HmacSHA256", headers="${headersToSign}", signature="${signature}"`;

  return {
    Host: CYBERSOURCE_HOST,
    Date: date,
    Digest: digest,
    "v-c-merchant-id": CYBERSOURCE_MERCHANT_ID,
    Signature: signatureHeader,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Generating Flex Microform capture context...");

    // Validate environment variables
    if (!CYBERSOURCE_MERCHANT_ID || !CYBERSOURCE_KEY_ID || !CYBERSOURCE_SECRET_KEY) {
      console.error("❌ Missing Cybersource credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const data: CaptureContextRequest = await req.json();
    
    // Validate target origins
    if (!data.targetOrigins || data.targetOrigins.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "targetOrigins is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📍 Target origins:", data.targetOrigins);

    // Build capture context request payload
    // Flex Microform v2 API
    const captureContextPayload = {
      clientVersion: "v2",
      targetOrigins: data.targetOrigins,
      allowedCardNetworks: [
        "VISA",
        "MASTERCARD",
        "AMEX",
        "DISCOVER"
      ],
      allowedPaymentTypes: ["CARD"],
    };

    const payloadString = JSON.stringify(captureContextPayload);
    console.log("📦 Capture context payload:", payloadString);

    // Generate authentication headers
    // Try the Flex v2 sessions endpoint first
    let resource = "/flex/v2/sessions";
    let authHeaders = await generatePostAuthHeaders(resource, payloadString);
    let cybersourceUrl = `https://${CYBERSOURCE_HOST}${resource}`;
    console.log("🌐 Calling Flex v2:", cybersourceUrl);

    let response = await fetch(cybersourceUrl, {
      method: "POST",
      headers: authHeaders,
      body: payloadString,
    });

    let responseText = await response.text();
    console.log("📨 Flex v2 Response status:", response.status);

    // If Flex v2 fails, try the microform endpoint
    if (!response.ok) {
      console.log("⚠️ Flex v2 failed, trying /microform/v2/sessions...");
      resource = "/microform/v2/sessions";
      authHeaders = await generatePostAuthHeaders(resource, payloadString);
      cybersourceUrl = `https://${CYBERSOURCE_HOST}${resource}`;

      response = await fetch(cybersourceUrl, {
        method: "POST",
        headers: authHeaders,
        body: payloadString,
      });

      responseText = await response.text();
      console.log("📨 Microform v2 Response status:", response.status);
    }

    console.log("📄 Response:", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));

    if (!response.ok) {
      console.error("❌ Cybersource API error:", response.status);
      
      // Try to parse error response
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw: responseText };
      }

      // Provide clear error messages for common cases
      let errorMessage = `Cybersource API error (${response.status})`;
      if (response.status === 401) {
        errorMessage = "El servicio Flex Microform no está habilitado para esta cuenta. Contacta a NeoNet/VisaNet para solicitar la activación del servicio 'Flex Microform' o 'Secure Acceptance'.";
      } else if (response.status === 404) {
        errorMessage = "Endpoint no encontrado. El servicio Flex Microform puede no estar habilitado.";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          status: response.status,
          details: errorData,
          suggestion: "Contacta a NeoNet/VisaNet y solicita la habilitación del servicio 'Flex Microform' para tokenización segura de tarjetas.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The capture context is returned as a JWT token in the response body
    // For Flex Microform v2, the response body IS the JWT capture context
    console.log("✅ Capture context generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        captureContext: responseText, // JWT token
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
