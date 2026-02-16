import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { getLowStockProducts } from "@/services/report.service";

export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const threshold = parseInt(url.searchParams.get("threshold") ?? "5", 10);
  const products = await getLowStockProducts(session.warehouseId, threshold);
  return ok(products);
});
