"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export interface ProductFormData {
  name: string;
  salePriceDefault?: number;
  initialQty: number;
  initialCost: number;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void | Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

interface FieldErrors {
  name?: string;
  salePriceDefault?: string;
  initialQty?: string;
  initialCost?: string;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [salePriceDefault, setSalePriceDefault] = useState<string>(
    initialData?.salePriceDefault != null
      ? String(initialData.salePriceDefault)
      : ""
  );
  const [initialQty, setInitialQty] = useState<string>(
    String(initialData?.initialQty ?? 0)
  );
  const [initialCost, setInitialCost] = useState<string>(
    String(initialData?.initialCost ?? 0)
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};

    if (!name.trim()) {
      errs.name = "Nombre es requerido";
    }

    if (salePriceDefault !== "" && Number(salePriceDefault) < 0) {
      errs.salePriceDefault = "Precio no puede ser negativo";
    }

    if (isNaN(Number(initialQty)) || Number(initialQty) < 0) {
      errs.initialQty = "Cantidad debe ser >= 0";
    }

    if (isNaN(Number(initialCost)) || Number(initialCost) < 0) {
      errs.initialCost = "Costo debe ser >= 0";
    }

    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        salePriceDefault:
          salePriceDefault !== "" ? Number(salePriceDefault) : undefined,
        initialQty: Number(initialQty),
        initialCost: Number(initialCost),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label
          htmlFor="product-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Nombre del producto <span className="text-red-500">*</span>
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            errors.name ? "border-red-500" : "border-gray-300"
          )}
          placeholder="Ej: Arroz 1kg"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Sale Price */}
      <div>
        <label
          htmlFor="product-price"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Precio de venta (S/) <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          id="product-price"
          type="number"
          step="0.01"
          min="0"
          value={salePriceDefault}
          onChange={(e) => setSalePriceDefault(e.target.value)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            errors.salePriceDefault ? "border-red-500" : "border-gray-300"
          )}
          placeholder="0.00"
        />
        {errors.salePriceDefault && (
          <p className="mt-1 text-xs text-red-600">{errors.salePriceDefault}</p>
        )}
      </div>

      {/* Initial Qty */}
      <div>
        <label
          htmlFor="product-qty"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Cantidad inicial
        </label>
        <input
          id="product-qty"
          type="number"
          step="1"
          min="0"
          value={initialQty}
          onChange={(e) => setInitialQty(e.target.value)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            errors.initialQty ? "border-red-500" : "border-gray-300"
          )}
        />
        {errors.initialQty && (
          <p className="mt-1 text-xs text-red-600">{errors.initialQty}</p>
        )}
      </div>

      {/* Initial Cost */}
      <div>
        <label
          htmlFor="product-cost"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Costo unitario inicial (S/)
        </label>
        <input
          id="product-cost"
          type="number"
          step="0.01"
          min="0"
          value={initialCost}
          onChange={(e) => setInitialCost(e.target.value)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            errors.initialCost ? "border-red-500" : "border-gray-300"
          )}
        />
        {errors.initialCost && (
          <p className="mt-1 text-xs text-red-600">{errors.initialCost}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
        >
          {submitting
            ? "Guardando..."
            : isEditing
              ? "Actualizar Producto"
              : "Crear Producto"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
