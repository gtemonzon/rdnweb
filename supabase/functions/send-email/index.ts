import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "contact" | "donation";
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  // Donation specific fields
  amount?: number;
  donationType?: "unica" | "mensual";
  paymentMethod?: "tarjeta" | "transferencia";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailRequest = await req.json();
    console.log("Received email request:", emailData);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      throw new Error("SMTP configuration is incomplete");
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: true,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    let emailSubject: string;
    let emailHtml: string;
    let recipientEmail: string;

    if (emailData.type === "contact") {
      // Contact form email - send to organization
      recipientEmail = smtpUsername;
      emailSubject = `Nuevo mensaje de contacto: ${emailData.subject || "Sin asunto"}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F68A33;">Nuevo mensaje de contacto</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Nombre:</strong> ${emailData.name}</p>
            <p><strong>Correo:</strong> ${emailData.email}</p>
            ${emailData.phone ? `<p><strong>Teléfono:</strong> ${emailData.phone}</p>` : ""}
            <p><strong>Asunto:</strong> ${emailData.subject || "No especificado"}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Mensaje:</strong></p>
            <p style="white-space: pre-wrap;">${emailData.message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Este mensaje fue enviado desde el formulario de contacto del sitio web.
          </p>
        </div>
      `;

      // Send confirmation to the user
      const userConfirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0067B1;">¡Gracias por contactarnos!</h2>
          <p>Hola ${emailData.name},</p>
          <p>Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tu mensaje:</strong></p>
            <p style="white-space: pre-wrap;">${emailData.message}</p>
          </div>
          <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
        </div>
      `;

      // Send to organization first
      await client.send({
        from: smtpUsername,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      // Send confirmation to user
      await client.send({
        from: smtpUsername,
        to: emailData.email,
        subject: "Hemos recibido tu mensaje - El Refugio de la Niñez",
        html: userConfirmationHtml,
      });

    } else if (emailData.type === "donation") {
      // Donation notification - send to organization
      recipientEmail = smtpUsername;
      const donationTypeText = emailData.donationType === "mensual" ? "Mensual" : "Única";
      const paymentMethodText = emailData.paymentMethod === "tarjeta" ? "Tarjeta" : "Transferencia bancaria";
      
      emailSubject = `Nueva intención de donación: Q${emailData.amount}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F68A33;">Nueva intención de donación</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Nombre:</strong> ${emailData.name}</p>
            <p><strong>Correo:</strong> ${emailData.email}</p>
            ${emailData.phone ? `<p><strong>Teléfono:</strong> ${emailData.phone}</p>` : ""}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p><strong>Monto:</strong> Q${emailData.amount}</p>
            <p><strong>Tipo de donación:</strong> ${donationTypeText}</p>
            <p><strong>Método de pago:</strong> ${paymentMethodText}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Esta notificación fue enviada desde el formulario de donación del sitio web.
          </p>
        </div>
      `;

      // Send confirmation to donor
      const donorConfirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0067B1;">¡Gracias por tu generosidad!</h2>
          <p>Hola ${emailData.name},</p>
          <p>Hemos recibido tu intención de donar. Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Detalles de tu donación:</strong></p>
            <p>Monto: Q${emailData.amount}</p>
            <p>Tipo: ${donationTypeText}</p>
            <p>Método de pago: ${paymentMethodText}</p>
          </div>
          ${emailData.paymentMethod === "transferencia" ? `
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Datos para transferencia:</strong></p>
            <p>Banco: Banco Industrial</p>
            <p>Cuenta: 000-031978-0</p>
            <p>Nombre: El Refugio de la Niñez ONG</p>
            <p>Tipo: Monetaria Quetzales</p>
          </div>
          ` : ""}
          <p>Nos pondremos en contacto contigo para completar el proceso.</p>
          <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
        </div>
      `;

      // Send to organization
      await client.send({
        from: smtpUsername,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      // Send confirmation to donor
      await client.send({
        from: smtpUsername,
        to: emailData.email,
        subject: "Gracias por tu donación - El Refugio de la Niñez",
        html: donorConfirmationHtml,
      });
    }

    await client.close();

    console.log("Emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Correo enviado exitosamente" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
