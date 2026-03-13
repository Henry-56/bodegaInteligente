import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { getInventoryHistory } from "@/services/inventory.service";

export const GET = withAuth(async (req, { params, session }) => {
  const { id } = await params;
  const history = await getInventoryHistory(session.warehouseId, id);
  return ok(history);
});
