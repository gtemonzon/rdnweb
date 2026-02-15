import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDateTimeUTC(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function generateUUID(): string {
  return crypto.randomUUID();
}

async function signFields(
  secretKey: string,
  signedFieldNames: string,
  params: Record<string, string>
): Promise<string> {
  const dataToSign = signedFieldNames
    .split(",")
    .map((field) => `${field}=${params[field]}`)
    .join(",");

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const data = encoder.encode(dataToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const signatureArray = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < signatureArray.length; i++) {
    binary += String.fromCharCode(signatureArray[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency, reference_number, locale, donor_email, donor_first_name, donor_last_name, bill_address1, bill_city, bill_country, test_mode } = await req.json();

    if (!amount || !currency) {
      return new Response(
        JSON.stringify({ error: "amount and currency are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileId = Deno.env.get("CYBERSOURCE_SA_PROFILE_ID");
    const accessKey = Deno.env.get("CYBERSOURCE_SA_ACCESS_KEY");
    const secretKey = Deno.env.get("CYBERSOURCE_SA_SECRET_KEY");

    if (!profileId || !accessKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Secure Acceptance credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactionUuid = generateUUID();
    const signedDateTime = formatDateTimeUTC();
    const refNumber = reference_number || `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const formattedAmount = parseFloat(amount).toFixed(2);

    const signedFieldNames = [
      "access_key",
      "profile_id",
      "transaction_uuid",
      "signed_field_names",
      "unsigned_field_names",
      "signed_date_time",
      "locale",
      "transaction_type",
      "reference_number",
      "amount",
      "currency",
      "bill_to_email",
      "bill_to_forename",
      "bill_to_surname",
      "bill_to_address_line1",
      "bill_to_address_city",
      "bill_to_address_country",
    ].join(",");

    const params: Record<string, string> = {
      access_key: accessKey,
      profile_id: profileId,
      transaction_uuid: transactionUuid,
      signed_field_names: signedFieldNames,
      unsigned_field_names: "",
      signed_date_time: signedDateTime,
      locale: locale || "es",
      transaction_type: "sale",
      reference_number: refNumber,
      amount: formattedAmount,
      currency: currency,
      bill_to_email: donor_email || "",
      bill_to_forename: donor_first_name || "",
      bill_to_surname: donor_last_name || "",
      bill_to_address_line1: bill_address1 || "",
      bill_to_address_city: bill_city || "",
      bill_to_address_country: bill_country || "GT",
    };

    const signature = await signFields(secretKey, signedFieldNames, params);

    // Determine the correct Cybersource URL
    const cybersourceUrl = test_mode === false
      ? "https://secureacceptance.cybersource.com/pay"
      : "https://testsecureacceptance.cybersource.com/pay";

    return new Response(
      JSON.stringify({
        success: true,
        cybersource_url: cybersourceUrl,
        fields: {
          ...params,
          signature,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error signing fields:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
