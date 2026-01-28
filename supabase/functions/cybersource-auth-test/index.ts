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

interface TestRequest {
  merchantId: string;
  keyId: string;
  secretKey: string;
  environment: "test" | "production";
}

// Generate SHA-256 digest
async function generateDigest(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return `SHA-256=${toBase64(new Uint8Array(hashBuffer))}`;
}

// Decode secret key with multiple format support
function decodeSecretKey(secretKey: string): { bytes: Uint8Array; format: string } {
  const trimmed = secretKey.trim();

  // Try Hex format
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    const out = new Uint8Array(trimmed.length / 2);
    for (let i = 0; i < trimmed.length; i += 2) {
      out[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
    }
    return { bytes: out, format: "hex" };
  }

  // Try Base64 format
  try {
    const padded = trimmed + "===".slice((trimmed.length + 3) % 4);
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { bytes, format: "base64" };
  } catch {
    // Fallback to raw string
    return { bytes: new TextEncoder().encode(trimmed), format: "raw" };
  }
}

// Generate HMAC-SHA256 signature
async function generateSignature(
  secretKey: string,
  signatureString: string
): Promise<{ signature: string; keyFormat: string }> {
  const { bytes: keyData, format } = decodeSecretKey(secretKey);

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
  return { 
    signature: toBase64(new Uint8Array(signature)),
    keyFormat: format
  };
}

// Generate HTTP Signature headers
async function generateAuthHeaders(
  merchantId: string,
  keyId: string,
  secretKey: string,
  host: string,
  method: string,
  resource: string,
  payload: string
): Promise<{ headers: Record<string, string>; debug: Record<string, unknown> }> {
  const date = new Date().toUTCString();
  const digest = await generateDigest(payload);

  const headersToSign = "(request-target) host date digest v-c-merchant-id";

  const signatureString = [
    `(request-target): ${method.toLowerCase()} ${resource}`,
    `host: ${host}`,
    `date: ${date}`,
    `digest: ${digest}`,
    `v-c-merchant-id: ${merchantId}`,
  ].join("\n");

  const { signature, keyFormat } = await generateSignature(secretKey, signatureString);

  const signatureHeader = `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersToSign}", signature="${signature}"`;

  return {
    headers: {
      Host: host,
      Date: date,
      Digest: digest,
      "v-c-merchant-id": merchantId,
      Signature: signatureHeader,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    debug: {
      signatureString,
      signatureStringLines: signatureString.split("\n"),
      keyFormat,
      digest,
      date,
      signatureHeaderLength: signatureHeader.length,
    }
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${msg}`);
    console.log(msg);
  };

  try {
    log("🚀 Starting Cybersource authentication test...");

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", logs }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token", logs }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    log(`✅ User authenticated: ${userId}`);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Admin role required", logs }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    log("✅ Admin role verified");

    const data: TestRequest = await req.json();
    const { merchantId, keyId, secretKey, environment } = data;

    // Validate inputs
    if (!merchantId || !keyId || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing credentials", logs }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const host = environment === "production" 
      ? "api.cybersource.com" 
      : "apitest.cybersource.com";

    log(`📍 Environment: ${environment} (${host})`);
    log(`🔑 Merchant ID: ${merchantId} (length: ${merchantId.length})`);
    log(`🔑 Key ID: ${keyId} (length: ${keyId.length}, suffix: ...${keyId.slice(-6)})`);
    log(`🔑 Secret Key length: ${secretKey.length} chars`);

    // Build a minimal test payload
    const testPayload = {
      clientReferenceInformation: {
        code: `TEST-${Date.now()}`,
      },
      paymentInformation: {
        card: {
          number: "4111111111111111",
          expirationMonth: "12",
          expirationYear: "26",
          securityCode: "123",
        },
      },
      orderInformation: {
        amountDetails: {
          totalAmount: "1.00",
          currency: "GTQ",
        },
        billTo: {
          firstName: "Test",
          lastName: "User",
          email: "test@test.com",
          address1: "Test Address",
          locality: "Guatemala",
          administrativeArea: "Guatemala",
          country: "GT",
          postalCode: "01001",
        },
      },
      processingInformation: {
        capture: false, // Auth only, no capture
      },
    };

    const payloadString = JSON.stringify(testPayload);
    log(`📦 Payload size: ${payloadString.length} bytes`);

    const resource = "/pts/v2/payments";
    const { headers: authHeaders, debug } = await generateAuthHeaders(
      merchantId,
      keyId,
      secretKey,
      host,
      "POST",
      resource,
      payloadString
    );

    log(`🔐 Key format detected: ${debug.keyFormat}`);
    log(`📝 Signature string (lines):`);
    (debug.signatureStringLines as string[]).forEach((line, i) => {
      log(`   ${i + 1}: ${line}`);
    });
    log(`📋 Digest: ${debug.digest}`);
    log(`📅 Date header: ${debug.date}`);

    const cybersourceUrl = `https://${host}${resource}`;
    log(`🌐 Calling: ${cybersourceUrl}`);

    const response = await fetch(cybersourceUrl, {
      method: "POST",
      headers: authHeaders,
      body: payloadString,
    });

    const responseText = await response.text();
    log(`📨 Response status: ${response.status}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.status === 401) {
      log(`❌ Authentication Failed`);
      log(`📄 Response: ${JSON.stringify(responseData)}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication Failed (401)",
          status: response.status,
          response: responseData,
          logs,
          debug: {
            keyFormat: debug.keyFormat,
            merchantIdLength: merchantId.length,
            keyIdLength: keyId.length,
            secretKeyLength: secretKey.length,
            environment,
            host,
          },
          suggestions: [
            "Verify that the Merchant ID matches exactly (no spaces, correct case)",
            "Verify that the Key ID is the correct API Key ID from Cybersource portal",
            "Verify that the Shared Secret Key was copied completely (no missing characters)",
            `Confirm credentials are for the ${environment} environment`,
            "Check if the API credentials have expired or been regenerated",
            "Try regenerating new API credentials in the Cybersource portal",
          ],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.ok || response.status === 201) {
      log(`✅ Authentication Successful!`);
      log(`📄 Transaction ID: ${responseData.id || "N/A"}`);
      log(`📄 Status: ${responseData.status || "N/A"}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Authentication successful! Credentials are valid.",
          status: response.status,
          transactionId: responseData.id,
          paymentStatus: responseData.status,
          logs,
          debug: {
            keyFormat: debug.keyFormat,
            environment,
            host,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Other errors
    log(`⚠️ Unexpected response: ${response.status}`);
    log(`📄 Response: ${JSON.stringify(responseData)}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: `Unexpected response: ${response.status}`,
        status: response.status,
        response: responseData,
        logs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log(`💥 Error: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
