"use client";

import { useState, useMemo } from "react";
import { useApi } from "@/hooks/useApi";

/* ---------- Types ---------- */

interface Movement {
  id: string;
  type: "PURCHASE" | "SALE";
  qty: number;
  unitCost: string;
  total: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    salePriceDefault: string | null;
  };
  purchaseItem?: {
    purchase: { vendorName: string | null; purchasedAt: string };
  };
  saleItem?: {
    sale: { soldAt: string; channel: string };
  };
}

/* ---------- Helpers ---------- */

function fmt(v: number) {
  return `S/ ${v.toFixed(2)}`;
}

function dt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
  };
}

const ICONS: Record<string, string> = {
  "Ladrillo King Kong": "🧱",
  "Ladrillo Pandereta": "🏗️",
  "Ladrillo Caravavista": "🏛️",
};

/* ================================================================
   SALES PAGE
   ================================================================ */

export default function SalesPage() {
  const { data: movements, loading, error, refetch } = useApi<Movement[]>("/api/reports/kardex");

  const [filterType, setFilterType] = useState<"ALL" | "PURCHASE" | "SALE">("ALL");
  const [filterProduct, setFilterProduct] = useState<string>("ALL");

  /* unique products from data */
  const products = useMemo(() => {
    if (!movements) return [];
    const seen = new Map<string, string>();
    for (const m of movements) seen.set(m.product.id, m.product.name);
    return Array.from(seen.entries());
  }, [movements]);

  const filtered = useMemo(() => {
    if (!movements) return [];
    return movements.filter((m) => {
      if (filterType !== "ALL" && m.type !== filterType) return false;
      if (filterProduct !== "ALL" && m.product.id !== filterProduct) return false;
      return true;
    });
  }, [movements, filterType, filterProduct]);

  /* summary counters */
  const summary = useMemo(() => {
    if (!filtered) return null;
    const purchases = filtered.filter((m) => m.type === "PURCHASE");
    const sales = filtered.filter((m) => m.type === "SALE");
    return {
      totalMov: filtered.length,
      totalBoughtUnits: purchases.reduce((s, m) => s + m.qty, 0),
      totalBoughtValue: purchases.reduce((s, m) => s + Number(m.total), 0),
      totalSoldUnits: sales.reduce((s, m) => s + m.qty, 0),
      totalSoldValue: sales.reduce((s, m) => s + Number(m.total), 0),
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Movimientos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Historial completo de compras y ventas · Ladrillera El Progreso
        </p>
      </div>

      {/* Summary Strips */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryPill
            label="Total movimientos"
            value={String(summary.totalMov)}
            color="gray"
            icon="📊"
          />
          <SummaryPill
            label="Comprado"
            value={`${summary.totalBoughtUnits.toLocaleString()} unid.`}
            sub={fmt(summary.totalBoughtValue)}
            color="emerald"
            icon="📦"
          />
          <SummaryPill
            label="Vendido"
            value={`${summary.totalSoldUnits.toLocaleString()} unid.`}
            sub={fmt(summary.totalSoldValue)}
            color="blue"
            icon="💰"
          />
          <SummaryPill
            label="Ganancia implícita"
            value={fmt(summary.totalSoldValue - (summary.totalBoughtValue * (summary.totalSoldUnits / (summary.totalBoughtUnits || 1))))}
            color="amber"
            icon="📈"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type filter */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {(["ALL", "PURCHASE", "SALE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === t
                  ? t === "ALL"
                    ? "bg-gray-800 text-white"
                    : t === "PURCHASE"
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "ALL" ? "Todos" : t === "PURCHASE" ? "📦 Compras" : "💰 Ventas"}
            </button>
          ))}
        </div>

        {/* Product filter */}
        {products.length > 0 && (
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm focus:outline-none"
          >
            <option value="ALL">Todos los productos</option>
            {products.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={refetch}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
          Error al cargar los movimientos
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white py-16 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-gray-500">No hay movimientos que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />

              <div className="space-y-3">
                {filtered.map((m) => {
                  const isBuy = m.type === "PURCHASE";
                  const { date, time } = dt(m.createdAt);
                  const icon = ICONS[m.product.name] ?? "🧱";
                  const vendor = m.purchaseItem?.purchase.vendorName;
                  const channel = m.saleItem?.sale.channel;

                  return (
                    <div key={m.id} className="relative flex gap-4 pl-14">
                      {/* dot */}
                      <div
                        className={`absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow ${
                          isBuy ? "bg-emerald-500" : "bg-blue-500"
                        }`}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {isBuy ? "+" : "−"}
                        </span>
                      </div>

                      {/* card */}
                      <div className="flex w-full flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center">
                        {/* product icon + name */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl">
                            {icon}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {m.product.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {date} · {time}
                              {vendor && (
                                <span className="ml-1 text-gray-400">· {vendor}</span>
                              )}
                              {channel && (
                                <span className="ml-1 text-gray-400">
                                  · {channel === "CHAT" ? "Chat" : "Manual"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* badge */}
                        <span
                          className={`self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:self-center ${
                            isBuy
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isBuy ? "Compra" : "Venta"}
                        </span>

                        {/* numbers */}
                        <div className="flex items-center gap-4 text-right sm:ml-4">
                          <div>
                            <p className="text-[10px] font-medium uppercase text-gray-400">Cant.</p>
                            <p className="text-base font-bold tabular-nums text-gray-900">
                              {m.qty.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium uppercase text-gray-400">Unit.</p>
                            <p className="text-sm font-semibold tabular-nums text-gray-700">
                              {fmt(Number(m.unitCost))}
                            </p>
                          </div>
                          <div className={`rounded-xl px-3 py-2 ${isBuy ? "bg-emerald-50" : "bg-blue-50"}`}>
                            <p className="text-[10px] font-medium uppercase text-gray-400">Total</p>
                            <p className={`text-base font-bold tabular-nums ${isBuy ? "text-emerald-700" : "text-blue-700"}`}>
                              {fmt(Number(m.total))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Summary Pill ---------- */

function SummaryPill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "gray" | "emerald" | "blue" | "amber";
  icon: string;
}) {
  const bg: Record<typeof color, string> = {
    gray: "bg-gray-50 border-gray-200",
    emerald: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
  };
  const text: Record<typeof color, string> = {
    gray: "text-gray-800",
    emerald: "text-emerald-800",
    blue: "text-blue-800",
    amber: "text-amber-800",
  };

  return (
    <div className={`rounded-2xl border ${bg[color]} p-4`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-1 text-xl font-bold tabular-nums ${text[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
