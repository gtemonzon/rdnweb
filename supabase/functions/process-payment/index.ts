import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

// Base64 encoding helper
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

interface PaymentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nit?: string;
  city: string;
  department: string;
  amount: number;
  donationType: "unica" | "mensual";
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

// Generate SHA-256 digest of the payload
async function generateDigest(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return `SHA-256=${toBase64(new Uint8Array(hashBuffer))}`;
}

// Decode base64 safely
function fromBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate HMAC-SHA256 signature
async function generateSignature(
  secretKey: string,
  signatureString: string
): Promise<string> {
  const encoder = new TextEncoder();
  // Decode the base64 secret key
  const keyData = fromBase64(secretKey);
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
    encoder.encode(signatureString)
  );
  return toBase64(new Uint8Array(signature));
}

// Generate HTTP Signature headers for Cybersource
async function generateAuthHeaders(
  method: string,
  resource: string,
  payload: string
): Promise<Record<string, string>> {
  const date = new Date().toUTCString();
  const digest = await generateDigest(payload);

  // Headers to sign for POST requests
  const headersToSign = "(request-target) host date digest v-c-merchant-id";

  // Build signature string
  const signatureString = [
    `(request-target): ${method.toLowerCase()} ${resource}`,
    `host: ${CYBERSOURCE_HOST}`,
    `date: ${date}`,
    `digest: ${digest}`,
    `v-c-merchant-id: ${CYBERSOURCE_MERCHANT_ID}`,
  ].join("\n");

  console.log("Signature string:", signatureString);

  const signature = await generateSignature(CYBERSOURCE_SECRET_KEY, signatureString);

  const signatureHeader = `keyid="${CYBERSOURCE_KEY_ID}", algorithm="HmacSHA256", headers="${headersToSign}", signature="${signature}"`;

  return {
    host: CYBERSOURCE_HOST,
    date: date,
    digest: digest,
    "v-c-merchant-id": CYBERSOURCE_MERCHANT_ID,
    signature: signatureHeader,
    "Content-Type": "application/json",
  };
}

// Build Cybersource payment request body
function buildPaymentRequest(data: PaymentRequest): object {
  const referenceCode = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Clean card number (remove spaces and dashes)
  const cleanCardNumber = data.cardNumber.replace(/[\s-]/g, "");
  
  // Ensure expiration year is in correct format (2 or 4 digits)
  let expYear = data.expirationYear;
  if (expYear.length === 4) {
    expYear = expYear.slice(-2); // Get last 2 digits
  }

  // Ensure expiration month is 2 digits
  const expMonth = data.expirationMonth.padStart(2, "0");

  return {
    clientReferenceInformation: {
      code: referenceCode,
    },
    paymentInformation: {
      card: {
        number: cleanCardNumber,
        expirationMonth: expMonth,
        expirationYear: expYear,
        securityCode: data.cvv,
      },
    },
    orderInformation: {
      amountDetails: {
        totalAmount: data.amount.toFixed(2),
        currency: "GTQ",
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing payment request...");

    // Validate required environment variables
    if (!CYBERSOURCE_MERCHANT_ID || !CYBERSOURCE_KEY_ID || !CYBERSOURCE_SECRET_KEY) {
      console.error("Missing Cybersource credentials");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: PaymentRequest = await req.json();
    console.log("Payment request data:", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      amount: data.amount,
      donationType: data.donationType,
      // Don't log sensitive card data
    });

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.cardNumber || !data.expirationMonth || !data.expirationYear || !data.cvv) {
      return new Response(
        JSON.stringify({ error: "Missing card information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build payment request
    const paymentBody = buildPaymentRequest(data);
    const payloadString = JSON.stringify(paymentBody);
    console.log("Payment payload prepared");

    // Generate authentication headers
    const resource = "/pts/v2/payments";
    const authHeaders = await generateAuthHeaders("POST", resource, payloadString);
    console.log("Auth headers generated");

    // Call Cybersource API
    const cybersourceUrl = `https://${CYBERSOURCE_HOST}${resource}`;
    console.log("Calling Cybersource API:", cybersourceUrl);

    const response = await fetch(cybersourceUrl, {
      method: "POST",
      headers: authHeaders,
      body: payloadString,
    });

    const responseText = await response.text();
    console.log("Cybersource response status:", response.status);
    console.log("Cybersource response:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    if (!response.ok) {
      console.error("Cybersource error:", responseData);
      return new Response(
        JSON.stringify({
          status: "ERROR",
          message: responseData.message || "Error processing payment",
          details: responseData,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment status
    const paymentStatus = responseData.status;
    console.log("Payment status:", paymentStatus);

    // Save donation to database if payment is successful
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
            notes: `Cybersource ID: ${responseData.id || "N/A"}`,
          });

        if (donationError) {
          console.error("Error creating donation:", donationError);
        } else {
          console.log("Donation saved to database");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Don't fail the payment if DB save fails
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
  } catch (error: any) {
    console.error("Error in process-payment:", error);
    return new Response(
      JSON.stringify({ 
        status: "ERROR",
        error: error.message || "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
