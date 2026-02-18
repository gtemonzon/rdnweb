/**
 * send-email — Unified SMTP email sender for contact form and donation flows.
 * Uses Microsoft 365 SMTP (STARTTLS port 587) via nodemailer.
 * SMTP credentials are read ONLY from environment secrets — never from the request.
 *
 * Brand note: Brand logos must be SVG or lossless; do not run through lossy photo optimization.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.13";

// ── Rate limit config ──────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 3_600_000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

// ── CORS ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Types ──────────────────────────────────────────────────────────────────
interface EmailRequest {
  type: "contact" | "donation" | "transfer-donation";
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  amount?: number;
  currency?: string;
  donationType?: "unica" | "mensual";
  paymentMethod?: "tarjeta" | "transferencia";
  nit?: string;
  city?: string;
  department?: string;
  receiptFileName?: string;
  receiptUrl?: string;
  /** Honeypot — if filled, treat as bot */
  honeypot?: string;
}

// ── Validation ─────────────────────────────────────────────────────────────
const validate = (d: EmailRequest): string | null => {
  if (d.honeypot) return "Invalid submission";
  if (!d.type || !["contact", "donation", "transfer-donation"].includes(d.type))
    return "Invalid email type";

  const name = d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim();
  if (!name || name.length < 2 || name.length > 100)
    return "Name must be between 2 and 100 characters";

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!d.email || !emailRx.test(d.email) || d.email.length > 255)
    return "Invalid email address";

  if (d.phone && (d.phone.length < 8 || d.phone.length > 20))
    return "Invalid phone number";

  if (d.type === "contact") {
    if (d.message && d.message.length > 5_000)
      return "Message too long (max 5000 characters)";
    if (d.subject && d.subject.length > 200)
      return "Subject too long (max 200 characters)";
  }

  if (d.type === "donation" || d.type === "transfer-donation") {
    if (!d.amount || d.amount < 1 || d.amount > 1_000_000)
      return "Invalid donation amount";
  }
  return null;
};

const esc = (s: string): string =>
  s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

// ── SMTP transporter factory ───────────────────────────────────────────────
function createTransporter() {
  const host = Deno.env.get("SMTP_HOST");
  const port = Deno.env.get("SMTP_PORT");
  const user = Deno.env.get("SMTP_USERNAME");
  const pass = Deno.env.get("SMTP_PASSWORD");

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration incomplete (SMTP_HOST / SMTP_PORT / SMTP_USERNAME / SMTP_PASSWORD)");
  }

  // Microsoft 365: port 587 + STARTTLS
  return { transporter: nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: false,       // STARTTLS (not direct SSL)
    requireTLS: true,    // refuse plain-text fallback
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  }), from: user };
}

