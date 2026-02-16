"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SaleItem {
  id: string;
  productId: string;
  qty: number;
  unitPrice: number;
  profit: number;
  product?: { name: string };
}

interface Sale {
  id: string;
  soldAt: string;
  channel: string;
  items: SaleItem[];
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSaleTotal(sale: Sale): number {
  return sale.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.qty,
    0
  );
}

interface SalesHistoryProps {
  from?: string;
  to?: string;
}

export default function SalesHistory({ from, to }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        const url = `/api/sales${qs ? `?${qs}` : ""}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al cargar ventas");
        const json = await res.json();
        setSales(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, [from, to]);

  function toggleExpand(saleId: string) {
    setExpandedId((prev) => (prev === saleId ? null : saleId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="h-6 w-6 animate-spin text-blue-500"
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
        <span className="ml-2 text-sm text-gray-500">Cargando ventas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">No hay ventas registradas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Fecha
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
              Total
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
              Canal
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
              Detalle
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sales.map((sale) => {
            const isExpanded = expandedId === sale.id;
            const total = getSaleTotal(sale);

            return (
              <tr key={sale.id} className="group">
                <td colSpan={5} className="p-0">
                  {/* Main row */}
                  <div className="flex items-center transition-colors hover:bg-gray-50">
                    <div className="flex-1 px-4 py-3 text-sm text-gray-800">
                      {formatDate(sale.soldAt)}
                    </div>
                    <div className="w-20 px-4 py-3 text-center text-sm text-gray-600">
                      {sale.items.length}
                    </div>
                    <div className="w-28 px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(total)}
                    </div>
                    <div className="w-24 px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          sale.channel === "CHAT"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {sale.channel}
                      </span>
                    </div>
                    <div className="w-20 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(sale.id)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label={
                          isExpanded ? "Ocultar detalle" : "Ver detalle"
                        }
                      >
                        <svg
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="pb-1 text-left font-medium">
                              Producto
                            </th>
                            <th className="pb-1 text-center font-medium">
                              Cant.
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Precio Unit.
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sale.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1 text-gray-800">
                                {item.product?.name ?? item.productId}
                              </td>
                              <td className="py-1 text-center text-gray-600">
                                {item.qty}
                              </td>
                              <td className="py-1 text-right text-gray-600">
                                {formatCurrency(Number(item.unitPrice))}
                              </td>
                              <td className="py-1 text-right font-medium text-gray-800">
                                {formatCurrency(
                                  Number(item.unitPrice) * item.qty
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
