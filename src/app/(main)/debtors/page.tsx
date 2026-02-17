"use client";

import { useState, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

interface Debt {
  id: string;
  amount: string;
  note: string | null;
  status: "OPEN" | "PAID";
  createdAt: string;
  payments: Array<{
    id: string;
    amount: string;
    paidAt: string;
  }>;
}

interface Debtor {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  debts: Debt[];
  totalDebt: number;
  totalPaid: number;
  balance: number;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DebtorsPage() {
  const { data: debtors, loading, error, refetch } =
    useApi<Debtor[]>("/api/debts");

  const [paymentModal, setPaymentModal] = useState<{
    debtId: string;
    debtorName: string;
    remaining: number;
  } | null>(null);
  const [expandedDebtor, setExpandedDebtor] = useState<string | null>(null);

  function toggleExpand(debtorId: string) {
    setExpandedDebtor((prev) => (prev === debtorId ? null : debtorId));
  }

  function openPaymentModal(
    debtId: string,
    debtorName: string,
    remaining: number
  ) {
    setPaymentModal({ debtId, debtorName, remaining });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Deudores</h1>

      {/* Debtors list */}
      <Card>
        <Card.Header>
          <h2 className="text-base font-semibold text-gray-900">
            Lista de deudores
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

          {!loading && !error && debtors && (
            <>
              {debtors.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">
                  No hay deudores registrados
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {debtors.map((debtor) => (
                    <div key={debtor.id}>
                      {/* Debtor summary row */}
                      <button
                        onClick={() => toggleExpand(debtor.id)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {debtor.name}
                          </p>
                          {debtor.phone && (
                            <p className="text-xs text-gray-400">
                              {debtor.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-semibold ${
                              debtor.balance > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {debtor.balance > 0
                              ? formatCurrency(debtor.balance)
                              : "Pagado"}
                          </span>
                          <svg
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                              expandedDebtor === debtor.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded debtor details */}
                      {expandedDebtor === debtor.id && (
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                          <div className="mb-3 flex gap-6 text-xs text-gray-500">
                            <span>
                              Total adeudado:{" "}
                              <strong>
                                {formatCurrency(debtor.totalDebt)}
                              </strong>
                            </span>
                            <span>
                              Total pagado:{" "}
                              <strong>
                                {formatCurrency(debtor.totalPaid)}
                              </strong>
                            </span>
                            <span>
                              Saldo:{" "}
                              <strong className="text-red-600">
                                {formatCurrency(debtor.balance)}
                              </strong>
                            </span>
                          </div>

                          {debtor.debts.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              Sin deudas registradas
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {debtor.debts.map((debt) => {
                                const paid = debt.payments.reduce(
                                  (sum, p) => sum + Number(p.amount),
                                  0
                                );
                                const remaining =
                                  Number(debt.amount) - paid;

                                return (
                                  <div
                                    key={debt.id}
                                    className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                                  >
                                    <div>
                                      <p className="text-sm text-gray-700">
                                        {formatCurrency(Number(debt.amount))}
                                        {debt.note && (
                                          <span className="ml-2 text-xs text-gray-400">
                                            - {debt.note}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {formatDate(debt.createdAt)}
                                        <span
                                          className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                            debt.status === "PAID"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {debt.status === "PAID"
                                            ? "Pagado"
                                            : `Pendiente: ${formatCurrency(
                                                remaining
                                              )}`}
                                        </span>
                                      </p>
                                    </div>
                                    {debt.status === "OPEN" &&
                                      remaining > 0 && (
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() =>
                                            openPaymentModal(
                                              debt.id,
                                              debtor.name,
                                              remaining
                                            )
                                          }
                                        >
                                          Pagar
                                        </Button>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          debtId={paymentModal.debtId}
          debtorName={paymentModal.debtorName}
          remaining={paymentModal.remaining}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => {
            setPaymentModal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Payment Modal ---------- */

interface PaymentModalProps {
  debtId: string;
  debtorName: string;
  remaining: number;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({
  debtId,
  debtorName,
  remaining,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(String(remaining));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Ingrese un monto valido");
      return;
    }

    if (numAmount > remaining) {
      setError(`El monto no puede ser mayor a ${formatCurrency(remaining)}`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar pago"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Pago - ${debtorName}`}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-600">
        Saldo pendiente:{" "}
        <span className="font-semibold text-red-600">
          {formatCurrency(remaining)}
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Monto a pagar (S/)"
          type="number"
          min="0.01"
          step="0.01"
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Registrar pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}
