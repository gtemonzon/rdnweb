import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: DonationNotification = await req.json();

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      console.error("SMTP configuration missing");
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currencySymbol = data.currency === "USD" ? "US$" : "Q";
    const cardInfo = data.card_type && data.card_last4
      ? `${data.card_type} ****${data.card_last4}`
      : "Tarjeta de crédito/débito";

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: false,
        auth: { username: smtpUsername, password: smtpPassword },
      },
    });

    // Send to accounting
    const accountingEmail = Deno.env.get("DONATION_NOTIFY_EMAIL") || "donaciones@refugiodelaninez.org";

    await client.send({
      from: smtpUsername,
      to: accountingEmail,
      subject: `💳 Donación confirmada: ${currencySymbol}${data.amount} - Ref: ${data.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0067B1;">Donación confirmada por tarjeta</h2>
          <p style="background: #d4edda; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
            <strong>✅ Estado:</strong> Pago autorizado
          </p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Datos del donante</h3>
            <p><strong>Nombre:</strong> ${data.donor_name}</p>
            <p><strong>Correo:</strong> ${data.donor_email}</p>
          </div>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0067B1;">Detalles de la donación</h3>
            <p><strong>Monto:</strong> <span style="font-size: 1.5em; color: #0067B1;">${currencySymbol}${data.amount}</span></p>
            <p><strong>Método de pago:</strong> ${cardInfo}</p>
            <p><strong>Fecha:</strong> ${data.date}</p>
            <p><strong>Referencia:</strong> ${data.reference}</p>
            ${data.transaction_id ? `<p><strong>ID de transacción:</strong> ${data.transaction_id}</p>` : ""}
          </div>
        </div>
      `,
    });

    // Send thank you to donor
    await client.send({
      from: smtpUsername,
      to: data.donor_email,
      subject: "Gracias por tu donación - El Refugio de la Niñez",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0067B1;">¡Gracias por tu donación!</h2>
          <p>Hola ${data.donor_name},</p>
          <p>Tu donación de <strong>${currencySymbol}${data.amount}</strong> ha sido procesada exitosamente.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Monto:</strong> ${currencySymbol}${data.amount}</p>
            <p><strong>Fecha:</strong> ${data.date}</p>
            <p><strong>Referencia:</strong> ${data.reference}</p>
          </div>
          <p>Tu recibo deducible de impuestos será enviado a tu correo electrónico.</p>
          <p>Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes que más lo necesitan.</p>
          <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
        </div>
      `,
    });

    await client.close();
    console.log("Donation notification emails sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending donation notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
