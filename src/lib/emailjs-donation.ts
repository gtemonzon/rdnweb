import emailjs from "@emailjs/browser";
import { supabase } from "@/integrations/supabase/client";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
const DONOR_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_DONATION_TEMPLATE_ID || "";

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
 * Uses sessionStorage for idempotency.
 */
export const sendDevDonationEmailJS = async (data: DonationEmailData) => {
  if (!isConfigured()) {
    console.log("[EmailJS-Dev] Not configured, skipping");
    return;
  }

  // Idempotency
  const key = `emailjs_sent_${data.reference_number}`;
  if (sessionStorage.getItem(key) === "true") {
    console.log("[EmailJS-Dev] Already sent for", data.reference_number);
    return;
  }

  // Check environment from DB
  try {
    const { data: settings } = await supabase
      .from("donation_settings")
      .select("environment")
      .limit(1)
      .maybeSingle();

    if (settings?.environment === "production") {
      console.log("[EmailJS-Dev] Production environment — skipping EmailJS");
      return;
    }
  } catch {
    // If we can't check, default to sending (dev safety net)
  }

  const currencySymbol = data.currency === "USD" ? "US$" : "Q";

  const templateParams = {
    donor_name: data.donor_name || "Donante",
    donor_email: data.donor_email,
    amount: `${currencySymbol}${data.amount}`,
    currency: data.currency || "GTQ",
    reference_number: data.reference_number,
    transaction_id: data.transaction_id || "N/A",
    site_base_url: window.location.origin,
    thank_you_message:
      "¡Gracias por tu generosa donación! Tu apoyo marca una diferencia real en la vida de los niños y niñas que atendemos.",
    to_email: data.donor_email,
  };

  try {
    const res = await emailjs.send(SERVICE_ID, DONOR_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("[EmailJS-Dev] Donor email sent", res.status, res.text);
    sessionStorage.setItem(key, "true");
  } catch (err) {
    console.error("[EmailJS-Dev] Failed to send donor email:", err);
    // Non-blocking — don't throw
  }
};
