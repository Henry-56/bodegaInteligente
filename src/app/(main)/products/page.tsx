"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import Modal from "@/components/ui/Modal";

/* ---------- Types ---------- */

interface Product {
  id: string;
  name: string;
  salePriceDefault: string | null;
  inventory: { qtyOnHand: number; avgUnitCost: string } | null;
}

interface Movement {
  id: string;
  type: "PURCHASE" | "SALE";
  qty: number;
  unitCost: string;
  total: string;
  createdAt: string;
  purchaseItem?: { purchase: { vendorName: string | null; purchasedAt: string } };
  saleItem?: { sale: { soldAt: string; channel: string } };
}

/* ---------- Helpers ---------- */

function fmt(v: number) {
  return `S/ ${v.toFixed(2)}`;
}

function stockColor(qty: number) {
  if (qty === 0) return "text-red-600";
  if (qty < 50) return "text-amber-500";
  return "text-emerald-600";
}

function stockBadge(qty: number) {
  if (qty === 0)
    return "bg-red-100 text-red-700 border border-red-200";
  if (qty < 50)
    return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

const BRICK_ICONS: Record<string, string> = {
  "Ladrillo King Kong": "🧱",
  "Ladrillo Pandereta": "🏗️",
  "Ladrillo Caravavista": "🏛️",
};

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function StockPage() {
  const { data: products, loading, error, refetch } = useApi<Product[]>("/api/products");

  const [actionModal, setActionModal] = useState<{
    type: "buy" | "sell";
    product: Product;
  } | null>(null);

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const openAction = useCallback((type: "buy" | "sell", product: Product) => {
    setActionModal({ type, product });
  }, []);

  const closeAction = useCallback(() => {
    setActionModal(null);
  }, []);

  const handleTransactionComplete = useCallback(() => {
    closeAction();
    refetch();
  }, [closeAction, refetch]);

  return (
    <div className="min-h-full">
      {/* ---- Header ---- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Control de Stock
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ladrillera El Progreso · Gestión de inventario
        </p>
      </div>

      {/* ---- Loading ---- */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
            <span className="text-sm">Cargando inventario...</span>
          </div>
        </div>
      )}

      {/* ---- Error ---- */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Error al cargar productos</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-medium text-red-700 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ---- Product Cards Grid ---- */}
      {!loading && !error && products && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const qty = product.inventory?.qtyOnHand ?? 0;
            const cost = Number(product.inventory?.avgUnitCost ?? 0);
            const price = Number(product.salePriceDefault ?? 0);
            const icon = BRICK_ICONS[product.name] ?? "🧱";

            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
              >
                {/* Card top accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-amber-500" />

                <div className="flex flex-col gap-5 p-6">
                  {/* Icon + Name */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                        {icon}
                      </span>
                      <div>
                        <h2 className="text-base font-semibold leading-tight text-gray-900">
                          {product.name}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">Ladrillo estándar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHistoryProduct(product)}
                      className="rounded-lg p-1.5 text-gray-300 transition hover:bg-gray-100 hover:text-gray-600"
                      title="Ver historial"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Stock */}
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Stock Actual
                    </p>
                    <div className="mt-1 flex items-end justify-between">
                      <span className={`text-4xl font-bold tabular-nums ${stockColor(qty)}`}>
                        {qty.toLocaleString()}
                      </span>
                      <span
                        className={`mb-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stockBadge(qty)}`}
                      >
                        {qty === 0 ? "Agotado" : qty < 50 ? "Stock bajo" : "Disponible"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">unidades</p>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Costo prom.
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-700">
                        {fmt(cost)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Precio venta
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-700">
                        {price > 0 ? fmt(price) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id={`btn-buy-${product.id}`}
                      onClick={() => openAction("buy", product)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Compra
                    </button>
                    <button
                      id={`btn-sell-${product.id}`}
                      onClick={() => openAction("sell", product)}
                      disabled={qty === 0}
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                      Venta
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Transaction Modal ---- */}
      {actionModal && (
        <Modal
          open
          onClose={closeAction}
          title={
            actionModal.type === "buy"
              ? `📦 Registrar Compra — ${actionModal.product.name}`
              : `💰 Registrar Venta — ${actionModal.product.name}`
          }
        >
          <TransactionForm
            type={actionModal.type}
            product={actionModal.product}
            onSuccess={handleTransactionComplete}
            onCancel={closeAction}
          />
        </Modal>
      )}

      {/* ---- History Modal ---- */}
      {historyProduct && (
        <Modal
          open
          onClose={() => setHistoryProduct(null)}
          title={`📋 Historial — ${historyProduct.name}`}
        >
          <HistoryView productId={historyProduct.id} />
        </Modal>
      )}
    </div>
  );
}

/* ================================================================
   TRANSACTION FORM (Buy or Sell)
   ================================================================ */

interface TransactionFormProps {
  type: "buy" | "sell";
  product: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

function TransactionForm({ type, product, onSuccess, onCancel }: TransactionFormProps) {
  const isBuy = type === "buy";
  const maxQty = product.inventory?.qtyOnHand ?? 0;
  const defaultPrice = isBuy
    ? Number(product.inventory?.avgUnitCost ?? 0.8)
    : Number(product.salePriceDefault ?? 0);

  const [qty, setQty] = useState<string>("1");
  const [price, setPrice] = useState<string>(defaultPrice > 0 ? String(defaultPrice) : "");
  const [vendor, setVendor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numQty = parseInt(qty, 10) || 0;
  const numPrice = parseFloat(price) || 0;
  const total = numQty * numPrice;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (numQty <= 0) { setError("La cantidad debe ser mayor a 0"); return; }
    if (numPrice <= 0) { setError("El precio debe ser mayor a 0"); return; }
    if (!isBuy && numQty > maxQty) {
      setError(`Stock insuficiente. Disponible: ${maxQty}`);
      return;
    }

    setLoading(true);
    try {
      if (isBuy) {
        const res = await fetch("/api/purchases/confirm", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorName: vendor || undefined,
            items: [{ productName: product.name, qty: numQty, unitCost: numPrice }],
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Error ${res.status}`);
        }
      } else {
        const res = await fetch("/api/sales", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ productId: product.id, qty: numQty, unitPrice: numPrice }],
            channel: "MANUAL",
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Error ${res.status}`);
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const accentColor = isBuy ? "emerald" : "blue";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product info banner */}
      <div className={`flex items-center gap-3 rounded-xl p-4 ${
        isBuy ? "bg-emerald-50 border border-emerald-100" : "bg-blue-50 border border-blue-100"
      }`}>
        <span className="text-2xl">{BRICK_ICONS[product.name] ?? "🧱"}</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{product.name}</p>
          <p className="text-xs text-gray-500">
            Stock actual:{" "}
            <span className={`font-bold ${stockColor(product.inventory?.qtyOnHand ?? 0)}`}>
              {product.inventory?.qtyOnHand ?? 0} unidades
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Cantidad (unid.)
          </label>
          <input
            id="tx-qty"
            type="number"
            min="1"
            max={isBuy ? undefined : maxQty}
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-right text-lg font-bold tabular-nums text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            {isBuy ? "Costo unit. (S/)" : "Precio unit. (S/)"}
          </label>
          <input
            id="tx-price"
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-right text-lg font-bold tabular-nums text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>
      </div>

      {isBuy && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Proveedor (opcional)
          </label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Nombre del proveedor"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      )}

      {/* Total */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
        isBuy ? "bg-emerald-50" : "bg-blue-50"
      }`}>
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {fmt(total)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50 ${
            isBuy
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : isBuy ? (
            "✅ Confirmar Compra"
          ) : (
            "💰 Confirmar Venta"
          )}
        </button>
      </div>
    </form>
  );
}

/* ================================================================
   HISTORY VIEW
   ================================================================ */

function HistoryView({ productId }: { productId: string }) {
  const { data: history, loading, error } = useApi<Movement[]>(
    `/api/products/${productId}/history`
  );

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
      </div>
    );
  if (error)
    return <p className="py-8 text-center text-sm text-red-500">Error al cargar historial</p>;

  return (
    <div className="space-y-3">
      {!history || history.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay movimientos registrados aún
        </p>
      ) : (
        <div className="max-h-[350px] overflow-y-auto pr-1">
          {history.map((m) => {
            const isBuy = m.type === "PURCHASE";
            const date = new Date(m.createdAt).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const time = new Date(m.createdAt).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${
                    isBuy
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isBuy ? "+" : "−"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isBuy ? "text-emerald-600" : "text-blue-600"
                      }`}
                    >
                      {isBuy ? "Compra" : "Venta"}
                    </span>
                    {m.purchaseItem?.purchase.vendorName && (
                      <span className="truncate text-[10px] text-gray-400">
                        · {m.purchaseItem.purchase.vendorName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {date} · {time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{m.qty} unid.</p>
                  <p className="text-xs text-gray-400">{fmt(Number(m.unitCost))} c/u</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
