import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { updateProductSchema } from "@/schemas/product.schema";
import { updateProduct, deleteProduct } from "@/services/product.service";

export const PUT = withAuth(async (req, { params, session }) => {
  const { id } = await params;
  const body = await req.json();
  const input = updateProductSchema.parse(body);
  const product = await updateProduct(id, session.warehouseId, input);
  return ok(product);
});

export const DELETE = withAuth(async (req, { params, session }) => {
  const { id } = await params;
  await deleteProduct(id, session.warehouseId);
  return ok({ deleted: true });
});
