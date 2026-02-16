import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { confirmDebtsSchema } from "@/schemas/debt.schema";
import { confirmDebts } from "@/services/debtor.service";

export const POST = withAuth(async (req, { session }) => {
  const body = await req.json();
  const input = confirmDebtsSchema.parse(body);
  const result = await confirmDebts(session.warehouseId, input);
  return ok(result, 201);
});
