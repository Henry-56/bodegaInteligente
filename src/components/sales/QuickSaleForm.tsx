"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  salePriceDefault: number | null;
  inventory: { qtyOnHand: number } | null;
}

interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  maxQty: number;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function QuickSaleForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Error al cargar productos");
        const json = await res.json();
        setProducts(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Auto-fill price when product is selected
  useEffect(() => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (product?.salePriceDefault != null) {
      setUnitPrice(product.salePriceDefault);
    } else {
      setUnitPrice(0);
    }
  }, [selectedProductId, products]);

  function addItem() {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if product already added
    const existingIndex = items.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingIndex >= 0) {
      // Update qty instead of adding duplicate
      setItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex
            ? { ...item, qty: item.qty + qty, unitPrice }
            : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          qty,
          unitPrice,
          maxQty: product.inventory?.qtyOnHand ?? 0,
        },
      ]);
    }

    // Reset form
    setSelectedProductId("");
    setQty(1);
    setUnitPrice(0);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getTotal(): number {
    return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  }

  async function handleSubmit() {
    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productId, qty, unitPrice }) => ({
            productId,
            qty,
            unitPrice,
          })),
          channel: "MANUAL",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al registrar venta");
      }

      setSuccess("Venta registrada correctamente.");
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Product selector row */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Agregar producto
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Product dropdown */}
          <div className="flex-1">
            <label
              htmlFor="sale-product"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Producto
            </label>
            <select
              id="sale-product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Seleccionar --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.inventory?.qtyOnHand ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Qty */}
          <div className="w-24">
            <label
              htmlFor="sale-qty"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Cant.
            </label>
            <input
              id="sale-qty"
              type="number"
              min="1"
              step="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Unit Price */}
          <div className="w-28">
            <label
              htmlFor="sale-price"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              Precio Unit.
            </label>
            <input
              id="sale-price"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedProductId || qty <= 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                  Producto
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600">
                  Cant.
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600">
                  Precio Unit.
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600">
                  Subtotal
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-700">
                    {item.qty}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.qty * item.unitPrice)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 transition-colors hover:text-red-700"
                      aria-label="Quitar producto"
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
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                >
                  Total:
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-gray-900">
                  {formatCurrency(getTotal())}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
          >
            {submitting ? "Registrando..." : "Registrar Venta"}
          </button>
        </div>
      )}
    </div>
  );
}
