"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface PurchaseRow {
  productName: string;
  qty: number;
  unitCost: number;
}

interface ReviewTableProps {
  initialItems: PurchaseRow[];
  imagePath?: string;
  rawText?: string;
  unparsedLines?: string[];
  onConfirm: (items: PurchaseRow[], imagePath?: string, rawText?: string) => void | Promise<void>;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function ReviewTable({
  initialItems,
  imagePath,
  rawText,
  unparsedLines,
  onConfirm,
}: ReviewTableProps) {
  const [items, setItems] = useState<PurchaseRow[]>(
    initialItems.length > 0
      ? initialItems
      : [{ productName: "", qty: 1, unitCost: 0 }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, field: keyof PurchaseRow, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addRow() {
    setItems((prev) => [...prev, { productName: "", qty: 1, unitCost: 0 }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getSubtotal(item: PurchaseRow): number {
    return item.qty * item.unitCost;
  }

  function getTotal(): number {
    return items.reduce((sum, item) => sum + getSubtotal(item), 0);
  }

  async function handleConfirm() {
    // Validate
    const hasEmpty = items.some((item) => !item.productName.trim());
    if (hasEmpty) {
      setError("Todos los productos deben tener nombre.");
      return;
    }

    const hasInvalid = items.some(
      (item) => item.qty <= 0 || item.unitCost <= 0
    );
    if (hasInvalid) {
      setError("Cantidad y costo deben ser mayores a 0.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onConfirm(items, imagePath, rawText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar compra");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Unparsed lines warning */}
      {unparsedLines && unparsedLines.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-3">
          <p className="mb-1 text-sm font-medium text-yellow-800">
            Lineas no reconocidas por OCR:
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
                Producto
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-600">
                Cant.
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-600">
                Costo Unit.
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">
                Subtotal
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
                    value={item.productName}
                    onChange={(e) =>
                      updateItem(index, "productName", e.target.value)
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nombre del producto"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(index, "qty", Number(e.target.value))
                    }
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) =>
                      updateItem(index, "unitCost", Number(e.target.value))
                    }
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium text-gray-800">
                  {formatCurrency(getSubtotal(item))}
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
              <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                Total:
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-bold text-gray-900">
                {formatCurrency(getTotal())}
              </td>
              <td />
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
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
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
          {submitting ? "Confirmando..." : "Confirmar Compra"}
        </button>
      </div>
    </div>
  );
}
