import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: Track uploads per IP
const uploadAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_UPLOADS_PER_HOUR = 10;
const HOUR_IN_MS = 60 * 60 * 1000;

// Allowed file types and max size
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = uploadAttempts.get(ip);

  if (!record) {
    uploadAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Reset if hour has passed
  if (now - record.firstAttempt > HOUR_IN_MS) {
    uploadAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Check if within limit
  if (record.count >= MAX_UPLOADS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

// Validate file content matches expected type
function validateFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 4) return false;

  // Check magic bytes
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (mimeType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    );
  }
  if (mimeType === "application/pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  }

  return false;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Demasiados intentos. Intenta de nuevo más tarde." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const donorEmail = formData.get("email") as string | null;
    const donorName = formData.get("name") as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó ningún archivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "El archivo excede el tamaño máximo de 5MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Tipo de archivo no permitido. Solo se aceptan JPG, PNG, WEBP o PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read file and validate magic bytes
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    if (!validateFileSignature(fileBytes, file.type)) {
      console.warn(`File signature mismatch for claimed type: ${file.type}`);
      return new Response(
        JSON.stringify({ error: "El contenido del archivo no coincide con su tipo declarado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];
    const safeExt = allowedExtensions.includes(fileExt) ? fileExt : "bin";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    // Upload using service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await supabase.storage
      .from("transfer-receipts")
      .upload(fileName, fileBytes, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Error al subir el archivo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signed URL (private bucket)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("transfer-receipts")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days validity

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
    }

    console.log(`File uploaded successfully: ${fileName} for donor: ${donorEmail || "unknown"}`);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        signedUrl: signedUrlData?.signedUrl || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in upload-receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
