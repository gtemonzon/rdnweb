import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransferReceiptUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  isUploading: boolean;
  disabled?: boolean;
}

const TransferReceiptUpload = ({
  file,
  onFileChange,
  isUploading,
  disabled = false,
}: TransferReceiptUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!acceptedTypes.includes(selectedFile.type)) {
      toast.error("Formato no válido. Solo se aceptan JPG, PNG, WEBP o PDF.");
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      toast.error("El archivo no debe superar los 5MB");
      return;
    }

    onFileChange(selectedFile);
  };

  const handleRemove = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-6 h-6" />;
    if (file.type === "application/pdf") return <FileText className="w-6 h-6" />;
    return <ImageIcon className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-sm font-medium">Adjuntar boleta de transferencia</span>
              <span className="text-xs">JPG, PNG, WEBP o PDF (máx. 5MB)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default TransferReceiptUpload;
