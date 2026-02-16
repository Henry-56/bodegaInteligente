import { prisma } from "@/lib/prisma";
import {
  startOfDayLima,
  endOfDayLima,
  startOfWeekLima,
} from "@/lib/date";

export async function getDashboardData(
  warehouseId: string,
  fromDate?: string,
  toDate?: string
) {
  const from = fromDate ? new Date(fromDate) : startOfDayLima();
  const to = toDate ? new Date(toDate) : endOfDayLima();
  const weekStart = startOfWeekLima();

  // Sales today
  const salesToday = await prisma.sale.findMany({
    where: {
      warehouseId,
      soldAt: { gte: startOfDayLima(), lte: endOfDayLima() },
    },
    include: { items: true },
  });

  let revToday = 0;
  let profitToday = 0;
  for (const s of salesToday) {
    for (const i of s.items) {
      revToday += Number(i.unitPrice) * i.qty;
      profitToday += Number(i.profit);
    }
  }

  // Sales this week
  const salesWeek = await prisma.sale.findMany({
    where: {
      warehouseId,
      soldAt: { gte: weekStart, lte: endOfDayLima() },
    },
    include: { items: true },
  });

  let revWeek = 0;
  let profitWeek = 0;
  for (const s of salesWeek) {
    for (const i of s.items) {
      revWeek += Number(i.unitPrice) * i.qty;
      profitWeek += Number(i.profit);
    }
  }

  // Top 5 products by qty sold (this week)
  const allWeekItems = salesWeek.flatMap((s) => s.items);
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of allWeekItems) {
    const existing = productMap.get(item.productId);
    if (existing) {
      existing.qty += item.qty;
      existing.revenue += Number(item.unitPrice) * item.qty;
    } else {
      productMap.set(item.productId, {
        name: "", // will fill below
        qty: item.qty,
        revenue: Number(item.unitPrice) * item.qty,
      });
    }
  }

  // Fill product names
  const productIds = Array.from(productMap.keys());
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    for (const p of products) {
      const entry = productMap.get(p.id);
      if (entry) entry.name = p.name;
    }
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Low stock (< 5 units)
  const lowStock = await prisma.inventory.findMany({
    where: {
      product: { warehouseId },
      qtyOnHand: { lt: 5 },
    },
    include: { product: true },
    orderBy: { qtyOnHand: "asc" },
  });

  // Total debt
  const debtors = await prisma.debtor.findMany({
    where: { warehouseId },
    include: {
      debts: {
        where: { status: "OPEN" },
        include: { payments: true },
      },
    },
  });

  let totalDebt = 0;
  for (const d of debtors) {
    for (const debt of d.debts) {
      const paid = debt.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      totalDebt += Number(debt.amount) - paid;
    }
  }

  return {
    today: {
      revenue: revToday,
      profit: profitToday,
      salesCount: salesToday.length,
    },
    week: {
      revenue: revWeek,
      profit: profitWeek,
      salesCount: salesWeek.length,
    },
    topProducts,
    lowStock: lowStock.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      qtyOnHand: i.qtyOnHand,
    })),
    totalDebt,
  };
}

export async function getLowStockProducts(
  warehouseId: string,
  threshold = 5
) {
  return prisma.inventory.findMany({
    where: {
      product: { warehouseId },
      qtyOnHand: { lt: threshold },
    },
    include: { product: true },
    orderBy: { qtyOnHand: "asc" },
  });
}
