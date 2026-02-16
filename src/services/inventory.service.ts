import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { findOrCreateProduct } from "./product.service";
import type { ConfirmPurchaseInput } from "@/schemas/purchase.schema";
import type { Channel } from "@prisma/client";

export async function confirmPurchase(
  warehouseId: string,
  userId: string,
  input: ConfirmPurchaseInput
) {
  return prisma.$transaction(async (tx) => {
    // Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        warehouseId,
        userId,
        vendorName: input.vendorName ?? null,
        imagePath: input.imagePath ?? null,
        rawOcrText: input.rawOcrText ?? null,
        confirmed: true,
        total: 0,
      },
    });

    let purchaseTotal = 0;

    for (const item of input.items) {
      // Find or create product
      const product = await findOrCreateProduct(warehouseId, item.productName);
      if (!product) {
        throw new AppError("PRODUCT_CREATE_FAILED", 500, {
          productName: item.productName,
        });
      }

      const subtotal = item.qty * item.unitCost;
      purchaseTotal += subtotal;

      // Create purchase item
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: product.id,
          productNameText: item.productName,
          qty: item.qty,
          unitCost: item.unitCost,
          subtotal,
        },
      });

      // Update inventory with weighted average cost
      const inventory = await tx.inventory.findUnique({
        where: { productId: product.id },
      });

      const oldQty = inventory?.qtyOnHand ?? 0;
      const oldAvg = inventory ? Number(inventory.avgUnitCost) : 0;
      const newQty = oldQty + item.qty;

      let newAvg: number;
      if (newQty === 0) {
        newAvg = 0;
      } else {
        newAvg =
          (oldQty * oldAvg + item.qty * item.unitCost) / newQty;
      }

      await tx.inventory.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          qtyOnHand: item.qty,
          avgUnitCost: item.unitCost,
        },
        update: {
          qtyOnHand: newQty,
          avgUnitCost: newAvg,
        },
      });
    }

    // Update purchase total
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { total: purchaseTotal },
    });

    return {
      purchaseId: purchase.id,
      total: purchaseTotal,
      itemCount: input.items.length,
    };
  });
}

interface SaleItem {
  productId: string;
  qty: number;
  unitPrice: number;
}

interface SaleResult {
  saleId: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  items: Array<{
    productId: string;
    productName: string;
    qty: number;
    unitPrice: number;
    unitCostSnapshot: number;
    profit: number;
  }>;
}

export async function recordSale(
  warehouseId: string,
  userId: string,
  items: SaleItem[],
  channel: Channel = "MANUAL"
): Promise<SaleResult> {
  return prisma.$transaction(async (tx) => {
    const saleItems: SaleResult["items"] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, warehouseId },
      });

      if (!product) {
        throw new AppError("PRODUCT_NOT_FOUND", 404, {
          productId: item.productId,
        });
      }

      const inventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory || inventory.qtyOnHand < item.qty) {
        throw new AppError("INSUFFICIENT_STOCK", 409, {
          productId: item.productId,
          productName: product.name,
          requested: item.qty,
          available: inventory?.qtyOnHand ?? 0,
        });
      }

      const unitCostSnapshot = Number(inventory.avgUnitCost);
      const lineProfit = (item.unitPrice - unitCostSnapshot) * item.qty;
      const lineRevenue = item.unitPrice * item.qty;

      // Deduct inventory
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          qtyOnHand: inventory.qtyOnHand - item.qty,
        },
      });

      totalRevenue += lineRevenue;
      totalCost += unitCostSnapshot * item.qty;

      saleItems.push({
        productId: item.productId,
        productName: product.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        unitCostSnapshot,
        profit: lineProfit,
      });
    }

    const totalProfit = totalRevenue - totalCost;

    const sale = await tx.sale.create({
      data: {
        warehouseId,
        userId,
        total: totalRevenue,
        channel,
        items: {
          create: saleItems.map((si) => ({
            productId: si.productId,
            qty: si.qty,
            unitPrice: si.unitPrice,
            unitCostSnapshot: si.unitCostSnapshot,
            profit: si.profit,
          })),
        },
      },
    });

    return {
      saleId: sale.id,
      totalRevenue,
      totalCost,
      totalProfit,
      items: saleItems,
    };
  });
}
