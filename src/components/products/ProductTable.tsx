"use client";

import { cn } from "@/lib/utils";

interface Inventory {
  qtyOnHand: number;
  avgUnitCost: number;
}

interface Product {
  id: string;
  name: string;
  salePriceDefault: number | null;
  inventory: Inventory | null;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">
          No hay productos registrados. Crea uno para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Nombre
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
              Precio
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
              Stock
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
              Costo Prom.
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((product) => {
            const qty = product.inventory?.qtyOnHand ?? 0;
            const avgCost = product.inventory?.avgUnitCost ?? 0;
            const isLowStock = qty < 5;

            return (
              <tr
                key={product.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                  {product.salePriceDefault != null
                    ? formatCurrency(product.salePriceDefault)
                    : "---"}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-right text-sm font-medium",
                    isLowStock ? "text-red-600" : "text-gray-700"
                  )}
                >
                  {qty}
                  {isLowStock && (
                    <span className="ml-1 text-xs text-red-500">(bajo)</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                  {formatCurrency(avgCost)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product.id)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
