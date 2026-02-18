/**
 * notify-donation — Sends post-payment email notifications via M365 SMTP.
 * Replaces Resend. Uses nodemailer with STARTTLS on port 587.
 * Templates are configurable via donation_settings in the database.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.13";

const ALLOWED_ORIGINS = [
  "https://rdnweb.lovable.app",
  "https://id-preview--8ca09022-0199-4307-b785-5e989c90c25b.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface DonationNotification {
  donor_name: string;
  donor_email: string;
  amount: string;
  currency: string;
  reference: string;
  transaction_id?: string;
  card_type?: string;
  card_last4?: string;
  date: string;
  skip_idempotency?: boolean;
}

interface DonationSettings {
  environment: string;
  sender_email_name: string;
  sender_email_address: string | null;
  accounting_emails: string[];
  accounting_email_subject: string;
  accounting_email_body: string | null;
  donor_email_enabled: boolean;
  donor_email_subject: string;
  donor_email_body: string | null;
  send_donor_email: boolean;
  send_accounting_email: boolean;
}

// ── Template ───────────────────────────────────────────────────────────────
function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function defaultAccountingHtml(vars: Record<string, string>): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#0067B1;">Donación confirmada por tarjeta</h2>
      <p style="background:#d4edda;padding:12px;border-radius:8px;border-left:4px solid #28a745;">
        <strong>✅ Estado:</strong> Pago autorizado
      </p>
      <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin-top:0;color:#333;">Datos del donante</h3>
        <p><strong>Nombre:</strong> ${vars.donor_name}</p>
        <p><strong>Correo:</strong> ${vars.donor_email}</p>
      </div>
      <div style="background:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin-top:0;color:#0067B1;">Detalles de la donación</h3>
        <p><strong>Monto:</strong> <span style="font-size:1.5em;color:#0067B1;">${vars.currency_symbol}${vars.amount}</span></p>
        <p><strong>Método de pago:</strong> ${vars.card_info}</p>
        <p><strong>Fecha:</strong> ${vars.date}</p>
        <p><strong>Referencia:</strong> ${vars.reference}</p>
        ${vars.transaction_id ? `<p><strong>ID de transacción:</strong> ${vars.transaction_id}</p>` : ""}
      </div>
    </div>`;
}

function defaultDonorHtml(vars: Record<string, string>): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#0067B1;">¡Gracias por tu donación!</h2>
      <p>Hola ${vars.donor_name},</p>
      <p>Tu donación de <strong>${vars.currency_symbol}${vars.amount}</strong> ha sido procesada exitosamente.</p>
      <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Monto:</strong> ${vars.currency_symbol}${vars.amount}</p>
        <p><strong>Fecha:</strong> ${vars.date}</p>
        <p><strong>Referencia:</strong> ${vars.reference}</p>
      </div>
      <p>Tu recibo deducible de impuestos será enviado a tu correo electrónico.</p>
      <p>Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan.</p>
      <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
    </div>`;
}

// ── SMTP sender ────────────────────────────────────────────────────────────
async function sendViaSMTP(
  to: string,
  subject: string,
  html: string,
  fromName: string,
): Promise<{ success: boolean; error?: string }> {
  const host = Deno.env.get("SMTP_HOST");
  const port = Deno.env.get("SMTP_PORT");
  const user = Deno.env.get("SMTP_USERNAME");
  const pass = Deno.env.get("SMTP_PASSWORD");

  if (!host || !port || !user || !pass) {
    return { success: false, error: "SMTP configuration incomplete" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  });

  try {
    await transporter.sendMail({
      from: `${fromName} <${user}>`,
      to,
      subject,
      html,
    });
    transporter.close();
    console.log("[notify-donation] SMTP email sent to:", to);
    return { success: true };
  } catch (err: any) {
    transporter.close();
    console.error("[notify-donation] SMTP error sending to", to, ":", err?.message, err?.code);
    return { success: false, error: err?.message || "SMTP send failed" };
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const data: DonationNotification = await req.json();
    console.log("[notify-donation] Invoked, reference:", data.reference);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let settings: DonationSettings | null = null;

    if (supabaseUrl && supabaseServiceKey) {
      const sb = createClient(supabaseUrl, supabaseServiceKey);

      // Idempotency check
      if (data.reference && !data.skip_idempotency) {
        const { data: existing } = await sb
          .from("donation_notification_log")
          .select("id")
          .eq("reference_number", data.reference)
          .eq("notification_type", "payment")
          .maybeSingle();

        if (existing) {
          console.log("[notify-donation] Already notified for ref:", data.reference);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "already_notified" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      const { data: settingsRow } = await sb
        .from("donation_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsRow) settings = settingsRow as unknown as DonationSettings;
    }

    // Default settings fallback
    if (!settings) {
      settings = {
        environment: "production",
        sender_email_name: "El Refugio de la Niñez",
        sender_email_address: null,
        accounting_emails: ["contabilidad@refugiodelaninez.org"],
        accounting_email_subject: "💳 Donación confirmada: {{currency_symbol}}{{amount}} – Ref: {{reference}}",
        accounting_email_body: null,
        donor_email_enabled: true,
        donor_email_subject: "Gracias por tu donación – El Refugio de la Niñez",
        donor_email_body: null,
        send_donor_email: true,
        send_accounting_email: true,
      };
    }

    const currencySymbol = data.currency === "USD" ? "US$" : "Q";
    const cardInfo =
      data.card_type && data.card_last4
        ? `${data.card_type} ****${data.card_last4}`
        : "Tarjeta de crédito/débito";

    const templateVars: Record<string, string> = {
      donor_name: data.donor_name,
      donor_email: data.donor_email,
      amount: data.amount,
      currency: data.currency,
      currency_symbol: currencySymbol,
      reference: data.reference,
      transaction_id: data.transaction_id || "",
      card_type: data.card_type || "",
      card_last4: data.card_last4 || "",
      card_info: cardInfo,
      date: data.date,
    };

    const senderName = settings.sender_email_name || "El Refugio de la Niñez";
    const errors: string[] = [];

    // ── Accounting notification ─────────────────────────────────────────────
    if (settings.send_accounting_email && settings.accounting_emails.length > 0) {
      const acctSubject = applyTemplate(settings.accounting_email_subject, templateVars);
      const acctHtml = settings.accounting_email_body
        ? applyTemplate(settings.accounting_email_body, templateVars)
        : defaultAccountingHtml(templateVars);

      for (const email of settings.accounting_emails) {
        const result = await sendViaSMTP(email.trim(), acctSubject, acctHtml, senderName);
        if (!result.success) errors.push(`accounting(${email}): ${result.error}`);
      }
    }

    // ── Donor thank-you ─────────────────────────────────────────────────────
    if (settings.send_donor_email && settings.donor_email_enabled && data.donor_email) {
      const donorSubject = applyTemplate(settings.donor_email_subject, templateVars);
      const donorHtml = settings.donor_email_body
        ? applyTemplate(settings.donor_email_body, templateVars)
        : defaultDonorHtml(templateVars);

      const result = await sendViaSMTP(data.donor_email, donorSubject, donorHtml, senderName);
      if (!result.success) errors.push(`donor: ${result.error}`);
    }

    // ── Log notification ────────────────────────────────────────────────────
    if (supabaseUrl && supabaseServiceKey && data.reference) {
      try {
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        await sb.from("donation_notification_log").insert({
          reference_number: data.reference,
          transaction_id: data.transaction_id || null,
          notification_type: "payment",
          status: errors.length > 0 ? "partial" : "sent",
          error_message: errors.length > 0 ? errors.join("; ") : null,
        });
      } catch (logErr) {
        console.error("[notify-donation] Failed to log (non-critical):", logErr);
      }
    }

    if (errors.length > 0) {
      console.error("[notify-donation] Some emails failed:", errors);
      return new Response(
        JSON.stringify({ success: false, error: "Some emails failed", details: errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[notify-donation] Completed for ref:", data.reference);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[notify-donation] Error:", err?.message, err?.stack);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to send notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
