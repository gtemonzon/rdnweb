import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OptimizedAsset {
  large_url: string;
  thumb_url: string;
  width: number;
  height: number;
  size_bytes: number;
  original_size_bytes: number;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onAssetChange?: (asset: OptimizedAsset) => void;
  bucket?: string;
  folder?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  /** When true, optimizes + uploads large + thumb variants */
  optimize?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resize an image using Canvas and return a Blob in WebP format.
 * @param file  Source file
 * @param maxWidth Maximum width in px; height scales proportionally
 * @param quality WebP quality (0–1)
 */
function resizeToWebP(
  file: File,
  maxWidth: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob returned null"));
          resolve({ blob, width, height });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const aspectClasses = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
};

const ImageUpload = ({
  value,
  onChange,
  onAssetChange,
  bucket = "public-assets",
  folder = "content",
  className = "",
  aspectRatio = "video",
  optimize = true,
}: ImageUploadProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [sizeInfo, setSizeInfo] = useState<{
    original: number;
    optimized: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload a single Blob to Supabase Storage ────────────────────────────
  const uploadBlob = async (
    blob: Blob,
    filePath: string,
    mimeType: string
  ): Promise<string> => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { contentType: mimeType, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ── Save asset metadata to DB ────────────────────────────────────────────
  const saveAssetMetadata = async (asset: {
    large_url: string;
    thumb_url: string;
    width: number;
    height: number;
    size_bytes: number;
    original_size_bytes: number;
    folder: string;
  }) => {
    try {
      await supabase.from("assets").insert({
        ...asset,
        mime_type: "image/webp",
        created_by: user?.id ?? null,
      });
    } catch {
      // Non-critical: metadata save failure should not block the upload
      console.warn("Could not save asset metadata");
    }
  };

  // ── Main file change handler ─────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan PNG, JPG o WebP");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no debe superar los 10 MB");
      return;
    }

    setIsUploading(true);
    setSizeInfo(null);

    try {
      const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (optimize) {
        // Generate large (2000px, 80% quality) and thumb (600px, 75% quality)
        const [largeResult, thumbResult] = await Promise.all([
          resizeToWebP(file, 2000, 0.8),
          resizeToWebP(file, 600, 0.75),
        ]);

        const largeUrl = await uploadBlob(
          largeResult.blob,
          `${folder}/${timestamp}-large.webp`,
          "image/webp"
        );
        const thumbUrl = await uploadBlob(
          thumbResult.blob,
          `${folder}/${timestamp}-thumb.webp`,
          "image/webp"
        );

        const optimizedSize = largeResult.blob.size + thumbResult.blob.size;
        setSizeInfo({ original: file.size, optimized: largeResult.blob.size });

        await saveAssetMetadata({
          large_url: largeUrl,
          thumb_url: thumbUrl,
          width: largeResult.width,
          height: largeResult.height,
          size_bytes: optimizedSize,
          original_size_bytes: file.size,
          folder,
        });

        onChange(largeUrl);
        onAssetChange?.({
          large_url: largeUrl,
          thumb_url: thumbUrl,
          width: largeResult.width,
          height: largeResult.height,
          size_bytes: optimizedSize,
          original_size_bytes: file.size,
        });

        toast.success(
          `Imagen optimizada y subida (${formatBytes(file.size)} → ${formatBytes(largeResult.blob.size)})`
        );
      } else {
        // No optimization — raw upload
        const ext = file.name.split(".").pop();
        const filePath = `${folder}/${timestamp}.${ext}`;
        const url = await uploadBlob(file, filePath, file.type);
        onChange(url);
        toast.success("Imagen subida correctamente");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setSizeInfo(null);
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  const handleRemove = () => {
    onChange("");
    setSizeInfo(null);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className={`${aspectClasses[aspectRatio]} rounded-lg overflow-hidden bg-muted`}>
            <img
              src={value}
              alt="Vista previa"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          {sizeInfo && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span>
                Original: <strong>{formatBytes(sizeInfo.original)}</strong> →
                Optimizado: <strong>{formatBytes(sizeInfo.optimized)}</strong>{" "}
                <span className="text-green-600">
                  ({Math.round((1 - sizeInfo.optimized / sizeInfo.original) * 100)}% menos)
                </span>
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`${aspectClasses[aspectRatio]} border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Optimizando y subiendo…</p>
            </div>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <div className="text-center px-4">
                <p className="text-sm font-medium text-foreground">
                  Haz clic para subir una imagen
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP · máx. 10 MB
                </p>
                {optimize && (
                  <p className="text-xs text-primary/70 mt-1">
                    ✦ Se generarán versiones optimizadas (WebP)
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* URL fallback */}
      <div className="mt-3 flex gap-2">
        {!showUrlInput ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="text-xs"
          >
            O usar URL externa
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 text-sm"
            />
            <Button type="button" size="sm" onClick={handleUrlSubmit}>
              Usar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput("");
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
