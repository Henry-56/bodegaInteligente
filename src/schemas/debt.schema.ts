import { z } from "zod";

export const confirmDebtItemSchema = z.object({
  debtorName: z.string().min(1, "Nombre de deudor requerido").trim(),
  phone: z.string().trim().optional(),
  amount: z.number().positive("Monto debe ser positivo"),
  note: z.string().trim().optional(),
});

export const confirmDebtsSchema = z.object({
  imagePath: z.string().optional(),
  rawOcrText: z.string().optional(),
  items: z
    .array(confirmDebtItemSchema)
    .min(1, "Debe incluir al menos un deudor"),
});

export const paymentSchema = z.object({
  amount: z.number().positive("Monto debe ser positivo"),
});

export type ConfirmDebtsInput = z.infer<typeof confirmDebtsSchema>;
export type ConfirmDebtItemInput = z.infer<typeof confirmDebtItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
