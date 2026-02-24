import { prisma } from "@/lib/prisma";
import { normalizeProductName, levenshtein } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema";

const FUZZY_THRESHOLD = 0.3;

export async function listProducts(warehouseId: string, search?: string) {
  const where: any = { warehouseId };

  if (search) {
    const normalized = normalizeProductName(search);
    where.name = { contains: search, mode: "insensitive" };
  }

  return prisma.product.findMany({
    where,
    include: { inventory: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(
  warehouseId: string,
  input: CreateProductInput
) {
  const product = await prisma.product.create({
    data: {
      warehouseId,
      name: input.name.trim(),
      salePriceDefault: input.salePriceDefault ?? null,
    },
  });

  await prisma.inventory.create({
    data: {
      productId: product.id,
      qtyOnHand: input.initialQty,
      avgUnitCost: input.initialCost,
    },
  });

  return prisma.product.findUnique({
    where: { id: product.id },
    include: { inventory: true },
  });
}

export async function updateProduct(
  productId: string,
  warehouseId: string,
  input: UpdateProductInput
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, warehouseId },
  });

  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", 404);
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name?.trim() ?? product.name,
      salePriceDefault: input.salePriceDefault !== undefined
        ? input.salePriceDefault
        : product.salePriceDefault,
      inventory: input.qtyOnHand !== undefined
        ? {
            update: {
              qtyOnHand: input.qtyOnHand,
            },
          }
        : undefined,
    },
    include: { inventory: true },
  });
}

export async function deleteProduct(productId: string, warehouseId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, warehouseId },
  });

  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", 404);
  }

  // Delete inventory first, then product
  await prisma.inventory.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
}

export async function findProductByName(
  warehouseId: string,
  inputName: string
) {
  const normalized = normalizeProductName(inputName);

  // Tier 1: Exact match on normalized name
  const allProducts = await prisma.product.findMany({
    where: { warehouseId },
    include: { inventory: true },
  });

  const exactMatch = allProducts.find(
    (p) => normalizeProductName(p.name) === normalized
  );
  if (exactMatch) return exactMatch;

  // Tier 2: Contains match
  const containsMatches = allProducts.filter((p) => {
    const pNorm = normalizeProductName(p.name);
    return pNorm.includes(normalized) || normalized.includes(pNorm);
  });

  if (containsMatches.length === 1) return containsMatches[0];
  if (containsMatches.length > 1) {
    // Pick the shortest name (most specific match)
    return containsMatches.sort((a, b) => a.name.length - b.name.length)[0];
  }

  // Tier 3: Fuzzy match (Levenshtein)
  let bestMatch: (typeof allProducts)[0] | null = null;
  let bestRatio = Infinity;

  for (const p of allProducts) {
    const pNorm = normalizeProductName(p.name);
    const distance = levenshtein(normalized, pNorm);
    const maxLen = Math.max(normalized.length, pNorm.length);
    const ratio = distance / maxLen;

    if (ratio < FUZZY_THRESHOLD && ratio < bestRatio) {
      bestRatio = ratio;
      bestMatch = p;
    }
  }

  return bestMatch;
}

export async function findOrCreateProduct(
  warehouseId: string,
  productName: string
) {
  const existing = await findProductByName(warehouseId, productName);
  if (existing) return existing;

  // Create new product
  const product = await prisma.product.create({
    data: {
      warehouseId,
      name: productName.trim(),
    },
  });

  await prisma.inventory.create({
    data: {
      productId: product.id,
      qtyOnHand: 0,
      avgUnitCost: 0,
    },
  });

  return prisma.product.findUnique({
    where: { id: product.id },
    include: { inventory: true },
  });
}
