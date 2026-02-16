"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface Product {
  id: string;
  name: string;
  salePriceDefault: string | null;
  inventory: {
    qtyOnHand: number;
  } | null;
}

interface SaleItem {
  id: string;
  qty: number;
  unitPrice: string;
  unitCostSnapshot: string;
  profit: string;
  product: {
    id: string;
    name: string;
  };
}

interface Sale {
  id: string;
  soldAt: string;
  total: string | null;
  channel: string;
  items: SaleItem[];
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SalesPage() {
  const { data: sales, loading, error, refetch } =
    useApi<Sale[]>("/api/sales");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>

      {/* Quick Sale Form */}
      <QuickSaleForm onSaleComplete={refetch} />

      {/* Sales History */}
      <Card>
        <Card.Header>
          <h2 className="text-base font-semibold text-gray-900">
            Historial de ventas
          </h2>
        </Card.Header>
        <Card.Body className="p-0">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
                <button
                  onClick={refetch}
                  className="ml-2 font-medium underline hover:text-red-800"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!loading && !error && sales && (
            <>
              {sales.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  No hay ventas registradas
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sales.map((sale) => {
                    const total = sale.items.reduce(
                      (sum, item) => sum + Number(item.unitPrice) * item.qty,
                      0
                    );
                    return (
                      <div
                        key={sale.id}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(total)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(sale.soldAt)}{" "}
                              <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {sale.channel === "CHAT" ? "Chat" : "Manual"}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {sale.items.length} producto
                              {sale.items.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {sale.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-xs text-gray-500"
                            >
                              <span>
                                {item.product.name} x{item.qty}
                              </span>
                              <span>
                                {formatCurrency(
                                  Number(item.unitPrice) * item.qty
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

/* ---------- Quick Sale Form ---------- */

interface SaleLineItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  maxQty: number;
}

interface QuickSaleFormProps {
  onSaleComplete: () => void;
}

function QuickSaleForm({ onSaleComplete }: QuickSaleFormProps) {
  const { data: products } = useApi<Product[]>("/api/products");

  const [lines, setLines] = useState<SaleLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { productId: "", productName: "", qty: 1, unitPrice: 0, maxQty: 0 },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, updates: Partial<SaleLineItem>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...updates } : line))
    );
  }

  function handleProductSelect(index: number, productId: string) {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    updateLine(index, {
      productId: product.id,
      productName: product.name,
      unitPrice: product.salePriceDefault
        ? Number(product.salePriceDefault)
        : 0,
      maxQty: product.inventory?.qtyOnHand ?? 0,
    });
  }

  const total = lines.reduce(
    (sum, line) => sum + line.qty * line.unitPrice,
    0
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (lines.length === 0) {
      setError("Agregue al menos un producto");
      return;
    }

    const invalidLine = lines.find(
      (line) => !line.productId || line.qty <= 0 || line.unitPrice < 0
    );
    if (invalidLine) {
      setError("Complete todos los campos correctamente");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
          })),
          channel: "MANUAL",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      setSuccess(true);
      setLines([]);
      onSaleComplete();

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar venta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <h2 className="text-base font-semibold text-gray-900">Venta rapida</h2>
      </Card.Header>
      <Card.Body>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Venta registrada exitosamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Line items */}
          {lines.length > 0 && (
            <div className="space-y-3">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Producto
                    </label>
                    <select
                      value={line.productId}
                      onChange={(e) =>
                        handleProductSelect(index, e.target.value)
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.inventory?.qtyOnHand ?? 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={line.maxQty || undefined}
                      step="1"
                      value={line.qty}
                      onChange={(e) =>
                        updateLine(index, {
                          qty: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Precio (S/)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(index, {
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex w-24 items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(line.qty * line.unitPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
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
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addLine}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Agregar producto
            </button>

            {lines.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-900">
                  Total: {formatCurrency(total)}
                </span>
                <Button type="submit" loading={submitting}>
                  Registrar venta
                </Button>
              </div>
            )}
          </div>
        </form>
      </Card.Body>
    </Card>
  );
}
