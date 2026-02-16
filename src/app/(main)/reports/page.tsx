"use client";

import { useState, useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

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
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(getDefaultFrom);
  const [toDate, setToDate] = useState(getDefaultTo);

  const queryUrl = `/api/sales?from=${encodeURIComponent(
    fromDate
  )}&to=${encodeURIComponent(toDate + "T23:59:59")}`;

  const { data: sales, loading, error, refetch } = useApi<Sale[]>(queryUrl);

  // Compute summary
  const summary = useMemo(() => {
    if (!sales) return null;

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;
    const productMap = new Map<
      string,
      { name: string; qtySold: number; revenue: number; cost: number; profit: number }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        const revenue = Number(item.unitPrice) * item.qty;
        const cost = Number(item.unitCostSnapshot) * item.qty;
        const profit = Number(item.profit);

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;

        const existing = productMap.get(item.product.id);
        if (existing) {
          existing.qtySold += item.qty;
          existing.revenue += revenue;
          existing.cost += cost;
          existing.profit += profit;
        } else {
          productMap.set(item.product.id, {
            name: item.product.name,
            qtySold: item.qty,
            revenue,
            cost,
            profit,
          });
        }
      }
    }

    const perProduct = Array.from(productMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return {
      salesCount: sales.length,
      totalRevenue,
      totalCost,
      totalProfit,
      perProduct,
    };
  }, [sales]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Input
                label="Desde"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="w-44">
              <Input
                label="Hasta"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button onClick={refetch} variant="secondary">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Ventas totales"
              value={String(summary.salesCount)}
            />
            <SummaryCard
              label="Ingreso total"
              value={formatCurrency(summary.totalRevenue)}
              color="blue"
            />
            <SummaryCard
              label="Costo total"
              value={formatCurrency(summary.totalCost)}
              color="gray"
            />
            <SummaryCard
              label="Ganancia total"
              value={formatCurrency(summary.totalProfit)}
              color="green"
            />
          </div>

          {/* Per-product breakdown */}
          <Card>
            <Card.Header>
              <h2 className="text-base font-semibold text-gray-900">
                Desglose por producto
              </h2>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-0">
              {summary.perProduct.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  Sin datos para el periodo seleccionado
                </p>
              ) : (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3">Producto</th>
                      <th className="px-6 py-3 text-right">Uds. vendidas</th>
                      <th className="px-6 py-3 text-right">Ingreso</th>
                      <th className="px-6 py-3 text-right">Costo</th>
                      <th className="px-6 py-3 text-right">Ganancia</th>
                      <th className="px-6 py-3 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.perProduct.map((product) => {
                      const margin =
                        product.revenue > 0
                          ? (product.profit / product.revenue) * 100
                          : 0;
                      return (
                        <tr key={product.name} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {product.qtySold}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {formatCurrency(product.revenue)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {formatCurrency(product.cost)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                            {formatCurrency(product.profit)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {summary.perProduct.reduce(
                          (sum, p) => sum + p.qtySold,
                          0
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(summary.totalRevenue)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(summary.totalCost)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-green-700">
                        {formatCurrency(summary.totalProfit)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {summary.totalRevenue > 0
                          ? (
                              (summary.totalProfit / summary.totalRevenue) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Card.Body>
          </Card>

          {/* Detailed sales table */}
          <Card>
            <Card.Header>
              <h2 className="text-base font-semibold text-gray-900">
                Detalle de ventas
              </h2>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-0">
              {sales && sales.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  Sin ventas en este periodo
                </p>
              ) : (
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Productos</th>
                      <th className="px-6 py-3">Canal</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales?.map((sale) => {
                      const total = sale.items.reduce(
                        (sum, item) =>
                          sum + Number(item.unitPrice) * item.qty,
                        0
                      );
                      const profit = sale.items.reduce(
                        (sum, item) => sum + Number(item.profit),
                        0
                      );

                      return (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {formatDate(sale.soldAt)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {sale.items
                              .map(
                                (item) =>
                                  `${item.product.name} x${item.qty}`
                              )
                              .join(", ")}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {sale.channel === "CHAT" ? "Chat" : "Manual"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                            {formatCurrency(profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- Summary Card ---------- */

interface SummaryCardProps {
  label: string;
  value: string;
  color?: "blue" | "green" | "gray";
}

function SummaryCard({ label, value, color }: SummaryCardProps) {
  const textColor =
    color === "blue"
      ? "text-blue-700"
      : color === "green"
        ? "text-green-700"
        : "text-gray-900";

  return (
    <Card>
      <Card.Body>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
      </Card.Body>
    </Card>
  );
}
