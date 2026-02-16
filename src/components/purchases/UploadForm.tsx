"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface OcrItem {
  productName: string;
  qty: number;
  unitCost: number;
}

interface UploadResult {
  imagePath: string;
  items: OcrItem[];
  unparsedLines: string[];
  rawText: string;
}

interface UploadFormProps {
  onUploadComplete: (result: UploadResult) => void;
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  async function processFile(file: File) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato no soportado. Usa PNG, JPG o WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo excede 5MB.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/purchases/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al procesar imagen");
      }

      const json = await res.json();
      onUploadComplete(json.data as UploadResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        )}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-10 w-10 animate-spin text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm font-medium text-blue-600">
              Procesando OCR...
            </p>
            {fileName && (
              <p className="text-xs text-gray-500">{fileName}</p>
            )}
          </div>
        ) : (
          <>
            <svg
              className="mb-3 h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Arrastra una imagen de boleta o factura
            </p>
            <p className="mt-1 text-xs text-gray-500">
              o haz clic para seleccionar (PNG, JPG, WebP, max 5MB)
            </p>
            {fileName && (
              <p className="mt-2 text-xs text-gray-600">
                Archivo seleccionado: {fileName}
              </p>
            )}
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
