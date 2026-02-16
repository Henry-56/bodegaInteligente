import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  qty: z.number().int().positive("Cantidad debe ser positiva"),
  unitPrice: z.number().nonnegative("Precio no puede ser negativo"),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
  channel: z.enum(["MANUAL", "CHAT"]).default("MANUAL"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
