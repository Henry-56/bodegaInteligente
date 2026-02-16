import { NextRequest } from "next/server";
import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { createProductSchema } from "@/schemas/product.schema";
import { listProducts, createProduct } from "@/services/product.service";

export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const products = await listProducts(session.warehouseId, search);
  return ok(products);
});

export const POST = withAuth(async (req, { session }) => {
  const body = await req.json();
  const input = createProductSchema.parse(body);
  const product = await createProduct(session.warehouseId, input);
  return ok(product, 201);
});
