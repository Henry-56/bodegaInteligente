import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { createSaleSchema } from "@/schemas/sale.schema";
import { recordSale } from "@/services/inventory.service";
import { getSalesHistory } from "@/services/sale.service";

export const GET = withAuth(async (req, { session }) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const sales = await getSalesHistory(
    session.warehouseId,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined
  );
  return ok(sales);
});

export const POST = withAuth(async (req, { session }) => {
  const body = await req.json();
  const input = createSaleSchema.parse(body);
  const result = await recordSale(
    session.warehouseId,
    session.userId,
    input.items,
    input.channel
  );
  return ok(result, 201);
});
