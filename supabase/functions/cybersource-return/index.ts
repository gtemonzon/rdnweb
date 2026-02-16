import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * cybersource-return: Receives the Cybersource Secure Acceptance POST redirect.
 *
 * WHY THIS EXISTS:
 * Cybersource Hosted Checkout sends transaction results as a signed POST
 * (application/x-www-form-urlencoded) to the "Transaction Response Page".
 * A React SPA route cannot reliably receive that POST directly, so we need
 * this backend endpoint to:
 * 1. Parse the form-encoded body
 * 2. Verify the HMAC-SHA256 signature (mandatory to prevent tampering)
 * 3. Trigger email notifications on success
 * 4. Redirect the browser to the SPA with query params
 */

const FRONTEND_BASE = "https://rdnweb.lovable.app";

async function verifySignature(
  secretKey: string,
  signedFieldNames: string,
  params: Record<string, string>,
  receivedSignature: string
): Promise<boolean> {
  const dataToSign = signedFieldNames
    .split(",")
    .map((field) => `${field}=${params[field] ?? ""}`)
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
  const sigArray = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < sigArray.length; i++) {
    binary += String.fromCharCode(sigArray[i]);
  }
  const computedSignature = btoa(binary);
  return computedSignature === receivedSignature;
}

serve(async (req) => {
  // Only POST is expected from Cybersource
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse form-urlencoded body
    const body = await req.text();
    const formData = new URLSearchParams(body);
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    const signedFieldNames = params["signed_field_names"] || "";
    const receivedSignature = params["signature"] || "";

    // --- Signature verification (mandatory) ---
    const secretKey = Deno.env.get("CYBERSOURCE_SA_SECRET_KEY");
    if (!secretKey) {
      console.error("CYBERSOURCE_SA_SECRET_KEY not configured");
      return redirectToFrontend("error", {}, "Configuración incompleta");
    }

    if (!signedFieldNames || !receivedSignature) {
      console.error("Missing signed_field_names or signature in Cybersource response");
      return redirectToFrontend("error", params, "Firma faltante");
    }

    const valid = await verifySignature(secretKey, signedFieldNames, params, receivedSignature);
    if (!valid) {
      console.error("Signature verification FAILED – possible tampering");
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Signature verified OK for ref:", params["req_reference_number"] || params["reference_number"]);

    // --- Determine payment status ---
    const decision = (params["decision"] || "").toUpperCase();
    const reasonCode = params["reason_code"] || "";
    const isSuccess = decision === "ACCEPT" || reasonCode === "100";

    // Extract donor/transaction details
    const refNumber = params["req_reference_number"] || params["reference_number"] || "";
    const amount = params["req_amount"] || params["auth_amount"] || "";
    const currency = params["req_currency"] || params["auth_currency"] || "";
    const billEmail = params["req_bill_to_email"] || "";
    const billForename = params["req_bill_to_forename"] || "";
    const billSurname = params["req_bill_to_surname"] || "";
    const transactionId = params["transaction_id"] || "";
    const cardType = params["req_card_type"] || "";
    const rawCardNumber = params["req_card_number"] || "";
    const cardLast4 = rawCardNumber.length >= 4 ? rawCardNumber.slice(-4) : rawCardNumber;

    // --- On success: send notification emails ---
    if (isSuccess) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

        if (supabaseUrl && supabaseKey) {
          const notifyPayload = {
            donor_name: `${billForename} ${billSurname}`.trim() || "Donante anónimo",
            donor_email: billEmail,
            amount,
            currency: currency || "GTQ",
            reference: refNumber,
            transaction_id: transactionId,
            card_type: cardType,
            card_last4: cardLast4,
            date: new Date().toLocaleString("es-GT"),
          };

          const resp = await fetch(`${supabaseUrl}/functions/v1/notify-donation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify(notifyPayload),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            console.error("notify-donation call failed:", resp.status, errText);
          } else {
            await resp.text(); // consume body
            console.log("notify-donation sent successfully");
          }
        } else {
          console.error("SUPABASE_URL or SUPABASE_ANON_KEY not set, skipping notification");
        }
      } catch (emailErr) {
        // Never block the user flow for email failures
        console.error("Error calling notify-donation:", emailErr);
      }
    }

    // --- Redirect to frontend ---
    return redirectToFrontend(
      decision || reasonCode || "error",
      {
        decision: params["decision"] || "",
        reason_code: reasonCode,
        req_reference_number: refNumber,
        req_amount: amount,
        req_currency: currency,
        req_bill_to_email: billEmail,
        req_bill_to_forename: billForename,
        req_bill_to_surname: billSurname,
        transaction_id: transactionId,
        req_card_type: cardType,
        req_card_number: cardLast4 ? `xxxx${cardLast4}` : "",
        message: params["message"] || "",
        notified: isSuccess ? "1" : "0",
      }
    );
  } catch (error) {
    console.error("cybersource-return error:", error);
    return redirectToFrontend("error", {}, "Error interno");
  }
});

function redirectToFrontend(
  _status: string,
  queryParams: Record<string, string>,
  _errorMsg?: string
): Response {
  const url = new URL("/pago/resultado", FRONTEND_BASE);
  for (const [key, value] of Object.entries(queryParams)) {
    if (value) url.searchParams.set(key, value);
  }
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}
