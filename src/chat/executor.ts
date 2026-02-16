import type { ChatIntent } from "./intent-router";
import { prisma } from "@/lib/prisma";
import { findProductByName } from "@/services/product.service";
import { recordSale } from "@/services/inventory.service";
import { confirmDebts } from "@/services/debtor.service";
import { startOfDayLima, endOfDayLima, startOfWeekLima, startOfMonthLima, formatSoles } from "@/lib/date";

interface ExecResult {
  response: string;
  success: boolean;
  data?: unknown;
}

export async function executeIntent(
  intent: ChatIntent,
  warehouseId: string,
  userId: string
): Promise<ExecResult> {
  switch (intent.intent) {
    case "SALE":
      return executeSale(intent, warehouseId, userId);
    case "STOCK_QUERY":
      return executeStockQuery(intent, warehouseId);
    case "PROFIT_QUERY":
      return executeProfitQuery(intent, warehouseId);
    case "DEBT_REGISTER":
      return executeDebtRegistration(intent, warehouseId);
    case "DEBT_PAYMENT":
      return executeDebtPayment(intent, warehouseId);
    case "CHAT":
      return {
        response: intent.message ?? "¿En qué puedo ayudarte?",
        success: true,
      };
    case "UNKNOWN":
      return {
        response:
          'No entendí tu mensaje. Prueba con:\n- "vendí 5 galletas a 2.50"\n- "stock de galletas"\n- "ganancia hoy"\n- "Juan pagó 10"',
        success: false,
      };
  }
}

export async function executeSale(
  intent: Extract<ChatIntent, { intent: "SALE" }>,
  warehouseId: string,
  userId: string
): Promise<ExecResult> {
  const saleItems: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
  }> = [];

  for (const p of intent.products) {
    const product = await findProductByName(warehouseId, p.name);
    if (!product) {
      return {
        response: `No encontré el producto "${p.name}" en tu inventario.`,
        success: false,
      };
    }

    const unitPrice =
      p.unitPrice ?? (product.salePriceDefault ? Number(product.salePriceDefault) : null);
    if (unitPrice === null) {
      return {
        response: `¿A cuánto vendiste "${product.name}"? Escribe: vendí ${p.qty} ${product.name} a <precio>`,
        success: false,
      };
    }

    saleItems.push({
      productId: product.id,
      qty: Math.round(p.qty),
      unitPrice,
    });
  }

  const result = await recordSale(warehouseId, userId, saleItems, "CHAT");

  const totalProfit = Number(result.totalProfit);
  const totalRevenue = Number(result.totalRevenue);

  return {
    response: `Venta registrada. Total: ${formatSoles(totalRevenue)} | Ganancia: ${formatSoles(totalProfit)}`,
    success: true,
    data: result,
  };
}

export async function executeStockQuery(
  intent: Extract<ChatIntent, { intent: "STOCK_QUERY" }>,
  warehouseId: string
): Promise<ExecResult> {
  const product = await findProductByName(warehouseId, intent.productName);
  if (!product) {
    return {
      response: `No encontré "${intent.productName}" en el inventario.`,
      success: false,
    };
  }

  const inventory = await prisma.inventory.findUnique({
    where: { productId: product.id },
  });

  const qty = inventory?.qtyOnHand ?? 0;
  const cost = inventory?.avgUnitCost ? Number(inventory.avgUnitCost) : 0;

  return {
    response: `${product.name}: ${qty} unidades en stock (costo prom: ${formatSoles(cost)})`,
    success: true,
    data: { productId: product.id, name: product.name, qty, avgCost: cost },
  };
}

