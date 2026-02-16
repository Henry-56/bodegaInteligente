import { prisma } from "@/lib/prisma";

export async function getSalesHistory(
  warehouseId: string,
  from?: Date,
  to?: Date,
  limit = 50
) {
  return prisma.sale.findMany({
    where: {
      warehouseId,
      ...(from || to
        ? {
            soldAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { soldAt: "desc" },
    take: limit,
  });
}
