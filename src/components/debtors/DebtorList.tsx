"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import PaymentModal from "./PaymentModal";

interface Debtor {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
  totalPaid: number;
  balance: number;
  debts: Array<{
    id: string;
    amount: number;
    note: string | null;
    status: string;
    createdAt: string;
    payments: Array<{ id: string; amount: number; createdAt: string }>;
  }>;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function DebtorList() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingDebt, setPayingDebt] = useState<{
    debtId: string;
    debtorName: string;
    balance: number;
  } | null>(null);

  async function fetchDebtors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debts");
      if (!res.ok) throw new Error("Error al cargar deudores");
      const json = await res.json();
      setDebtors(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDebtors();
  }, []);

  function handlePaymentComplete() {
    setPayingDebt(null);
    fetchDebtors();
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
        <span className="ml-2 text-sm text-gray-500">
          Cargando deudores...
        </span>
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

  if (debtors.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">No hay deudores registrados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {debtors.map((debtor) => (
          <div
            key={debtor.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {debtor.name}
                </h3>
                {debtor.phone && (
                  <p className="text-xs text-gray-500">{debtor.phone}</p>
                )}
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  debtor.balance > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                )}
              >
                {debtor.balance > 0 ? "Con deuda" : "Al dia"}
              </span>
            </div>

            {/* Stats */}
            <div className="mb-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deuda total:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(debtor.totalDebt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pagado:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(debtor.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo:</span>
                <span
                  className={cn(
                    "font-bold",
                    debtor.balance > 0 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {formatCurrency(debtor.balance)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            {debtor.totalDebt > 0 && (
              <div className="mb-4">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.min(
                        (debtor.totalPaid / debtor.totalDebt) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">
                  {Math.round(
                    (debtor.totalPaid / debtor.totalDebt) * 100
                  )}% pagado
                </p>
              </div>
            )}

            {/* Pay buttons for open debts */}
            {debtor.balance > 0 && (
              <div className="space-y-2">
                {debtor.debts
                  .filter((d) => d.status === "OPEN")
                  .map((debt) => {
                    const debtPaid = debt.payments.reduce(
                      (sum, p) => sum + Number(p.amount),
                      0
                    );
                    const debtBalance = Number(debt.amount) - debtPaid;

                    if (debtBalance <= 0) return null;

                    return (
                      <button
                        key={debt.id}
                        type="button"
                        onClick={() =>
                          setPayingDebt({
                            debtId: debt.id,
                            debtorName: debtor.name,
                            balance: debtBalance,
                          })
                        }
                        className="flex w-full items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm transition-colors hover:bg-orange-100"
                      >
                        <span className="text-gray-700">
                          {debt.note || "Deuda"} -{" "}
                          {formatCurrency(debtBalance)}
                        </span>
                        <span className="font-medium text-orange-700">
                          Pagar
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {payingDebt && (
        <PaymentModal
          debtId={payingDebt.debtId}
          debtorName={payingDebt.debtorName}
          maxAmount={payingDebt.balance}
          onClose={() => setPayingDebt(null)}
          onSuccess={handlePaymentComplete}
        />
      )}
    </>
  );
}
