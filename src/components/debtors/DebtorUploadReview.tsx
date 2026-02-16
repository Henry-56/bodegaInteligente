"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface DebtorRow {
  debtorName: string;
  amount: number;
  note: string;
}

interface OcrResult {
  imagePath: string;
  items: Array<{ debtorName: string; amount: number; note?: string }>;
  unparsedLines: string[];
  rawText: string;
}

interface DebtorUploadReviewProps {
  onConfirm: (
    items: DebtorRow[],
    imagePath?: string,
    rawText?: string
  ) => void | Promise<void>;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

type Step = "upload" | "review";

export default function DebtorUploadReview({
  onConfirm,
}: DebtorUploadReviewProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR results
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [rawText, setRawText] = useState<string | undefined>();
  const [unparsedLines, setUnparsedLines] = useState<string[]>([]);

  // Editable rows
  const [items, setItems] = useState<DebtorRow[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // -- Upload handlers --
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
    if (file) processFile(file);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function processFile(file: File) {
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setUploadError("Formato no soportado. Usa PNG, JPG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("El archivo excede 5MB.");
      return;
    }

    setUploadError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/debts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al procesar imagen");
      }

      const json = await res.json();
      const data = json.data as OcrResult;

      setImagePath(data.imagePath);
      setRawText(data.rawText);
      setUnparsedLines(data.unparsedLines);
      setItems(
        data.items.map((item) => ({
          debtorName: item.debtorName,
          amount: item.amount,
          note: item.note ?? "",
        }))
      );
      setStep("review");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // -- Review handlers --
  function updateItem(
    index: number,
    field: keyof DebtorRow,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { debtorName: "", amount: 0, note: "" }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getTotal(): number {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }

  async function handleConfirm() {
    const hasEmpty = items.some((item) => !item.debtorName.trim());
    if (hasEmpty) {
      setReviewError("Todos los deudores deben tener nombre.");
      return;
    }

    const hasInvalid = items.some((item) => item.amount <= 0);
    if (hasInvalid) {
      setReviewError("Todos los montos deben ser mayores a 0.");
      return;
    }

    setReviewError(null);
    setSubmitting(true);

    try {
      await onConfirm(items, imagePath, rawText);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Error al confirmar"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // -- Upload Step --
  if (step === "upload") {
    return (
      <div className="space-y-4">
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
                Arrastra una imagen con la lista de deudores
              </p>
              <p className="mt-1 text-xs text-gray-500">
                o haz clic para seleccionar (PNG, JPG, WebP, max 5MB)
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadError && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}
      </div>
    );
  }

  // -- Review Step --
  return (
    <div className="space-y-4">
      {/* Back to upload */}
      <button
        type="button"
        onClick={() => setStep("upload")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Subir otra imagen
      </button>

      {/* Unparsed lines */}
      {unparsedLines.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-3">
          <p className="mb-1 text-sm font-medium text-yellow-800">
            Lineas no reconocidas:
          </p>
          <ul className="list-inside list-disc text-xs text-yellow-700">
            {unparsedLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                Deudor
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-600">
                Monto
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                Nota
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-600">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.debtorName}
                    onChange={(e) =>
                      updateItem(index, "debtorName", e.target.value)
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nombre del deudor"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      updateItem(index, "amount", Number(e.target.value))
                    }
                    className="w-28 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) =>
                      updateItem(index, "note", e.target.value)
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nota (opcional)"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                    className="rounded p-1 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Eliminar fila"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                Total:
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-center text-sm font-bold text-gray-900">
                {formatCurrency(getTotal())}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Agregar fila
      </button>

      {/* Error */}
      {reviewError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{reviewError}</p>
        </div>
      )}

      {/* Confirm */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || items.length === 0}
          className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
        >
          {submitting ? "Confirmando..." : "Confirmar Deudas"}
        </button>
      </div>
    </div>
  );
}
