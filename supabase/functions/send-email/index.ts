import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per hour per IP

// Allowed origins for CORS - restrict to trusted domains
const allowedOrigins = [
  Deno.env.get("ALLOWED_ORIGIN") || "",
  "https://kfskqhgziuzowfoemqbg.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
].filter(Boolean);

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
};

interface EmailRequest {
  type: "contact" | "donation";
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  amount?: number;
  donationType?: "unica" | "mensual";
  paymentMethod?: "tarjeta" | "transferencia";
  honeypot?: string; // Honeypot field for bot detection
}

// Input validation
const validateEmailData = (data: EmailRequest): { valid: boolean; error?: string } => {
  // Check honeypot - if filled, it's likely a bot
  if (data.honeypot) {
    console.log("Honeypot triggered - likely bot submission");
    return { valid: false, error: "Invalid submission" };
  }

  // Validate required fields
  if (!data.type || !["contact", "donation"].includes(data.type)) {
    return { valid: false, error: "Invalid email type" };
  }

  if (!data.name || data.name.trim().length < 2 || data.name.length > 100) {
    return { valid: false, error: "Name must be between 2 and 100 characters" };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email) || data.email.length > 255) {
    return { valid: false, error: "Invalid email address" };
  }

  // Validate phone if provided
  if (data.phone && (data.phone.length < 8 || data.phone.length > 20)) {
    return { valid: false, error: "Invalid phone number" };
  }

  // Type-specific validation
  if (data.type === "contact") {
    if (data.message && data.message.length > 5000) {
      return { valid: false, error: "Message too long (max 5000 characters)" };
    }
    if (data.subject && data.subject.length > 200) {
      return { valid: false, error: "Subject too long (max 200 characters)" };
    }
  }

  if (data.type === "donation") {
    if (!data.amount || data.amount < 1 || data.amount > 1000000) {
      return { valid: false, error: "Invalid donation amount" };
    }
    if (data.donationType && !["unica", "mensual"].includes(data.donationType)) {
      return { valid: false, error: "Invalid donation type" };
    }
    if (data.paymentMethod && !["tarjeta", "transferencia"].includes(data.paymentMethod)) {
      return { valid: false, error: "Invalid payment method" };
    }
  }

  return { valid: true };
};

// Sanitize input to prevent injection
const sanitizeString = (str: string): string => {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    console.log("Processing email request from IP:", clientIp);

    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await supabase
      .from("email_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Rate limit check error:", countError);
      // Continue processing if rate limit check fails - don't block legitimate users
    } else if (count !== null && count >= MAX_REQUESTS_PER_WINDOW) {
      console.log("Rate limit exceeded for IP:", clientIp);
      return new Response(
        JSON.stringify({ success: false, error: "Demasiadas solicitudes. Por favor intenta más tarde." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailData: EmailRequest = await req.json();
    console.log("Received email request type:", emailData.type);

    // Validate input
    const validation = validateEmailData(emailData);
    if (!validation.valid) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(emailData.name.trim());
    const sanitizedEmail = emailData.email.trim().toLowerCase();
    const sanitizedPhone = emailData.phone ? sanitizeString(emailData.phone.trim()) : undefined;
    const sanitizedSubject = emailData.subject ? sanitizeString(emailData.subject.trim()) : undefined;
    const sanitizedMessage = emailData.message ? sanitizeString(emailData.message.trim()) : undefined;

    // Record this request for rate limiting
    const { error: insertError } = await supabase
      .from("email_rate_limits")
      .insert({
        ip_address: clientIp,
        email_type: emailData.type,
      });

    if (insertError) {
      console.error("Failed to record rate limit:", insertError);
      // Continue processing - don't block legitimate users
    }

    // Cleanup old rate limit entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
      const { error: cleanupError } = await supabase.rpc("cleanup_old_rate_limits");
      if (cleanupError) {
        console.log("Cleanup function error (non-critical):", cleanupError);
      }
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      throw new Error("SMTP configuration is incomplete");
    }

    console.log("Connecting to SMTP:", smtpHost, smtpPort);

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: false,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    if (emailData.type === "contact") {
      console.log("Sending contact email to organization...");
      await client.send({
        from: smtpUsername,
        to: smtpUsername,
        subject: `Nuevo mensaje de contacto: ${sanitizedSubject || "Sin asunto"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F68A33;">Nuevo mensaje de contacto</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Nombre:</strong> ${sanitizedName}</p>
              <p><strong>Correo:</strong> ${sanitizedEmail}</p>
              ${sanitizedPhone ? `<p><strong>Teléfono:</strong> ${sanitizedPhone}</p>` : ""}
              <p><strong>Asunto:</strong> ${sanitizedSubject || "No especificado"}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p><strong>Mensaje:</strong></p>
              <p style="white-space: pre-wrap;">${sanitizedMessage || ""}</p>
            </div>
          </div>
        `,
      });

      console.log("Sending confirmation to user...");
      await client.send({
        from: smtpUsername,
        to: sanitizedEmail,
        subject: "Hemos recibido tu mensaje - El Refugio de la Niñez",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0067B1;">¡Gracias por contactarnos!</h2>
            <p>Hola ${sanitizedName},</p>
            <p>Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
            <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
          </div>
        `,
      });
    } else if (emailData.type === "donation") {
      const donationTypeText = emailData.donationType === "mensual" ? "Mensual" : "Única";
      const paymentMethodText = emailData.paymentMethod === "tarjeta" ? "Tarjeta" : "Transferencia bancaria";

      console.log("Sending donation email to organization...");
      await client.send({
        from: smtpUsername,
        to: smtpUsername,
        subject: `Nueva intención de donación: Q${emailData.amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F68A33;">Nueva intención de donación</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Nombre:</strong> ${sanitizedName}</p>
              <p><strong>Correo:</strong> ${sanitizedEmail}</p>
              ${sanitizedPhone ? `<p><strong>Teléfono:</strong> ${sanitizedPhone}</p>` : ""}
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p><strong>Monto:</strong> Q${emailData.amount}</p>
              <p><strong>Tipo:</strong> ${donationTypeText}</p>
              <p><strong>Método:</strong> ${paymentMethodText}</p>
            </div>
          </div>
        `,
      });

      console.log("Sending confirmation to donor...");
      await client.send({
        from: smtpUsername,
        to: sanitizedEmail,
        subject: "Gracias por tu donación - El Refugio de la Niñez",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0067B1;">¡Gracias por tu generosidad!</h2>
            <p>Hola ${sanitizedName},</p>
            <p>Hemos recibido tu intención de donar. Tu apoyo nos permite continuar protegiendo a niños, niñas y adolescentes.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Monto:</strong> Q${emailData.amount}</p>
              <p><strong>Tipo:</strong> ${donationTypeText}</p>
              <p><strong>Método:</strong> ${paymentMethodText}</p>
            </div>
            ${emailData.paymentMethod === "transferencia" ? `
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Datos para transferencia:</strong></p>
              <p>Banco: Banco Industrial</p>
              <p>Cuenta: 000-031978-0</p>
              <p>Nombre: El Refugio de la Niñez ONG</p>
            </div>
            ` : ""}
            <p>Atentamente,<br><strong>El Refugio de la Niñez</strong></p>
          </div>
        `,
      });
    }

    await client.close();
    console.log("Emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Correo enviado exitosamente" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    // Return generic error message to avoid leaking internal details
    return new Response(
      JSON.stringify({ success: false, error: "Error al procesar la solicitud. Por favor intenta más tarde." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
