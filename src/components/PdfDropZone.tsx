import { useRef, useState } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfDropZoneProps {
  /** Current uploaded PDF URL (if any) */
  value: string;
  /** Called with the File when user selects or drops a PDF */
  onFile: (file: File) => void;
  /** Called when user wants to remove / replace the PDF */
  onClear: () => void;
  /** Whether an upload is in progress */
  isUploading?: boolean;
  /** Max size in bytes (default 10 MB) */
  maxSize?: number;
  /** Error toast handler – receives a message string */
  onError?: (msg: string) => void;
  className?: string;
}

const DEFAULT_MAX = 10 * 1024 * 1024; // 10 MB

const PdfDropZone = ({
  value,
  onFile,
  onClear,
  isUploading = false,
  maxSize = DEFAULT_MAX,
  onError,
  className,
}: PdfDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validate = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      onError?.("Solo se permiten archivos PDF");
      return false;
    }
    if (file.size > maxSize) {
      onError?.(`El archivo no puede superar ${Math.round(maxSize / 1024 / 1024)} MB`);
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validate(file)) onFile(file);
    // Reset so the same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragging if leaving the dropzone entirely (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validate(file)) onFile(file);
  };

  // ── Already has a file ──────────────────────────────────────────────────────
  if (value) {
    const fileName = value.split("/").pop() ?? "documento.pdf";
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-background rounded-lg border border-border", className)}>
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm flex-1 truncate text-foreground" title={fileName}>
          {fileName}
        </span>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline shrink-0"
        >
          Ver
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground shrink-0 h-7 w-7 p-0"
          onClick={onClear}
          title="Quitar archivo"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  // ── Drop zone ───────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed transition-colors select-none",
        isDragging
          ? "border-primary bg-primary/5 cursor-copy"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer",
        isUploading && "opacity-60 pointer-events-none",
        className
      )}
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={isUploading}
        onChange={handleChange}
      />

      {isUploading ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Subiendo PDF…</span>
        </>
      ) : (
        <>
          <Upload className={cn("w-6 h-6 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium transition-colors", isDragging ? "text-primary" : "text-muted-foreground")}>
            {isDragging ? "Suelta el PDF aquí" : "Arrastra o haz clic para subir un PDF"}
          </span>
          <span className="text-xs text-muted-foreground">
            Máx. {Math.round(maxSize / 1024 / 1024)} MB
          </span>
        </>
      )}
    </div>
  );
};

export default PdfDropZone;
