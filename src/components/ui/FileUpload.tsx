"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface FileUploadProps {
  /** Called when a valid image file is selected */
  onFileSelect: (file: File) => void;
  /** Optional current preview URL (controlled from outside) */
  previewUrl?: string | null;
  /** Clear the current selection */
  onClear?: () => void;
  /** Max file size in MB. Defaults to 5 */
  maxSizeMB?: number;
  /** Optional className for the wrapper */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

function FileUpload({
  onFileSelect,
  previewUrl: externalPreview,
  onClear,
  maxSizeMB = 5,
  className,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = externalPreview ?? internalPreview;

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Solo se aceptan archivos de imagen (PNG, JPG, WEBP).");
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`El archivo excede el limite de ${maxSizeMB} MB.`);
        return;
      }

      // Generate local preview
      const objectUrl = URL.createObjectURL(file);
      setInternalPreview(objectUrl);
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect]
  );

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  function handleClear() {
    setInternalPreview(null);
    setError(null);
    onClear?.();
  }

  return (
    <div className={cn("w-full", className)}>
      {preview ? (
        <div className="relative rounded-lg border border-gray-200 p-2">
          <img
            src={preview}
            alt="Vista previa"
            className="mx-auto max-h-64 rounded object-contain"
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-gray-600 shadow transition-colors hover:bg-white hover:text-red-600"
            aria-label="Quitar imagen"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Haz clic</span> o
            arrastra una imagen aqui
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, WEBP (max {maxSizeMB} MB)
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default FileUpload;
