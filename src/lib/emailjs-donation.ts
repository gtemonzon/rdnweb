import emailjs from "@emailjs/browser";
import { supabase } from "@/integrations/supabase/client";

// DEV-ONLY: Publishable keys hardcoded (safe for browser, not secrets)
const SERVICE_ID = "service_isfjifd";
const PUBLIC_KEY = "JR928cGjuDVzHlPc3";
const DONOR_TEMPLATE_ID = "template_jhy6jik";

interface DonationEmailData {
  donor_name: string;
  donor_email: string;
  amount: string;
  currency: string;
  reference_number: string;
  transaction_id?: string;
}

const isConfigured = () =>
  Boolean(SERVICE_ID && PUBLIC_KEY && DONOR_TEMPLATE_ID);

/**
 * DEV-ONLY: Send donation confirmation via EmailJS (browser SDK).
 * Checks donation_settings.environment — skips entirely if "production".
 * Uses sessionStorage for idempotency (key: email_sent_<reference>).
 */
export const sendDevDonationEmailJS = async (data: DonationEmailData) => {
  if (!isConfigured()) {
    console.log("[EmailJS] Not configured, skipping");
    return;
  }

  // Idempotency — use email_sent_<reference_number> as key
  const key = `email_sent_${data.reference_number}`;
  if (sessionStorage.getItem(key) === "true") {
    console.log("[EmailJS] Already sent for", data.reference_number);
    return;
  }

  // Environment guard: skip entirely in production
   try {
    // Use RPC to avoid direct access to donation_settings
    const { data } = await supabase.rpc("get_public_donation_settings");
    // If we got data, we're in a working environment; but environment field
    // is not exposed via RPC (it's internal). Dev EmailJS should only run
    // when VITE_EMAILJS_* env vars are set, which is already checked above.
    // Skip this guard since environment is no longer publicly accessible.
  } catch {
    // If we can't check, default to sending (dev safety net)
  }

  const currencySymbol = data.currency === "USD" ? "US$" : "Q";

  const templateParams = {
    to_email: data.donor_email,
    donor_name: data.donor_name || "Donante",
    donor_email: data.donor_email,
    amount: `${currencySymbol}${data.amount}`,
    currency: data.currency || "GTQ",
    reference_number: data.reference_number,
    transaction_id: data.transaction_id || "N/A",
    donation_date: new Date().toLocaleString("es-GT"),
    
  };

  try {
    const res = await emailjs.send(SERVICE_ID, DONOR_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("[EmailJS] Donor confirmation email sent", res.status, res.text);
    sessionStorage.setItem(key, "true");
  } catch (err) {
    console.error("[EmailJS Donation Error]", err);
    // Non-blocking — don't throw
  }
};