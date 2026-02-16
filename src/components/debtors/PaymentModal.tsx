"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  debtId: string;
  debtorName: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function PaymentModal({
  debtId,
  debtorName,
  maxAmount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Monto debe ser mayor a 0.");
      return;
    }
    if (numAmount > maxAmount) {
      setError(`Monto no puede exceder ${formatCurrency(maxAmount)}.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al registrar pago");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePayFull() {
    setAmount(String(maxAmount));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Registrar Pago
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg
              className="h-5 w-5"
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
        </div>

        {/* Info */}
        <div className="mb-4 rounded-md bg-gray-50 p-3">
          <p className="text-sm text-gray-600">
            Deudor: <span className="font-medium text-gray-900">{debtorName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Saldo pendiente:{" "}
            <span className="font-bold text-red-600">
              {formatCurrency(maxAmount)}
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="payment-amount"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Monto del pago (S/)
            </label>
            <div className="flex gap-2">
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  error ? "border-red-500" : "border-gray-300"
                )}
                placeholder="0.00"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePayFull}
                className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Pagar todo
              </button>
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !amount}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
            >
              {submitting ? "Registrando..." : "Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
