import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const movements = await prisma.inventoryMovement.findMany({
    where: {
      product: { warehouseId: session.warehouseId },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, salePriceDefault: true },
      },
      purchaseItem: {
        include: {
          purchase: { select: { vendorName: true, purchasedAt: true } },
        },
      },
      saleItem: {
        include: {
          sale: { select: { soldAt: true, channel: true } },
        },
      },
    },
  });

  return ok(movements);
});
