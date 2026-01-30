import emailjs from "@emailjs/browser";

// EmailJS configuration - these are public keys, safe to expose
// To configure: Create account at emailjs.com, get these values from dashboard
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

// Check if EmailJS is configured
export const isEmailJSConfigured = (): boolean => {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

export interface ContactEmailParams {
  from_name: string;
  from_email: string;
  phone?: string;
  subject: string;
  message: string;
  reply_to: string;
}

export interface DonationEmailParams {
  from_name: string;
  from_email: string;
  phone?: string;
  amount: number;
  currency: string;
  donation_type: string;
  payment_method: string;
  nit?: string;
  reply_to: string;
}

/**
 * Send contact form email using EmailJS
 */
export const sendContactEmail = async (params: ContactEmailParams): Promise<void> => {
  if (!isEmailJSConfigured()) {
    throw new Error("EmailJS no está configurado. Contacta al administrador.");
  }

  const templateParams = {
    from_name: params.from_name,
    from_email: params.from_email,
    phone: params.phone || "No proporcionado",
    subject: params.subject,
    message: params.message,
    reply_to: params.reply_to,
  };

  const response = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    templateParams,
    EMAILJS_PUBLIC_KEY
  );

  if (response.status !== 200) {
    throw new Error("Error al enviar el correo");
  }
};

/**
 * Send donation notification email using EmailJS
 * Uses a separate template for donations
 */
export const sendDonationEmail = async (params: DonationEmailParams): Promise<void> => {
  const donationTemplateId = import.meta.env.VITE_EMAILJS_DONATION_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;
  
  if (!isEmailJSConfigured()) {
    throw new Error("EmailJS no está configurado. Contacta al administrador.");
  }

  const templateParams = {
    from_name: params.from_name,
    from_email: params.from_email,
    phone: params.phone || "No proporcionado",
    amount: params.amount,
    currency: params.currency,
    donation_type: params.donation_type === "mensual" ? "Mensual" : "Única",
    payment_method: params.payment_method === "tarjeta" ? "Tarjeta" : "Transferencia bancaria",
    nit: params.nit || "CF",
    reply_to: params.reply_to,
  };

  const response = await emailjs.send(
    EMAILJS_SERVICE_ID,
    donationTemplateId,
    templateParams,
    EMAILJS_PUBLIC_KEY
  );

  if (response.status !== 200) {
    throw new Error("Error al enviar el correo");
  }
};
