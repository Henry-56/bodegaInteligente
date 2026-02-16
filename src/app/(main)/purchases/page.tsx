"use client";

import { useState, useRef, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

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

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function PurchasesPage() {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  function handleUploadComplete(result: UploadResult) {
    setUploadResult(result);
    setStep("review");
  }

  function handleReset() {
    setUploadResult(null);
    setStep("upload");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Compras</h1>

      {step === "upload" && (
        <UploadForm onComplete={handleUploadComplete} />
      )}

      {step === "review" && uploadResult && (
        <ReviewTable data={uploadResult} onReset={handleReset} />
      )}
    </div>
  );
}

/* ---------- Upload Form (Step 1) ---------- */

interface UploadFormProps {
  onComplete: (result: UploadResult) => void;
}

function UploadForm({ onComplete }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleSubmit(file: File) {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/purchases/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      const json = await res.json();
      onComplete(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleSubmit(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSubmit(file);
  }

  return (
    <Card>
      <Card.Header>
        <h2 className="text-base font-semibold text-gray-900">
          Paso 1: Subir boleta de compra
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Suba una foto de la boleta y el sistema la procesara con OCR
        </p>
      </Card.Header>
      <Card.Body>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-600">
                Procesando imagen con OCR...
              </p>
            </div>
          ) : (
            <>
              <svg
                className="mb-3 h-10 w-10 text-gray-400"
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
                Arrastre una imagen aqui o{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  seleccione un archivo
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG o WEBP (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

/* ---------- Review Table (Step 2) ---------- */

interface ReviewTableProps {
  data: UploadResult;
  onReset: () => void;
}

function ReviewTable({ data, onReset }: ReviewTableProps) {
  const [items, setItems] = useState<OcrItem[]>(
    data.items.map((item) => ({ ...item }))
  );
  const [vendorName, setVendorName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateItem(index: number, field: keyof OcrItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "productName") return { ...item, productName: value };
        if (field === "qty") return { ...item, qty: parseInt(value, 10) || 0 };
        if (field === "unitCost")
          return { ...item, unitCost: parseFloat(value) || 0 };
        return item;
      })
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { productName: "", qty: 1, unitCost: 0 }]);
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      setError("Debe tener al menos un item");
      return;
    }

    setError(null);
    setConfirming(true);

    try {
      const res = await fetch("/api/purchases/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: vendorName || undefined,
          imagePath: data.imagePath,
          rawOcrText: data.rawText,
          items: items.map((item) => ({
            productName: item.productName.trim(),
            qty: item.qty,
            unitCost: item.unitCost,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar");
    } finally {
      setConfirming(false);
    }
  }

  if (success) {
    return (
      <Card>
        <Card.Body>
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Compra registrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              El inventario ha sido actualizado exitosamente.
            </p>
            <Button onClick={onReset} className="mt-4">
              Registrar otra compra
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Paso 2: Revisar y confirmar
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Verifique los datos extraidos y corrija si es necesario
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              Volver
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 max-w-sm">
            <Input
              label="Proveedor (opcional)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>

          {/* Unparsed lines warning */}
          {data.unparsedLines.length > 0 && (
            <div className="mb-4 rounded-md bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-800">
                Lineas no reconocidas:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-yellow-700">
                {data.unparsedLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-3">Producto</th>
                  <th className="pb-2 pr-3 text-right">Cant.</th>
                  <th className="pb-2 pr-3 text-right">Costo unit.</th>
                  <th className="pb-2 pr-3 text-right">Subtotal</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(index, "productName", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", e.target.value)
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(index, "unitCost", e.target.value)
                        }
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </td>
                    <td className="py-2 pr-3 text-right text-sm font-medium text-gray-700">
                      {formatCurrency(item.qty * item.unitCost)}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        title="Eliminar"
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
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="py-3 text-right text-sm font-semibold text-gray-700">
                    Total:
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Agregar item
          </button>
        </Card.Body>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onReset}>
          Cancelar
        </Button>
        <Button type="submit" loading={confirming}>
          Confirmar compra
        </Button>
      </div>
    </form>
  );
}
