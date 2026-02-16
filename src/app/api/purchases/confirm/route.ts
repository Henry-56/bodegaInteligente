import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { confirmPurchaseSchema } from "@/schemas/purchase.schema";
import { confirmPurchase } from "@/services/inventory.service";

export const POST = withAuth(async (req, { session }) => {
  const body = await req.json();
  const input = confirmPurchaseSchema.parse(body);
  const result = await confirmPurchase(
    session.warehouseId,
    session.userId,
    input
  );
  return ok(result, 201);
});