// ── Main handler ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting via Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Server configuration error");

    const sb = createClient(supabaseUrl, supabaseKey);

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await sb
      .from("email_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if (count !== null && count >= MAX_REQUESTS_PER_WINDOW) {
      console.log("[send-email] Rate limit exceeded for IP:", clientIp);
      return new Response(
        JSON.stringify({ success: false, error: "Demasiadas solicitudes. Por favor intenta más tarde." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const data: EmailRequest = await req.json();
    console.log("[send-email] Request type:", data.type);

    // Honeypot + validation
    const validationError = validate(data);
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Record rate limit entry
    await sb.from("email_rate_limits").insert({ ip_address: clientIp, email_type: data.type }).catch(() => {});

    // Periodic cleanup (1% of requests)
    if (Math.random() < 0.01) sb.rpc("cleanup_old_rate_limits").catch(() => {});

    // Sanitise
    const name = esc((data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim()));
    const email = data.email.trim().toLowerCase();
    const phone = data.phone ? esc(data.phone.trim()) : null;
    const subject = data.subject ? esc(data.subject.trim()) : null;
    const message = data.message ? esc(data.message.trim()) : null;

    const { transporter, from } = createTransporter();
    const timestamp = new Date().toLocaleString("es-GT", { timeZone: "America/Guatemala" });

    // ── Contact form ────────────────────────────────────────────────────────
    if (data.type === "contact") {
      const destContact = Deno.env.get("SMTP_DEST_CONTACT") || "ninez@refugiodelaninez.org";

      // Internal notification (Reply-To = visitor)
      await transporter.sendMail({
        from: `El Refugio de la Niñez <${from}>`,
        to: destContact,
        replyTo: `${name} <${email}>`,
        subject: `Nuevo mensaje de contacto desde el sitio web – ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#F68A33;">Nuevo mensaje de contacto</h2>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Correo:</strong> ${email}</p>
              ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
              <p><strong>Asunto:</strong> ${subject || "Sin asunto"}</p>
              <hr style="border:none;border-top:1px solid #ddd;margin:15px 0;">
              <p><strong>Mensaje:</strong></p>
              <p style="white-space:pre-wrap;">${message || ""}</p>
            </div>
            <p style="color:#999;font-size:12px;margin-top:20px;">Enviado el ${timestamp}</p>
          </div>`,
      });
      console.log("[send-email] Contact notification sent to:", destContact);
    }

    // ── Donation (card intent — legacy flow) ────────────────────────────────
    else if (data.type === "donation") {
      const typeText = data.donationType === "mensual" ? "Mensual" : "Única";
      const methodText = data.paymentMethod === "tarjeta" ? "Tarjeta" : "Transferencia bancaria";
      const currency = data.currency === "USD" ? "US$" : "Q";
      const destDonation = Deno.env.get("SMTP_DEST_DONATION") || "contabilidad@refugiodelaninez.org";

      await transporter.sendMail({
        from: `El Refugio de la Niñez <${from}>`,
        to: destDonation,
        subject: `💳 Nueva donación recibida – ${currency}${data.amount} – ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#F68A33;">Nueva donación recibida</h2>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;">
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Correo:</strong> ${email}</p>
              ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
              <p><strong>Monto:</strong> ${currency}${data.amount}</p>
              <p><strong>Tipo:</strong> ${typeText}</p>
              <p><strong>Método:</strong> ${methodText}</p>
              <p><strong>Fecha:</strong> ${timestamp}</p>
            </div>
          </div>`,
      });

      await transporter.sendMail({
        from: `El Refugio de la Niñez <${from}>`,
        to: email,
        subject: "Gracias por tu donación – El Refugio de la Niñez",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#0067B1;">¡Gracias por tu generosidad!</h2>
            <p>Hola ${name},</p>
            <p>Hemos recibido tu donación. Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes.</p>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
              <p><strong>Monto:</strong> ${currency}${data.amount}</p>
              <p><strong>Tipo:</strong> ${typeText}</p>
              <p><strong>Método:</strong> ${methodText}</p>
            </div>
            ${data.paymentMethod === "transferencia" ? `
            <div style="background:#e8f5e9;padding:20px;border-radius:8px;margin:20px 0;">
              <p><strong>Datos para transferencia:</strong></p>
              <p>Banco: Banco Industrial</p>
              <p>Cuenta: 000-031978-0</p>
              <p>Nombre: El Refugio de la Niñez ONG</p>
            </div>` : ""}
            <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
          </div>`,
      });
      console.log("[send-email] Donation emails sent for:", email);
    }

    // ── Transfer donation ───────────────────────────────────────────────────
    else if (data.type === "transfer-donation") {
      const typeText = data.donationType === "mensual" ? "Mensual" : "Única";
      const currency = data.currency === "USD" ? "US$" : "Q";
      const nit = data.nit ? esc(data.nit.trim()) : "No proporcionado";
      const city = data.city ? esc(data.city.trim()) : "";
      const dept = data.department ? esc(data.department.trim()) : "";
      const location = city && dept ? `${city}, ${dept}` : "No proporcionada";
      const destDonation = Deno.env.get("SMTP_DEST_DONATION") || "contabilidad@refugiodelaninez.org";

      await transporter.sendMail({
        from: `El Refugio de la Niñez <${from}>`,
        to: destDonation,
        subject: `🏦 Nueva donación por transferencia: ${currency}${data.amount} – Pendiente de verificación`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#F68A33;">Nueva donación por transferencia bancaria</h2>
            <p style="background:#fff3cd;padding:12px;border-radius:8px;border-left:4px solid #ffc107;">
              <strong>⏳ Estado:</strong> Pendiente de verificación
            </p>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;">Datos del donante</h3>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Correo:</strong> ${email}</p>
              ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
              <p><strong>NIT:</strong> ${nit}</p>
              <p><strong>Ubicación:</strong> ${location}</p>
            </div>
            <div style="background:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;color:#0067B1;">Detalles de la donación</h3>
              <p><strong>Monto:</strong> <span style="font-size:1.5em;color:#0067B1;">${currency}${data.amount}</span></p>
              <p><strong>Tipo:</strong> ${typeText}</p>
              <p><strong>Fecha:</strong> ${timestamp}</p>
            </div>
            ${data.receiptUrl ? `
            <div style="background:#e8f5e9;padding:20px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;color:#2e7d32;">📎 Boleta adjunta</h3>
              <p><strong>Archivo:</strong> ${data.receiptFileName || "boleta"}</p>
              <a href="${data.receiptUrl}" style="background:#2e7d32;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
                📥 Ver/Descargar Boleta
              </a>
            </div>` : ""}
            <p style="color:#999;font-size:12px;">Enviado el ${timestamp}</p>
          </div>`,
      });

      await transporter.sendMail({
        from: `El Refugio de la Niñez <${from}>`,
        to: email,
        subject: "Hemos recibido tu boleta de transferencia – El Refugio de la Niñez",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#0067B1;">¡Gracias por tu donación!</h2>
            <p>Hola ${name},</p>
            <p>Hemos recibido tu boleta de transferencia. Nuestro equipo verificará el depósito y te enviaremos el recibo correspondiente una vez confirmado.</p>
            <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
              <p><strong>Monto:</strong> ${currency}${data.amount}</p>
              <p><strong>Tipo:</strong> ${typeText}</p>
              <p><strong>Estado:</strong> Pendiente de verificación</p>
            </div>
            <p>Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan.</p>
            <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
          </div>`,
      });
      console.log("[send-email] Transfer donation emails sent for:", email);
    }

    transporter.close();

    return new Response(
      JSON.stringify({ success: true, message: "Correo enviado exitosamente" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err: any) {
    console.error("[send-email] Error:", err?.message, err?.code);
    return new Response(
      JSON.stringify({ success: false, error: "No se pudo enviar el correo. Por favor intenta de nuevo." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
