import { format } from "date-fns";
import type { Locale } from "date-fns";

/**
 * Formats a timestamp-with-timezone (ISO string) as a date in its UTC calendar day.
 * We anchor to noon UTC to avoid timezone offsets shifting the displayed day.
 */
export const formatUtcCalendarDate = (iso: string, fmt: string, locale?: Locale) => {
  const d = new Date(iso);
  const anchor = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
  return format(anchor, fmt, locale ? { locale } : undefined);
};

/** Convert an ISO timestamp to YYYY-MM-DD based on its UTC date (safe for <input type="date">). */
export const isoToUtcDateInputValue = (iso: string) => {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
