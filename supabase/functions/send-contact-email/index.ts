/**
 * send-contact-email — Contact form handler.
 * Sends via Microsoft 365 SMTP (STARTTLS). No EmailJS.
 * SMTP credentials come exclusively from server secrets.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  /** Honeypot — filled by bots, left empty by humans */
  honeypot?: string;
}

const esc = (s: string) =>
  s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const data: ContactRequest = await req.json();

    // Honeypot check
    if (data.honeypot) {
      console.log("[send-contact-email] Honeypot triggered");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side validation
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.name?.trim() || data.name.trim().length > 100)
      return new Response(JSON.stringify({ error: "Nombre inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!data.email?.trim() || !emailRx.test(data.email) || data.email.length > 255)
      return new Response(JSON.stringify({ error: "Correo inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!data.subject?.trim() || data.subject.trim().length > 200)
      return new Response(JSON.stringify({ error: "Asunto inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!data.message?.trim() || data.message.trim().length > 5000)
      return new Response(JSON.stringify({ error: "Mensaje inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // SMTP config — read from secrets only
    const host = Deno.env.get("SMTP_HOST");
    const port = Deno.env.get("SMTP_PORT");
    const user = Deno.env.get("SMTP_USERNAME");
    const pass = Deno.env.get("SMTP_PASSWORD");

    if (!host || !port || !user || !pass) {
      console.error("[send-contact-email] SMTP configuration missing");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const name = esc(data.name.trim());
    const email = data.email.trim().toLowerCase();
    const phone = data.phone ? esc(data.phone.trim()) : null;
    const subject = esc(data.subject.trim());
    const message = esc(data.message.trim());
    const destContact = Deno.env.get("SMTP_DEST_CONTACT") || "ninez@refugiodelaninez.org";
    const timestamp = new Date().toLocaleString("es-GT", { timeZone: "America/Guatemala" });

    console.log("[send-contact-email] Sending to:", destContact, "from visitor:", email);

    // Send internal notification with Reply-To set to visitor
    await transporter.sendMail({
      from: `El Refugio de la Niñez <${user}>`,
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
            <p><strong>Asunto:</strong> ${subject}</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:15px 0;">
            <p><strong>Mensaje:</strong></p>
            <p style="white-space:pre-wrap;">${message}</p>
          </div>
          <p style="color:#999;font-size:12px;margin-top:20px;">Enviado el ${timestamp}</p>
        </div>`,
    });

    transporter.close();
    console.log("[send-contact-email] Email sent successfully");

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-contact-email] Error:", err?.message, err?.code);
    return new Response(
      JSON.stringify({ error: "No se pudo enviar el mensaje. Por favor intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
