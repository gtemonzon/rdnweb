/**
 * publicClient.ts
 *
 * A lightweight Supabase client used exclusively for public (unauthenticated)
 * data fetching on marketing/public pages (Blog, Transparencia, etc.).
 *
 * Key differences from the main client:
 *  - persistSession: false  →  never touches localStorage / sessionStorage
 *  - storage: in-memory     →  no SecurityError when site data is blocked
 *  - autoRefreshToken: false →  no background timers needed
 *  - detectSessionInUrl: false →  no URL parsing
 *
 * This means the client ALWAYS acts as an anonymous visitor, which is
 * exactly what public pages need. RLS policies already allow anon SELECT
 * on blog_posts, stat_posts, transparency_*, site_content, etc.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Minimal in-memory Storage implementation — satisfies the Storage interface
// without ever reading or writing to the real browser storage APIs.
function buildMemoryStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

export const publicSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: buildMemoryStorage(),
    },
  }
);