export async function executeProfitQuery(
  intent: Extract<ChatIntent, { intent: "PROFIT_QUERY" }>,
  warehouseId: string
): Promise<ExecResult> {
  let from: Date;
  const to = endOfDayLima();
  const periodLabel: string =
    intent.period === "today"
      ? "hoy"
      : intent.period === "week"
        ? "esta semana"
        : "este mes";

  switch (intent.period) {
    case "today":
      from = startOfDayLima();
      break;
    case "week":
      from = startOfWeekLima();
      break;
    case "month":
      from = startOfMonthLima();
      break;
  }

  const sales = await prisma.sale.findMany({
    where: {
      warehouseId,
      soldAt: { gte: from, lte: to },
    },
    include: { items: true },
  });

  let totalRevenue = 0;
  let totalProfit = 0;
  for (const sale of sales) {
    for (const item of sale.items) {
      totalRevenue += Number(item.unitPrice) * item.qty;
      totalProfit += Number(item.profit);
    }
  }

  return {
    response: `Ganancia ${periodLabel}: ${formatSoles(totalProfit)} (ventas: ${formatSoles(totalRevenue)}, ${sales.length} transacciones)`,
    success: true,
    data: { totalRevenue, totalProfit, salesCount: sales.length },
  };
}

export async function executeDebtPayment(
  intent: Extract<ChatIntent, { intent: "DEBT_PAYMENT" }>,
  warehouseId: string
): Promise<ExecResult> {
  // Find debtor by name (fuzzy)
  const debtors = await prisma.debtor.findMany({
    where: { warehouseId },
  });

  const normalizedInput = intent.debtorName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const debtor = debtors.find((d) => {
    const norm = d.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return norm.includes(normalizedInput) || normalizedInput.includes(norm);
  });

  if (!debtor) {
    return {
      response: `No encontré a "${intent.debtorName}" en deudores.`,
      success: false,
    };
  }

  // Find open debts, apply payment to oldest first
  const openDebts = await prisma.debt.findMany({
    where: { debtorId: debtor.id, status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });

  if (openDebts.length === 0) {
    return {
      response: `${debtor.name} no tiene deudas pendientes.`,
      success: false,
    };
  }

  let remaining = intent.amount;

  await prisma.$transaction(async (tx) => {
    for (const debt of openDebts) {
      if (remaining <= 0) break;

      const debtAmount = Number(debt.amount);
      // Calculate total already paid
      const payments = await tx.debtPayment.findMany({
        where: { debtId: debt.id },
      });
      const totalPaid = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const pendingAmount = debtAmount - totalPaid;

      if (pendingAmount <= 0) {
        await tx.debt.update({
          where: { id: debt.id },
          data: { status: "PAID" },
        });
        continue;
      }

      const payAmount = Math.min(remaining, pendingAmount);

      await tx.debtPayment.create({
        data: {
          debtId: debt.id,
          amount: payAmount,
        },
      });

      if (payAmount >= pendingAmount) {
        await tx.debt.update({
          where: { id: debt.id },
          data: { status: "PAID" },
        });
      }

      remaining -= payAmount;
    }
  });

  // Recalculate total pending
  const updatedDebts = await prisma.debt.findMany({
    where: { debtorId: debtor.id, status: "OPEN" },
    include: { payments: true },
  });

  let totalPending = 0;
  for (const d of updatedDebts) {
    const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
    totalPending += Number(d.amount) - paid;
  }

  return {
    response: `Pago de ${formatSoles(intent.amount)} registrado para ${debtor.name}. Deuda restante: ${formatSoles(Math.max(0, totalPending))}`,
    success: true,
    data: { debtorId: debtor.id, paid: intent.amount, remaining: totalPending },
  };
}

export async function executeDebtRegistration(
  params: { debtorName: string; amount: number; note?: string },
  warehouseId: string,
): Promise<ExecResult> {
  if (!params.debtorName || params.amount <= 0) {
    return {
      response: "Indica el nombre del deudor y el monto. Ej: 'Juan me debe 50 soles'",
      success: false,
    };
  }

  const results = await confirmDebts(warehouseId, {
    items: [
      {
        debtorName: params.debtorName,
        amount: params.amount,
        note: params.note,
      },
    ],
  });

  const created = results[0];
  const noteText = params.note ? ` (${params.note})` : "";

  return {
    response: `Deuda registrada: ${created.debtorName} debe ${formatSoles(params.amount)}${noteText}`,
    success: true,
    data: { debtorId: created.debtorName, debtId: created.debtId, amount: params.amount },
  };
}
