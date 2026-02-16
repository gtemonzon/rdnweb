import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

/* ── Minimal SMTP-over-TLS client (no STARTTLS needed) ── */

async function smtpSendEmail(
  host: string, port: number, user: string, pass: string,
  from: string, to: string, subject: string, html: string,
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect with TLS directly (port 465) or plain (port 25/587)
  let conn: Deno.Conn;
  if (port === 465) {
    conn = await Deno.connectTls({ hostname: host, port });
  } else {
    conn = await Deno.connect({ hostname: host, port });
  }

  async function read(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null) return "";
    return decoder.decode(buf.subarray(0, n));
  }

  async function send(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    // small delay to let server respond
    await new Promise(r => setTimeout(r, 150));
    return await read();
  }

  try {
    // Read greeting
    const greeting = await read();
    console.log("SMTP greeting:", greeting.trim());

    // EHLO
    const ehlo = await send(`EHLO lovable.app`);
    console.log("EHLO:", ehlo.trim().split("\n")[0]);

    // AUTH LOGIN
    const authResp = await send(`AUTH LOGIN`);
    console.log("AUTH:", authResp.trim());
    await send(base64Encode(encoder.encode(user)));
    const passResp = await send(base64Encode(encoder.encode(pass)));
    console.log("AUTH result:", passResp.trim());

    if (!passResp.includes("235")) {
      throw new Error(`SMTP AUTH failed: ${passResp.trim()}`);
    }

    // MAIL FROM
    await send(`MAIL FROM:<${from}>`);

    // RCPT TO
    const rcptResp = await send(`RCPT TO:<${to}>`);
    if (!rcptResp.includes("250")) {
      throw new Error(`RCPT TO rejected: ${rcptResp.trim()}`);
    }

    // DATA
    await send(`DATA`);

    // Compose message
    const boundary = `boundary_${Date.now()}`;
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${base64Encode(encoder.encode(subject))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64Encode(encoder.encode(html)),
      `.`,
    ].join("\r\n");

    const dataResp = await send(message);
    console.log("DATA result:", dataResp.trim());

    // QUIT
    await send(`QUIT`);
  } finally {
    try { conn.close(); } catch (_) { /* ignore */ }
  }
}

/* ── Template helpers ── */

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function defaultAccountingHtml(vars: Record<string, string>): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0067B1;">Donación confirmada por tarjeta</h2>
      <p style="background: #d4edda; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
        <strong>✅ Estado:</strong> Pago autorizado
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Datos del donante</h3>
        <p><strong>Nombre:</strong> ${vars.donor_name}</p>
        <p><strong>Correo:</strong> ${vars.donor_email}</p>
      </div>
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0067B1;">Detalles de la donación</h3>
        <p><strong>Monto:</strong> <span style="font-size: 1.5em; color: #0067B1;">${vars.currency_symbol}${vars.amount}</span></p>
        <p><strong>Método de pago:</strong> ${vars.card_info}</p>
        <p><strong>Fecha:</strong> ${vars.date}</p>
        <p><strong>Referencia:</strong> ${vars.reference}</p>
        ${vars.transaction_id ? `<p><strong>ID de transacción:</strong> ${vars.transaction_id}</p>` : ""}
      </div>
    </div>
  `;
}

function defaultDonorHtml(vars: Record<string, string>): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0067B1;">¡Gracias por tu donación!</h2>
      <p>Hola ${vars.donor_name},</p>
      <p>Tu donación de <strong>${vars.currency_symbol}${vars.amount}</strong> ha sido procesada exitosamente.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Monto:</strong> ${vars.currency_symbol}${vars.amount}</p>
        <p><strong>Fecha:</strong> ${vars.date}</p>
        <p><strong>Referencia:</strong> ${vars.reference}</p>
      </div>
      <p>Tu recibo deducible de impuestos será enviado a tu correo electrónico.</p>
      <p>Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan.</p>
      <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
    </div>
  `;
}

