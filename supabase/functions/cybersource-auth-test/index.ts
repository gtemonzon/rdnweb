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

// Generate HTTP Signature headers for GET requests (no digest)
async function generateGetAuthHeaders(
  merchantId: string,
  keyId: string,
  secretKey: string,
  host: string,
  resource: string
): Promise<{ headers: Record<string, string>; debug: Record<string, unknown> }> {
  const date = new Date().toUTCString();

  const headersToSign = "(request-target) host date v-c-merchant-id";

  const signatureString = [
    `(request-target): get ${resource}`,
    `host: ${host}`,
    `date: ${date}`,
    `v-c-merchant-id: ${merchantId}`,
  ].join("\n");

  const { signature, keyFormat } = await generateSignature(secretKey, signatureString);

  const signatureHeader = `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersToSign}", signature="${signature}"`;

  return {
    headers: {
      Host: host,
      Date: date,
      "v-c-merchant-id": merchantId,
      Signature: signatureHeader,
      Accept: "application/json",
    },
    debug: {
      signatureString,
      signatureStringLines: signatureString.split("\n"),
      keyFormat,
      date,
    }
  };
}

// Generate HTTP Signature headers for POST requests
async function generatePostAuthHeaders(
  merchantId: string,
  keyId: string,
  secretKey: string,
  host: string,
  resource: string,
  payload: string
): Promise<{ headers: Record<string, string>; debug: Record<string, unknown> }> {
  const date = new Date().toUTCString();
  const digest = await generateDigest(payload);

  const headersToSign = "(request-target) host date digest v-c-merchant-id";

  const signatureString = [
    `(request-target): post ${resource}`,
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

    // ========== STEP 1: Test credential validity with a GET endpoint ==========
    log("\n📋 PASO 1: Verificando validez de credenciales...");
    
    const verifyResource = "/reporting/v3/report-definitions";
    const { headers: verifyHeaders } = await generateGetAuthHeaders(
      merchantId,
      keyId,
      secretKey,
      host,
      verifyResource
    );

    const verifyUrl = `https://${host}${verifyResource}`;
    log(`🌐 Calling verification endpoint: ${verifyUrl}`);

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: verifyHeaders,
    });

    const verifyText = await verifyResponse.text();
    log(`📨 Verification response status: ${verifyResponse.status}`);

    let credentialsValid = false;
    
    if (verifyResponse.status === 401) {
      log("❌ Credenciales inválidas (error 401 en endpoint de verificación)");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Credenciales inválidas (401 Unauthorized)",
          errorType: "auth_failed",
          status: 401,
          logs,
          debug: {
            keyFormat: decodeSecretKey(secretKey).format,
            merchantIdLength: merchantId.length,
            keyIdLength: keyId.length,
            secretKeyLength: secretKey.length,
            environment,
            host,
          },
          suggestions: [
            "Verifica que el Merchant ID coincide exactamente (sin espacios, mayúsculas correctas)",
            "Verifica que el Key ID es el API Key ID correcto del portal de Cybersource",
            "Verifica que el Shared Secret Key fue copiado completamente (sin caracteres faltantes)",
            `Confirma que las credenciales son para el ambiente ${environment}`,
            "Revisa si las credenciales API han expirado o fueron regeneradas",
            "Intenta regenerar nuevas credenciales API en el portal de Cybersource",
          ],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (verifyResponse.ok || verifyResponse.status === 200) {
      credentialsValid = true;
      log("✅ Credenciales válidas (verificación exitosa)");
    } else {
      // Other status codes - credentials might still be valid
      log(`⚠️ Verification endpoint returned ${verifyResponse.status}, proceeding with payment test...`);
      credentialsValid = true; // Assume valid and test payment endpoint
    }

    // ========== STEP 2: Test payment endpoint ==========
    log("\n💳 PASO 2: Probando endpoint de pagos...");

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
        capture: false,
      },
    };

    const payloadString = JSON.stringify(testPayload);
    log(`📦 Payload size: ${payloadString.length} bytes`);

    const paymentResource = "/pts/v2/payments";
    const { headers: paymentHeaders, debug } = await generatePostAuthHeaders(
      merchantId,
      keyId,
      secretKey,
      host,
      paymentResource,
      payloadString
    );

    log(`🔐 Key format detected: ${debug.keyFormat}`);
    log(`📝 Signature string (lines):`);
    (debug.signatureStringLines as string[]).forEach((line, i) => {
      log(`   ${i + 1}: ${line}`);
    });

    const paymentUrl = `https://${host}${paymentResource}`;
    log(`🌐 Calling: ${paymentUrl}`);

    const paymentResponse = await fetch(paymentUrl, {
      method: "POST",
      headers: paymentHeaders,
      body: payloadString,
    });

    const responseText = await paymentResponse.text();
    log(`📨 Payment response status: ${paymentResponse.status}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Handle 404 - Service not enabled
    if (paymentResponse.status === 404) {
      log(`⚠️ Error 404: Servicio de pagos no habilitado`);
      log(`📄 Response: ${JSON.stringify(responseData)}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Servicio REST API Payments no habilitado (404)",
          errorType: "service_not_enabled",
          status: 404,
          credentialsValid,
          response: responseData,
          logs,
          debug: {
            keyFormat: debug.keyFormat,
            merchantIdLength: merchantId.length,
            keyIdLength: keyId.length,
            secretKeyLength: secretKey.length,
            environment,
            host,
            credentialsVerified: credentialsValid,
          },
          visanetInstructions: {
            title: "Acción requerida: Contactar a VisaNet Guatemala",
            message: "El servicio 'REST API Payments' no está habilitado para esta cuenta. Este servicio debe ser activado por VisaNet antes de poder procesar transacciones.",
            steps: [
              "Contacta a tu representante de VisaNet Guatemala",
              "Solicita la activación del servicio 'REST API Payments' para tu cuenta sandbox",
              "Menciona que usas una integración REST API directa (server-to-server) con HTTP Signature authentication",
              `Especifica el endpoint que necesitas: POST /pts/v2/payments`,
              `Proporciona tu Merchant ID: ${merchantId}`,
            ],
            technicalNote: "Las credenciales parecen ser válidas, pero el endpoint de pagos retorna 404 porque el servicio no ha sido habilitado por el proveedor.",
          },
          suggestions: [
            "Contacta a VisaNet Guatemala para solicitar la activación del servicio 'REST API Payments'",
            "Confirma que tu cuenta sandbox tiene habilitada la integración REST API directa",
            "Pregunta específicamente por el endpoint POST /pts/v2/payments",
            "Este NO es un problema de credenciales, es una configuración de cuenta pendiente",
          ],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle 401 on payment endpoint specifically
    if (paymentResponse.status === 401) {
      log(`❌ Authentication Failed on payment endpoint`);
      log(`📄 Response: ${JSON.stringify(responseData)}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication Failed (401)",
          errorType: "auth_failed",
          status: 401,
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
            "Verifica que el Merchant ID coincide exactamente (sin espacios, mayúsculas correctas)",
            "Verifica que el Key ID es el API Key ID correcto del portal de Cybersource",
            "Verifica que el Shared Secret Key fue copiado completamente",
            `Confirma que las credenciales son para el ambiente ${environment}`,
            "Revisa si las credenciales API han expirado o fueron regeneradas",
          ],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success cases
    if (paymentResponse.ok || paymentResponse.status === 201) {
      log(`✅ ¡Autenticación y prueba de pago exitosas!`);
      log(`📄 Transaction ID: ${responseData.id || "N/A"}`);
      log(`📄 Status: ${responseData.status || "N/A"}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "¡Autenticación exitosa! Las credenciales son válidas y el servicio de pagos está habilitado.",
          errorType: null,
          status: paymentResponse.status,
          transactionId: responseData.id,
          paymentStatus: responseData.status,
          logs,
          debug: {
            keyFormat: debug.keyFormat,
            environment,
            host,
            credentialsVerified: true,
            paymentServiceEnabled: true,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Other errors
    log(`⚠️ Unexpected response: ${paymentResponse.status}`);
    log(`📄 Response: ${JSON.stringify(responseData)}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: `Respuesta inesperada: ${paymentResponse.status}`,
        errorType: "unexpected",
        status: paymentResponse.status,
        response: responseData,
        logs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`💥 Error: ${errorMessage}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        errorType: "exception",
        logs,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
