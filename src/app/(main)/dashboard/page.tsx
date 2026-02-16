"use client";

import { useApi } from "@/hooks/useApi";
import Card from "@/components/ui/Card";

interface DashboardData {
  today: {
    revenue: number;
    profit: number;
    salesCount: number;
  };
  week: {
    revenue: number;
    profit: number;
    salesCount: number;
  };
  topProducts: Array<{
    name: string;
    qty: number;
    revenue: number;
  }>;
  lowStock: Array<{
    productId: string;
    name: string;
    qtyOnHand: number;
  }>;
  totalDebt: number;
}

function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

export default function DashboardPage() {
  const { data, loading, error, refetch } =
    useApi<DashboardData>("/api/reports/dashboard");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={refetch}
          className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Ventas hoy"
          value={formatCurrency(data.today.revenue)}
          subtitle={`${data.today.salesCount} ventas`}
          color="blue"
        />
        <DashboardCard
          title="Ganancia hoy"
          value={formatCurrency(data.today.profit)}
          subtitle="Beneficio neto"
          color="green"
        />
        <DashboardCard
          title="Ventas semana"
          value={formatCurrency(data.week.revenue)}
          subtitle={`${data.week.salesCount} ventas`}
          color="purple"
        />
        <DashboardCard
          title="Deuda total"
          value={formatCurrency(data.totalDebt)}
          subtitle="Pendiente de cobro"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <Card.Header>
            <h2 className="text-base font-semibold text-gray-900">
              Productos mas vendidos (semana)
            </h2>
          </Card.Header>
          <Card.Body className="p-0">
            {data.topProducts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                Sin ventas esta semana
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3 text-right">Cant.</th>
                    <th className="px-6 py-3 text-right">Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-800">
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-600">
                        {product.qty}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card.Body>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <Card.Header>
            <h2 className="text-base font-semibold text-gray-900">
              Alertas de stock bajo
            </h2>
          </Card.Header>
          <Card.Body className="p-0">
            {data.lowStock.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                Todos los productos tienen stock suficiente
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.lowStock.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-800">{item.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.qtyOnHand === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.qtyOnHand === 0
                        ? "Agotado"
                        : `${item.qtyOnHand} uds.`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Dashboard Card Component ---------- */

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "green" | "purple" | "red";
}

const colorMap: Record<DashboardCardProps["color"], { bg: string; text: string; accent: string }> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    accent: "bg-blue-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-700",
    accent: "bg-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    accent: "bg-purple-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    accent: "bg-red-600",
  },
};

function DashboardCard({ title, value, subtitle, color }: DashboardCardProps) {
  const colors = colorMap[color];

  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${colors.text}`}>{value}</p>
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}
          >
            <div className={`h-3 w-3 rounded-full ${colors.accent}`} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
