import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const allowedOrigins = [
  Deno.env.get("ALLOWED_ORIGIN") || "",
  // Lovable preview/prod origins (kept consistent with other functions)
  "https://kfskqhgziuzowfoemqbg.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
].filter(Boolean);

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
};

const isAllowedStorageUrl = (rawUrl: string): boolean => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) return false;

    const allowedOrigin = new URL(supabaseUrl).origin;
    const u = new URL(rawUrl);

    // Prevent open proxy: only allow our own storage host
    if (u.origin !== allowedOrigin) return false;

    // Prevent open proxy: only allow specific public buckets
    const allowedPrefixes = [
      "/storage/v1/object/public/vacancies-docs/",
      "/storage/v1/object/public/transparency-docs/",
    ];
    if (!allowedPrefixes.some((p) => u.pathname.startsWith(p))) return false;

    return true;
  } catch {
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const url = new URL(req.url);
  const fileUrl = url.searchParams.get("url");

  if (!fileUrl) {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!isAllowedStorageUrl(fileUrl)) {
    return new Response(JSON.stringify({ error: "URL not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const upstream = await fetch(fileUrl, {
      // Avoid leaking any client headers
      headers: {
        "User-Agent": "lovable-file-proxy",
      },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const contentType = upstream.headers.get("content-type") || "application/pdf";
    const contentDisposition = upstream.headers.get("content-disposition") || "inline";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        // reasonable caching for public files
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("file-proxy error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
