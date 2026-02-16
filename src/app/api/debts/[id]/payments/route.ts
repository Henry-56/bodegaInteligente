import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { paymentSchema } from "@/schemas/debt.schema";
import { registerPayment } from "@/services/debtor.service";

export const POST = withAuth(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const { amount } = paymentSchema.parse(body);
  const result = await registerPayment(id, amount);
  return ok(result, 201);
});
