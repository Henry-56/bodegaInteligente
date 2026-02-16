import { z } from "zod";

export const confirmPurchaseItemSchema = z.object({
  productName: z.string().min(1, "Nombre de producto requerido").trim(),
  qty: z.number().int().positive("Cantidad debe ser positiva"),
  unitCost: z.number().positive("Costo unitario debe ser positivo"),
});

export const confirmPurchaseSchema = z.object({
  purchaseId: z.string().optional(),
  vendorName: z.string().trim().optional(),
  imagePath: z.string().optional(),
  rawOcrText: z.string().optional(),
  items: z
    .array(confirmPurchaseItemSchema)
    .min(1, "Debe incluir al menos un item"),
});

export type ConfirmPurchaseInput = z.infer<typeof confirmPurchaseSchema>;
export type ConfirmPurchaseItemInput = z.infer<typeof confirmPurchaseItemSchema>;
