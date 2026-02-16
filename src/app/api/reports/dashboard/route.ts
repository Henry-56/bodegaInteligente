import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { getDashboardData } from "@/services/report.service";

export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const data = await getDashboardData(session.warehouseId, from, to);
  return ok(data);
});
