/**
 * emailjs-donation.ts — DEPRECATED. EmailJS has been removed.
 * Donation confirmation emails are now sent server-side via notify-donation edge function (M365 SMTP).
 * This stub prevents import errors. Remove after all callers are updated.
 */

export interface DonationEmailData {
  donor_name: string;
  donor_email: string;
  amount: string;
  currency: string;
  reference_number: string;
  transaction_id?: string;
}

/** @deprecated No-op. Emails are sent by notify-donation edge function. */
export const sendDevDonationEmailJS = async (_data: DonationEmailData): Promise<void> => {
  // EmailJS has been removed. notify-donation edge function handles all emails.
};
