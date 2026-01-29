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

// Rate limiting
const paymentAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_PAYMENTS_PER_HOUR = 5;
const HOUR_IN_MS = 60 * 60 * 1000;

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = paymentAttempts.get(ip);

  if (!record) {
    paymentAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_PAYMENTS_PER_HOUR - 1 };
  }

  if (now - record.firstAttempt > HOUR_IN_MS) {
    paymentAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_PAYMENTS_PER_HOUR - 1 };
  }

  if (record.count >= MAX_PAYMENTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_PAYMENTS_PER_HOUR - record.count };
}

// Validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com"
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.some(d => domain?.includes(d));
}

interface TokenPaymentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nit?: string;
  city: string;
  department: string;
  amount: number;
  currency: "GTQ" | "USD";
  donationType: "unica" | "mensual";
  transientToken: string; // JWT token from Flex Microform
}

// Generate SHA-256 digest
async function generateDigest(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return `SHA-256=${toBase64(new Uint8Array(hashBuffer))}`;
}

// Decode secret key
function decodeSecretKey(secretKey: string): Uint8Array {
  const trimmed = secretKey.trim();

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    const out = new Uint8Array(trimmed.length / 2);
    for (let i = 0; i < trimmed.length; i += 2) {
      out[i / 2] = parseInt(trimmed.slice(i, i + 2), 16);
    }
    return out;
  }

  try {
    const padded = trimmed + "===".slice((trimmed.length + 3) % 4);
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
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

// Generate HTTP Signature headers
async function generatePostAuthHeaders(
  resource: string,
  payload: string
): Promise<Record<string, string>> {
  const date = new Date().toUTCString();
  const digest = await generateDigest(payload);

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

// Build payment request using transient token
function buildPaymentRequest(data: TokenPaymentRequest): object {
  const referenceCode = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    clientReferenceInformation: {
      code: referenceCode,
    },
    tokenInformation: {
      transientTokenJwt: data.transientToken,
    },
    orderInformation: {
      amountDetails: {
        totalAmount: data.amount.toFixed(2),
        currency: data.currency,
      },
      billTo: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phone || "",
        address1: `${data.city}, ${data.department}`,
        locality: data.city,
        administrativeArea: data.department,
        country: "GT",
        postalCode: "01001",
      },
    },
    processingInformation: {
      capture: true,
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: "Demasiados intentos de pago. Por favor espera una hora antes de intentar de nuevo.",
          status: "RATE_LIMITED" 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🚀 Processing tokenized payment from IP: ${clientIp}`);

    // Validate credentials
    if (!CYBERSOURCE_MERCHANT_ID || !CYBERSOURCE_KEY_ID || !CYBERSOURCE_SECRET_KEY) {
      console.error("❌ Missing Cybersource credentials");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: TokenPaymentRequest = await req.json();

    // Validate email
    if (!isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: "Correo electrónico inválido", status: "VALIDATION_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isDisposableEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: "No se permiten correos electrónicos temporales", status: "VALIDATION_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (data.amount < 1 || data.amount > 100000) {
      return new Response(
        JSON.stringify({ error: "Monto de donación fuera de rango permitido", status: "VALIDATION_ERROR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.amount || !data.transientToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📋 Payment details:", {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      amount: data.amount,
      currency: data.currency,
      tokenLength: data.transientToken.length,
    });

    // Build payment request with transient token
    const paymentBody = buildPaymentRequest(data);
    const payloadString = JSON.stringify(paymentBody);

    // Generate auth headers
    const resource = "/pts/v2/payments";
    const authHeaders = await generatePostAuthHeaders(resource, payloadString);

    // Call Cybersource API
    const cybersourceUrl = `https://${CYBERSOURCE_HOST}${resource}`;
    console.log("🌐 Calling:", cybersourceUrl);

    const response = await fetch(cybersourceUrl, {
      method: "POST",
      headers: authHeaders,
      body: payloadString,
    });

    const responseText = await response.text();
    console.log("📨 Response status:", response.status);
    console.log("📄 Response:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    if (!response.ok) {
      console.error("❌ Cybersource error:", responseData);
      return new Response(
        JSON.stringify({
          status: "ERROR",
          message: responseData.message || "Error processing payment",
          details: responseData,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = responseData.status;
    console.log("✅ Payment status:", paymentStatus);

    // Save donation to database
    if (paymentStatus === "AUTHORIZED" || paymentStatus === "PENDING") {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Find or create donor
        const { data: existingDonor } = await supabase
          .from("donors")
          .select("id")
          .eq("email", data.email)
          .single();

        let donorId = existingDonor?.id;

        if (!donorId) {
          const { data: newDonor, error: donorError } = await supabase
            .from("donors")
            .insert({
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              phone: data.phone || null,
              nit: data.nit || null,
              address: `${data.city}, ${data.department}`,
            })
            .select("id")
            .single();

          if (donorError) {
            console.error("Error creating donor:", donorError);
          } else {
            donorId = newDonor?.id;
          }
        }

        // Create donation record
        const { error: donationError } = await supabase
          .from("donations")
          .insert({
            donor_id: donorId,
            donor_name: `${data.firstName} ${data.lastName}`,
            donor_email: data.email,
            donor_phone: data.phone || null,
            donor_nit: data.nit || null,
            donor_address: `${data.city}, ${data.department}`,
            amount: data.amount,
            donation_type: data.donationType,
            payment_method: "tarjeta",
            status: paymentStatus === "AUTHORIZED" ? "confirmed" : "pending",
            confirmed_at: paymentStatus === "AUTHORIZED" ? new Date().toISOString() : null,
            source: "online",
            notes: `Cybersource Flex | ID: ${responseData.id || "N/A"}`,
          });

        if (donationError) {
          console.error("Error creating donation:", donationError);
        } else {
          console.log("💾 Donation saved to database");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus,
        message: paymentStatus === "AUTHORIZED" 
          ? "Payment authorized successfully" 
          : paymentStatus === "PENDING"
          ? "Payment is pending"
          : "Payment processed",
        transactionId: responseData.id,
        reconciliationId: responseData.reconciliationId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        status: "ERROR",
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
