/**
 * emailjs.ts — DEPRECATED. EmailJS has been removed.
 * All email sending now goes through server-side M365 SMTP edge functions.
 * This file is kept as a stub to avoid import errors during migration cleanup.
 *
 * NOTE: Brand logos must be SVG or lossless; do not run through lossy photo optimization.
 */

export const isEmailJSConfigured = (): boolean => false;

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

/** @deprecated Use the send-email edge function instead */
export const sendContactEmail = async (_params: ContactEmailParams): Promise<void> => {
  console.warn("[emailjs] sendContactEmail is deprecated. Use send-email edge function.");
};

/** @deprecated Use the send-email edge function instead */
export const sendDonationEmail = async (_params: DonationEmailParams): Promise<void> => {
  console.warn("[emailjs] sendDonationEmail is deprecated. Use send-email edge function.");
};
