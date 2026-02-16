"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useApi } from "@/hooks/useApi";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

interface Product {
  id: string;
  name: string;
  salePriceDefault: string | null;
  createdAt: string;
  inventory: {
    qtyOnHand: number;
    avgUnitCost: string;
  } | null;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const queryUrl = search
    ? `/api/products?search=${encodeURIComponent(search)}`
    : "/api/products";
  const { data: products, loading, error, refetch } =
    useApi<Product[]>(queryUrl);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function openCreateModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleDelete(productId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error ?? "Error al eliminar el producto");
        return;
      }
      setDeleteConfirmId(null);
      refetch();
    } catch {
      alert("Error de conexion");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Button onClick={openCreateModal}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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

      {/* Products table */}
      {!loading && !error && products && (
        <Card>
          <Card.Body className="overflow-x-auto p-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3 text-right">Precio venta</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Costo prom.</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        {product.salePriceDefault
                          ? formatCurrency(Number(product.salePriceDefault))
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-right text-sm">
                        <span
                          className={
                            (product.inventory?.qtyOnHand ?? 0) === 0
                              ? "font-medium text-red-600"
                              : (product.inventory?.qtyOnHand ?? 0) < 5
                                ? "font-medium text-yellow-600"
                                : "text-gray-600"
                          }
                        >
                          {product.inventory?.qtyOnHand ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        {product.inventory
                          ? formatCurrency(
                              Number(product.inventory.avgUnitCost)
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                            title="Editar"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Eliminar"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card.Body>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
      >
        <ProductForm
          product={editingProduct}
          onSuccess={() => {
            closeModal();
            refetch();
          }}
          onCancel={closeModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirmar eliminacion"
      >
        <p className="text-sm text-gray-600">
          Esta seguro de que desea eliminar este producto? Esta accion no se
          puede deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmId(null)}
            disabled={actionLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={actionLoading}
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Product Form Component ---------- */

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [salePrice, setSalePrice] = useState(
    product?.salePriceDefault ? String(Number(product.salePriceDefault)) : ""
  );
  const [initialQty, setInitialQty] = useState("0");
  const [initialCost, setInitialCost] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {};

      if (isEditing) {
        if (name !== product.name) body.name = name;
        body.salePriceDefault = salePrice
          ? parseFloat(salePrice)
          : null;
      } else {
        body.name = name;
        if (salePrice) body.salePriceDefault = parseFloat(salePrice);
        body.initialQty = parseInt(initialQty, 10) || 0;
        body.initialCost = parseFloat(initialCost) || 0;
      }

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      onSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <Input
        label="Nombre del producto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ej: Arroz Extra 5kg"
      />

      <Input
        label="Precio de venta (S/)"
        type="number"
        step="0.01"
        min="0"
        value={salePrice}
        onChange={(e) => setSalePrice(e.target.value)}
        placeholder="0.00"
      />

      {!isEditing && (
        <>
          <Input
            label="Cantidad inicial"
            type="number"
            min="0"
            step="1"
            value={initialQty}
            onChange={(e) => setInitialQty(e.target.value)}
          />
          <Input
            label="Costo inicial unitario (S/)"
            type="number"
            step="0.01"
            min="0"
            value={initialCost}
            onChange={(e) => setInitialCost(e.target.value)}
          />
        </>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {isEditing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
