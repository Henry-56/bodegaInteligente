"use client";

import { useState, useRef, type FormEvent } from "react";
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

interface OcrDebtItem {
  debtorName: string;
  phone?: string;
  amount: number;
  note?: string;
}

interface UploadResult {
  imagePath: string;
  items: OcrDebtItem[];
  unparsedLines: string[];
  rawText: string;
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

      {/* Upload section */}
      <DebtorUploadReview onConfirmed={refetch} />

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

/* ---------- Debtor Upload & Review ---------- */

interface DebtorUploadReviewProps {
  onConfirmed: () => void;
}

function DebtorUploadReview({ onConfirmed }: DebtorUploadReviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<UploadResult | null>(null);
  const [items, setItems] = useState<OcrDebtItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpload(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/debts/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      const json = await res.json();
      setReviewData(json.data);
      setItems(json.data.items.map((i: OcrDebtItem) => ({ ...i })));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error al subir archivo"
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function updateItem(index: number, updates: Partial<OcrDebtItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setConfirmError(null);
    setConfirming(true);

    try {
      const res = await fetch("/api/debts/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath: reviewData?.imagePath,
          rawOcrText: reviewData?.rawText,
          items: items.map((item) => ({
            debtorName: item.debtorName.trim(),
            phone: item.phone || undefined,
            amount: item.amount,
            note: item.note || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      setSuccess(true);
      setReviewData(null);
      setItems([]);
      onConfirmed();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : "Error al confirmar"
      );
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setReviewData(null);
    setItems([]);
    setUploadError(null);
    setConfirmError(null);
  }

  // Review mode
  if (reviewData) {
    return (
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Revisar deudas detectadas
            </h2>
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {confirmError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {confirmError}
            </div>
          )}

          {reviewData.unparsedLines.length > 0 && (
            <div className="mb-4 rounded-md bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-800">
                Lineas no reconocidas:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-yellow-700">
                {reviewData.unparsedLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-3"
              >
                <div className="min-w-[150px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Deudor
                  </label>
                  <input
                    type="text"
                    value={item.debtorName}
                    onChange={(e) =>
                      updateItem(index, { debtorName: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Monto (S/)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      updateItem(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Nota
                  </label>
                  <input
                    type="text"
                    value={item.note || ""}
                    onChange={(e) =>
                      updateItem(index, { note: e.target.value })
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Opcional"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-1 text-gray-400 hover:text-red-600"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={reset}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={confirming}
                disabled={items.length === 0}
              >
                Confirmar deudas
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    );
  }

  // Upload mode
  return (
    <Card>
      <Card.Header>
        <h2 className="text-base font-semibold text-gray-900">
          Registrar deudas por imagen
        </h2>
      </Card.Header>
      <Card.Body>
        {uploadError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Deudas registradas exitosamente
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Subir imagen de lista de deudas
          </Button>
          <span className="text-xs text-gray-400">PNG, JPG o WEBP</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </Card.Body>
    </Card>
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