/* ── Main handler ── */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const data: DonationNotification = await req.json();
    console.log("notify-donation invoked, reference:", data.reference);

    // --- Load settings from database ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let settings: DonationSettings | null = null;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Idempotency check
      if (data.reference && !data.skip_idempotency) {
        const { data: existing } = await supabase
          .from("donation_notification_log")
          .select("id")
          .eq("reference_number", data.reference)
          .eq("notification_type", "payment")
          .maybeSingle();

        if (existing) {
          console.log(`Already notified for ref ${data.reference}, skipping`);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "already_notified" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { data: settingsRow } = await supabase
        .from("donation_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsRow) {
        settings = settingsRow as unknown as DonationSettings;
      }
    }

    if (!settings) {
      settings = {
        environment: "production",
        sender_email_name: "El Refugio de la Niñez",
        sender_email_address: null,
        accounting_emails: ["donaciones@refugiodelaninez.org"],
        accounting_email_subject: "💳 Donación confirmada: {{currency_symbol}}{{amount}} - Ref: {{reference}}",
        accounting_email_body: null,
        donor_email_enabled: true,
        donor_email_subject: "Gracias por tu donación - El Refugio de la Niñez",
        donor_email_body: null,
        send_donor_email: true,
        send_accounting_email: true,
      };
    }

    // --- SMTP config validation ---
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      const missing = { SMTP_HOST: !smtpHost, SMTP_PORT: !smtpPort, SMTP_USERNAME: !smtpUsername, SMTP_PASSWORD: !smtpPassword };
      console.error("SMTP configuration missing:", missing);
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured", missing }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Template variables
    const currencySymbol = data.currency === "USD" ? "US$" : "Q";
    const cardInfo = data.card_type && data.card_last4
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

    const senderAddress = settings.sender_email_address || smtpUsername;
    const portNum = parseInt(smtpPort);

    // --- Send accounting notification ---
    if (settings.send_accounting_email && settings.accounting_emails.length > 0) {
      const acctSubject = applyTemplate(settings.accounting_email_subject, templateVars);
      const acctHtml = settings.accounting_email_body
        ? applyTemplate(settings.accounting_email_body, templateVars)
        : defaultAccountingHtml(templateVars);

      for (const email of settings.accounting_emails) {
        console.log("Sending accounting email to:", email.trim());
        await smtpSendEmail(smtpHost, portNum, smtpUsername, smtpPassword, senderAddress, email.trim(), acctSubject, acctHtml);
      }
      console.log("Accounting notification sent");
    }

    // --- Send donor thank-you ---
    if (settings.send_donor_email && settings.donor_email_enabled && data.donor_email) {
      const donorSubject = applyTemplate(settings.donor_email_subject, templateVars);
      const donorHtml = settings.donor_email_body
        ? applyTemplate(settings.donor_email_body, templateVars)
        : defaultDonorHtml(templateVars);

      console.log("Sending donor email to:", data.donor_email);
      await smtpSendEmail(smtpHost, portNum, smtpUsername, smtpPassword, senderAddress, data.donor_email, donorSubject, donorHtml);
      console.log("Donor thank-you email sent");
    }

    // --- Record in notification log ---
    if (supabaseUrl && supabaseServiceKey && data.reference) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("donation_notification_log").insert({
          reference_number: data.reference,
          transaction_id: data.transaction_id || null,
          notification_type: "payment",
          status: "sent",
        });
      } catch (logErr) {
        console.error("Failed to log notification (non-critical):", logErr);
      }
    }

    console.log("notify-donation completed successfully for ref:", data.reference);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-donation:", error?.message, error?.stack);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.clone().json().catch(() => ({}));
        if (body.reference) {
          await supabase.from("donation_notification_log").upsert({
            reference_number: body.reference,
            notification_type: "payment",
            status: "failed",
            error_message: error.message || "Unknown error",
          }, { onConflict: "reference_number,notification_type" });
        }
      }
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Failed to send notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
