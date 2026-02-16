import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200).trim(),
  salePriceDefault: z.number().nonnegative("Precio no puede ser negativo").optional(),
  initialQty: z.number().int().nonnegative().default(0),
  initialCost: z.number().nonnegative().default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  salePriceDefault: z.number().nonnegative().nullable().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
