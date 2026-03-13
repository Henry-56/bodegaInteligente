"use client";

import { useState, useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/error-messages";

/* ---------- Types ---------- */

interface SaleItem {
  id: string;
  qty: number;
  unitPrice: string;
  unitCostSnapshot: string;
  profit: string;
  product: { id: string; name: string };
}

interface Sale {
  id: string;
  soldAt: string;
  total: string | null;
  channel: string;
  items: SaleItem[];
}

interface Movement {
  id: string;
  type: "PURCHASE" | "SALE";
  qty: number;
  unitCost: string;
  total: string;
  createdAt: string;
  product: { id: string; name: string; salePriceDefault: string | null };
  purchaseItem?: { purchase: { vendorName: string | null; purchasedAt: string } };
  saleItem?: { sale: { soldAt: string; channel: string } };
}

/* ---------- Helpers ---------- */

function fmt(v: number) {
  return `S/ ${v.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDefaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo() {
  return new Date().toISOString().split("T")[0];
}

/* ================================================================
   REPORTS PAGE
   ================================================================ */

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(getDefaultFrom);
  const [toDate, setToDate] = useState(getDefaultTo);
  const [exporting, setExporting] = useState(false);

  const salesUrl = `/api/sales?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate + "T23:59:59")}`;
  const kardexUrl = `/api/reports/kardex?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate + "T23:59:59")}`;

  const { data: sales, loading, error, refetch } = useApi<Sale[]>(salesUrl);
  const { data: movements, refetch: refetchK } = useApi<Movement[]>(kardexUrl);

  function handleRefetch() {
    refetch();
    refetchK();
  }

  /* ---- Summary ---- */
  const summary = useMemo(() => {
    if (!sales) return null;
    let totalRevenue = 0, totalProfit = 0, totalCost = 0;
    const productMap = new Map<string, { name: string; qtySold: number; revenue: number; cost: number; profit: number }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const revenue = Number(item.unitPrice) * item.qty;
        const cost = Number(item.unitCostSnapshot) * item.qty;
        const profit = Number(item.profit);
        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;
        const ex = productMap.get(item.product.id);
        if (ex) {
          ex.qtySold += item.qty;
          ex.revenue += revenue;
          ex.cost += cost;
          ex.profit += profit;
        } else {
          productMap.set(item.product.id, { name: item.product.name, qtySold: item.qty, revenue, cost, profit });
        }
      }
    }

    return {
      salesCount: sales.length,
      totalRevenue,
      totalCost,
      totalProfit,
      perProduct: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }, [sales]);

  /* ---- Excel Export ---- */
  async function handleExportKardex() {
    if (!movements) return;
    setExporting(true);

    try {
      const XLSX = await import("xlsx");

      /* Kardex sheet data */
      const kardexRows = movements.map((m) => ({
        Fecha: fmtDate(m.createdAt),
        Producto: m.product.name,
        Tipo: m.type === "PURCHASE" ? "Compra" : "Venta",
        Cantidad: m.qty,
        "Costo Unitario (S/)": Number(m.unitCost),
        "Total (S/)": Number(m.total),
        Proveedor: m.purchaseItem?.purchase.vendorName ?? "",
        Canal: m.saleItem?.sale.channel ?? "",
      }));

      /* Summary sheet data */
      const summaryRows: object[] = [];
      if (summary) {
        summaryRows.push(
          { Métrica: "Total Ventas", Valor: summary.salesCount },
          { Métrica: "Ingresos Totales (S/)", Valor: summary.totalRevenue.toFixed(2) },
          { Métrica: "Costos Totales (S/)", Valor: summary.totalCost.toFixed(2) },
          { Métrica: "Ganancia Total (S/)", Valor: summary.totalProfit.toFixed(2) },
        );
      }

      /* Per-product sheet */
      const prodRows = (summary?.perProduct ?? []).map((p) => ({
        Producto: p.name,
        "Unid. Vendidas": p.qtySold,
        "Ingresos (S/)": p.revenue.toFixed(2),
        "Costo (S/)": p.cost.toFixed(2),
        "Ganancia (S/)": p.profit.toFixed(2),
        "Margen (%)": p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0.0",
      }));

      const wb = XLSX.utils.book_new();

      const wsKardex = XLSX.utils.json_to_sheet(kardexRows);
      wsKardex["!cols"] = [
        { wch: 20 }, { wch: 22 }, { wch: 10 }, { wch: 10 },
        { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, wsKardex, "Kardex");

      const wsProd = XLSX.utils.json_to_sheet(prodRows);
      wsProd["!cols"] = [
        { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProd, "Por Producto");

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      const fileName = `kardex_${fromDate}_${toDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">Ladrillera El Progreso · Análisis financiero</p>
        </div>

        {/* Kardex export */}
        <button
          id="btn-export-kardex"
          onClick={handleExportKardex}
          disabled={exporting || !movements}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Kárdex Excel
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Input label="Desde" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="w-44">
              <Input label="Hasta" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button
              onClick={handleRefetch}
              className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </Card.Body>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {getErrorMessage(error)}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && summary && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Ventas realizadas" value={String(summary.salesCount)} icon="🛒" color="gray" />
            <KpiCard label="Ingresos" value={fmt(summary.totalRevenue)} icon="💵" color="blue" />
            <KpiCard label="Costos" value={fmt(summary.totalCost)} icon="📦" color="amber" />
            <KpiCard label="Ganancia" value={fmt(summary.totalProfit)} icon="📈" color="emerald" />
          </div>

          {/* Per-product breakdown */}
          <Card>
            <Card.Header>
              <h2 className="text-base font-semibold text-gray-900">Desglose por producto</h2>
            </Card.Header>
            <Card.Body className="overflow-x-auto p-0">
              {summary.perProduct.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  Sin datos para el periodo seleccionado
                </p>
              ) : (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                      const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                      return (
                        <tr key={product.name} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {product.qtySold.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {fmt(product.revenue)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {fmt(product.cost)}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-emerald-600">
                            {fmt(product.profit)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              margin >= 20 ? "bg-emerald-100 text-emerald-700"
                              : margin >= 10 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-900">Total</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {summary.perProduct.reduce((s, p) => s + p.qtySold, 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {fmt(summary.totalRevenue)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">
                        {fmt(summary.totalCost)}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-emerald-700">
                        {fmt(summary.totalProfit)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {summary.totalRevenue > 0
                            ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)
                            : "0.0"}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Card.Body>
          </Card>

          {/* Kardex preview table */}
          {movements && movements.length > 0 && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Kárdex — Vista previa
                  </h2>
                  <span className="text-xs text-gray-400">{movements.length} movimientos</span>
                </div>
              </Card.Header>
              <Card.Body className="overflow-x-auto p-0">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Producto</th>
                      <th className="px-6 py-3 text-center">Tipo</th>
                      <th className="px-6 py-3 text-right">Cant.</th>
                      <th className="px-6 py-3 text-right">Costo Unit.</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {movements.slice(0, 20).map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-2.5 text-xs text-gray-500">{fmtDate(m.createdAt)}</td>
                        <td className="px-6 py-2.5 text-sm font-medium text-gray-900">{m.product.name}</td>
                        <td className="px-6 py-2.5 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            m.type === "PURCHASE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {m.type === "PURCHASE" ? "Compra" : "Venta"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-right text-sm tabular-nums text-gray-700">
                          {m.qty.toLocaleString()}
                        </td>
                        <td className="px-6 py-2.5 text-right text-sm tabular-nums text-gray-600">
                          {fmt(Number(m.unitCost))}
                        </td>
                        <td className={`px-6 py-2.5 text-right text-sm font-semibold tabular-nums ${
                          m.type === "PURCHASE" ? "text-emerald-600" : "text-blue-600"
                        }`}>
                          {fmt(Number(m.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {movements.length > 20 && (
                  <p className="px-6 py-3 text-center text-xs text-gray-400">
                    Mostrando 20 de {movements.length} registros — Exporte el Excel para ver todos
                  </p>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- KPI Card ---------- */
function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "gray" | "blue" | "emerald" | "amber";
}) {
  const bg = { gray: "bg-gray-50", blue: "bg-blue-50", emerald: "bg-emerald-50", amber: "bg-amber-50" };
  const border = { gray: "border-gray-200", blue: "border-blue-200", emerald: "border-emerald-200", amber: "border-amber-200" };
  const text = { gray: "text-gray-800", blue: "text-blue-800", emerald: "text-emerald-800", amber: "text-amber-800" };

  return (
    <div className={`rounded-2xl border ${border[color]} ${bg[color]} p-4`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${text[color]}`}>{value}</p>
    </div>
  );
}
