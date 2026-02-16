import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { listDebtors } from "@/services/debtor.service";

export const GET = withAuth(async (req, { session }) => {
  const debtors = await listDebtors(session.warehouseId);
  return ok(debtors);
});
